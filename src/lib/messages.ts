import { format, parse, getISOWeek, getISOWeekYear } from 'date-fns';
import type { DailyEntry, EnergyLevel, StressLevel, MoodLevel, SleepQuality } from './types';

/**
 * Frases contextuais exibidas após salvar o check-in.
 * Uma frase diferente é selecionada por dia.
 */
const checkInMessages = [
  'Anotado. Pequenos registros ajudam a revelar padrões ao longo do tempo.',
  'Registro salvo. Observe como você se sente amanhã.',
  'Pronto. Cada anotação é um passo para se conhecer melhor.',
  'Salvo. Às vezes, só pausar para registrar já faz diferença.',
  'Anotado. Volte quando quiser — sem pressa.',
  'Registro feito. Cuidar de si começa com pequenas atenções.',
  'Guardado. Você pode revisitar seus registros a qualquer momento.',
];

// FIX BUG 11 (DRY): getDayHash extraído — antes estava copy-pasted em 3 lugares
function getDayHash(): number {
  const today = format(new Date(), 'yyyy-MM-dd');
  return today.split('-').reduce((acc, part) => acc + parseInt(part, 10), 0);
}

/**
 * Retorna uma frase contextual baseada no dia atual.
 * A mesma frase é exibida durante todo o dia.
 */
export function getCheckInMessage(): string {
  return checkInMessages[getDayHash() % checkInMessages.length];
}

/**
 * Sugestões leves e opcionais para o usuário experimentar.
 */
const suggestions = [
  {
    id: 'pausa-curta',
    text: 'Algumas pessoas percebem diferença ao fazer uma pausa curta quando o estresse sobe.',
    relatedTo: 'stress' as const,
  },
  {
    id: 'luz-natural',
    text: 'Talvez valha observar como alguns minutos de luz natural afetam sua energia.',
    relatedTo: 'energy' as const,
  },
  {
    id: 'respiracao',
    text: 'Uma respiração lenta e profunda pode ajudar a perceber como você está se sentindo.',
    relatedTo: 'stress' as const,
  },
  {
    id: 'movimento',
    text: 'Um movimento leve, como uma caminhada curta, às vezes muda a perspectiva do dia.',
    relatedTo: 'energy' as const,
  },
  {
    id: 'sono-rotina',
    text: 'Observar o que você faz antes de dormir pode revelar padrões sobre a qualidade do sono.',
    relatedTo: 'sleep' as const,
  },
  {
    id: 'agua',
    text: 'Algumas pessoas notam mudanças na energia ao prestar atenção na hidratação.',
    relatedTo: 'energy' as const,
  },
];

export interface Suggestion {
  id: string;
  text: string;
  relatedTo: 'stress' | 'energy' | 'sleep' | 'mood';
}

/**
 * Retorna uma sugestão relevante baseada nos dados recentes.
 * Prioriza sugestões relacionadas a áreas com tendências negativas.
 */
export function getSuggestion(entries: DailyEntry[], ignoredIds: string[]): Suggestion | null {
  if (entries.length < 3) return null;

  const available = suggestions.filter(s => !ignoredIds.includes(s.id));
  if (available.length === 0) return null;

  // Analisa tendências recentes
  const recentEntries = entries.slice(0, 5);
  const highStress = recentEntries.filter(e => e.stressLevel === 'alto').length >= 2;
  const lowEnergy = recentEntries.filter(e => e.energy === 'baixa').length >= 2;
  const poorSleep = recentEntries.filter(e => e.sleepQuality === 'ruim').length >= 2;

  // Prioriza sugestões relevantes
  let prioritized = available;
  if (highStress) {
    prioritized = available.filter(s => s.relatedTo === 'stress');
  } else if (lowEnergy) {
    prioritized = available.filter(s => s.relatedTo === 'energy');
  } else if (poorSleep) {
    prioritized = available.filter(s => s.relatedTo === 'sleep');
  }

  const pool = prioritized.length > 0 ? prioritized : available;
  
  return pool[getDayHash() % pool.length];
}

const energyValues: Record<EnergyLevel, number> = { baixa: 0, media: 1, alta: 2 };
const moodValues: Record<MoodLevel, number> = { triste: 0, neutro: 1, feliz: 2 };
const sleepValues: Record<SleepQuality, number> = { ruim: 0, ok: 1, boa: 2 };
const stressValues: Record<StressLevel, number> = { baixo: 0, medio: 1, alto: 2 };

/**
 * Gera um micro-insight textual baseado nos dados disponíveis.
 * Inclui: correlações entre categorias, padrões temporais, dados numéricos específicos.
 * Mínimo 2-3 frases quando houver dados suficientes.
 */
export function generateInsight(entries: DailyEntry[]): string | null {
  if (entries.length < 2) return null;

  // Entradas ordenadas do mais antigo ao mais recente (para análise temporal)
  const sortedByDate = [...entries].sort((a, b) => {
    const da = parse(a.date, 'yyyy-MM-dd', new Date()).getTime();
    const db = parse(b.date, 'yyyy-MM-dd', new Date()).getTime();
    return da - db;
  });
  const recentEntries = sortedByDate.slice(-7); // últimos 7 registros (não dias)
  const n = recentEntries.length;

  const parts: string[] = [];

  // --- Estatísticas numéricas ---
  const highEnergyCount = recentEntries.filter(e => e.energy === 'alta').length;
  const lowEnergyCount = recentEntries.filter(e => e.energy === 'baixa').length;
  const highStressCount = recentEntries.filter(e => e.stressLevel === 'alto').length;
  const lowStressCount = recentEntries.filter(e => e.stressLevel === 'baixo').length;
  const poorSleepCount = recentEntries.filter(e => e.sleepQuality === 'ruim').length;
  const goodSleepCount = recentEntries.filter(e => e.sleepQuality === 'boa').length;
  const happyCount = recentEntries.filter(e => e.mood === 'feliz').length;
  const sadCount = recentEntries.filter(e => e.mood === 'triste').length;

  const avgEnergy = recentEntries.reduce((s, e) => s + energyValues[e.energy], 0) / n;
  const avgMood = recentEntries.reduce((s, e) => s + moodValues[e.mood], 0) / n;
  const avgSleep = recentEntries.reduce((s, e) => s + sleepValues[e.sleepQuality], 0) / n;
  const avgStress = recentEntries.reduce((s, e) => s + stressValues[e.stressLevel], 0) / n;

  // --- Padrões temporais (melhora ou piora ao longo do tempo) ---
  if (n >= 4) {
    const half = Math.floor(n / 2);
    const firstHalf = recentEntries.slice(0, half);
    const secondHalf = recentEntries.slice(half);

    const avgMoodFirst = firstHalf.reduce((s, e) => s + moodValues[e.mood], 0) / firstHalf.length;
    const avgMoodSecond = secondHalf.reduce((s, e) => s + moodValues[e.mood], 0) / secondHalf.length;
    const moodTrend = avgMoodSecond - avgMoodFirst;

    const avgEnergyFirst = firstHalf.reduce((s, e) => s + energyValues[e.energy], 0) / firstHalf.length;
    const avgEnergySecond = secondHalf.reduce((s, e) => s + energyValues[e.energy], 0) / secondHalf.length;
    const energyTrend = avgEnergySecond - avgEnergyFirst;

    const avgStressFirst = firstHalf.reduce((s, e) => s + stressValues[e.stressLevel], 0) / firstHalf.length;
    const avgStressSecond = secondHalf.reduce((s, e) => s + stressValues[e.stressLevel], 0) / secondHalf.length;
    const stressTrend = avgStressSecond - avgStressFirst;

    if (moodTrend >= 0.4 && n >= 4) {
      parts.push(`Seu humor tem melhorado nos últimos ${Math.min(n, 5)} dias.`);
    } else if (moodTrend <= -0.4 && n >= 4) {
      parts.push(`Seu humor mostrou uma tendência de queda nos últimos dias.`);
    }

    if (energyTrend >= 0.4 && n >= 4) {
      parts.push(`Sua energia tem subido nas entradas mais recentes.`);
    } else if (energyTrend <= -0.4 && n >= 4) {
      parts.push(`Sua energia tem diminuído nos registros recentes.`);
    }

    if (stressTrend <= -0.4 && n >= 4) {
      parts.push(`O estresse tem diminuído ao longo dos últimos dias.`);
    } else if (stressTrend >= 0.4 && n >= 4) {
      parts.push(`O estresse tem aumentado nas entradas recentes.`);
    }
  }

  // --- Correlações entre categorias ---
  if (n >= 3) {
    const poorSleepDays = recentEntries.filter(e => e.sleepQuality === 'ruim');
    if (poorSleepDays.length >= 2) {
      const lowEnergyOnPoorSleep = poorSleepDays.filter(e => e.energy === 'baixa' || e.energy === 'media').length;
      if (lowEnergyOnPoorSleep >= poorSleepDays.length * 0.6) {
        parts.push(`Nos ${poorSleepDays.length} dias em que você dormiu mal, sua energia ficou baixa ou média.`);
      }
    }

    const highStressDays = recentEntries.filter(e => e.stressLevel === 'alto');
    if (highStressDays.length >= 2) {
      const lowMoodOnHighStress = highStressDays.filter(e => e.mood === 'triste' || e.mood === 'neutro').length;
      if (lowMoodOnHighStress >= highStressDays.length * 0.6) {
        parts.push(`Nos ${highStressDays.length} dias com estresse alto, seu humor tendeu a ficar mais baixo.`);
      }
    }

    const goodSleepDays = recentEntries.filter(e => e.sleepQuality === 'boa');
    if (goodSleepDays.length >= 2) {
      const highEnergyOnGoodSleep = goodSleepDays.filter(e => e.energy === 'alta' || e.energy === 'media').length;
      if (highEnergyOnGoodSleep >= goodSleepDays.length * 0.6) {
        parts.push(`Nos ${goodSleepDays.length} dias com sono bom, sua energia ficou mais alta.`);
      }
    }
  }

  // --- Insights com dados numéricos específicos ---
  if (highEnergyCount >= Math.ceil(n * 0.5) && n >= 3) {
    parts.push(`${highEnergyCount} de ${n} registros mostram energia alta.`);
  } else if (lowEnergyCount >= 2 && n >= 3) {
    parts.push(`Sua energia apareceu baixa em ${lowEnergyCount} dos últimos ${n} registros.`);
  }

  if (highStressCount >= 2 && n >= 3) {
    parts.push(`O estresse esteve alto em ${highStressCount} dias recentes.`);
  } else if (lowStressCount >= Math.ceil(n * 0.6) && n >= 3) {
    parts.push(`Em ${lowStressCount} de ${n} dias o estresse permaneceu baixo.`);
  }

  if (poorSleepCount >= 2 && n >= 3) {
    parts.push(`A qualidade do sono ficou ruim em ${poorSleepCount} dos últimos registros.`);
  } else if (goodSleepCount >= Math.ceil(n * 0.5) && n >= 3) {
    parts.push(`${goodSleepCount} de ${n} dias tiveram sono de boa qualidade.`);
  }

  if (happyCount >= Math.ceil(n * 0.5) && n >= 3) {
    parts.push(`Seu humor esteve positivo em ${happyCount} dos últimos ${n} registros.`);
  } else if (sadCount >= 2 && n >= 3) {
    parts.push(`O humor apareceu triste em ${sadCount} dias recentes.`);
  }

  // Energia estável (baixa variância)
  const energyVariance = recentEntries.reduce((s, e) =>
    s + Math.pow(energyValues[e.energy] - avgEnergy, 2), 0) / n;
  if (energyVariance < 0.25 && n >= 3 && parts.length < 3) {
    if (avgEnergy >= 1.5) {
      parts.push('Sua energia tem se mantido estável e em bom nível.');
    } else if (avgEnergy >= 0.8) {
      parts.push('Sua energia tem se mantido estável nos últimos registros.');
    }
  }

  // Evita duplicatas semelhantes e mantém 2-3 frases
  const uniqueParts = Array.from(new Set(parts));
  if (uniqueParts.length === 0) return null;

  // Seleciona até 3 insights mais relevantes (prioriza correlações e temporais)
  const selected = uniqueParts.slice(0, 3);
  const startIdx = getDayHash() % Math.max(1, selected.length);

  const result = selected.slice(startIdx).concat(selected.slice(0, startIdx)).slice(0, 3);
  return result.join(' ');
}

const IGNORED_SUGGESTIONS_KEY = 'clareza-diaria-ignored-suggestions';
const WEEKLY_MESSAGE_KEY = 'clareza-diaria-weekly-message-shown';

/**
 * Recupera IDs de sugestões ignoradas do localStorage
 */
export function getIgnoredSuggestions(): string[] {
  try {
    const stored = localStorage.getItem(IGNORED_SUGGESTIONS_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Adiciona um ID de sugestão à lista de ignorados
 */
export function ignoreSuggestion(id: string): void {
  const current = getIgnoredSuggestions();
  if (!current.includes(id)) {
    current.push(id);
    localStorage.setItem(IGNORED_SUGGESTIONS_KEY, JSON.stringify(current));
  }
}

/**
 * Verifica se a mensagem semanal deve ser exibida.
 * Retorna true apenas uma vez por ciclo de 7 dias distintos.
 */
export function shouldShowWeeklyMessage(distinctDays: number): boolean {
  if (distinctDays < 7) return false;
  
  try {
    const stored = localStorage.getItem(WEEKLY_MESSAGE_KEY);
    if (!stored) return true;
    
    const { week } = JSON.parse(stored);
    const currentWeek = getWeekIdentifier();
    
    return week !== currentWeek;
  } catch {
    return true;
  }
}

/**
 * Marca a mensagem semanal como exibida para a semana atual.
 */
export function markWeeklyMessageShown(): void {
  const currentWeek = getWeekIdentifier();
  localStorage.setItem(WEEKLY_MESSAGE_KEY, JSON.stringify({ week: currentWeek }));
}

/**
 * Gera um identificador único para a semana atual (ISO 8601).
 * FIX BUG 12: algoritmo anterior usava startOfYear.getDay() incorretamente.
 */
export function getWeekIdentifier(): string {
  const now = new Date();
  return `${getISOWeekYear(now)}-W${getISOWeek(now)}`;
}
