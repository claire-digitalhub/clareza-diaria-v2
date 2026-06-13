// Tipos compartilhados para o Clareza Diária

export interface DailyEntry {
  date: string; // Formato YYYY-MM-DD (fuso local)
  energy: 'baixa' | 'media' | 'alta';
  mood: 'triste' | 'neutro' | 'feliz';
  sleepQuality: 'ruim' | 'ok' | 'boa';
  stressLevel: 'baixo' | 'medio' | 'alto';
  notes?: string; // Campo opcional, máximo 500 caracteres
}

export type EnergyLevel = DailyEntry['energy'];
export type MoodLevel = DailyEntry['mood'];
export type SleepQuality = DailyEntry['sleepQuality'];
export type StressLevel = DailyEntry['stressLevel'];

// Labels em português para exibição
export const energyLabels: Record<EnergyLevel, string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
};

export const moodLabels: Record<MoodLevel, string> = {
  triste: 'Triste',
  neutro: 'Neutro',
  feliz: 'Feliz',
};

export const sleepLabels: Record<SleepQuality, string> = {
  ruim: 'Ruim',
  ok: 'Ok',
  boa: 'Boa',
};

export const stressLabels: Record<StressLevel, string> = {
  baixo: 'Baixo',
  medio: 'Médio',
  alto: 'Alto',
};

// Emojis para cada categoria
export const energyEmojis: Record<EnergyLevel, string> = {
  baixa: '🔋',
  media: '⚡',
  alta: '🚀',
};

export const moodEmojis: Record<MoodLevel, string> = {
  triste: '😔',
  neutro: '😐',
  feliz: '😊',
};

export const sleepEmojis: Record<SleepQuality, string> = {
  ruim: '😴',
  ok: '🛏️',
  boa: '✨',
};

export const stressEmojis: Record<StressLevel, string> = {
  baixo: '🧘',
  medio: '😤',
  alto: '🔥',
};
