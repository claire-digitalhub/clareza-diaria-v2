import { format, parse, startOfDay, endOfDay, subDays, isWithinInterval } from 'date-fns';
import type { DailyEntry } from './types';

const STORAGE_KEY = 'clareza-diaria-entries';

// FIX BUG 10: validação de enum — antes só checava typeof string, não os valores válidos
const VALID_ENERGY: DailyEntry['energy'][] = ['baixa', 'media', 'alta'];
const VALID_MOOD: DailyEntry['mood'][] = ['triste', 'neutro', 'feliz'];
const VALID_SLEEP: DailyEntry['sleepQuality'][] = ['ruim', 'ok', 'boa'];
const VALID_STRESS: DailyEntry['stressLevel'][] = ['baixo', 'medio', 'alto'];

function hasValidEnumValues(e: Record<string, unknown>): boolean {
  return (
    VALID_ENERGY.includes(e.energy as DailyEntry['energy']) &&
    VALID_MOOD.includes(e.mood as DailyEntry['mood']) &&
    VALID_SLEEP.includes(e.sleepQuality as DailyEntry['sleepQuality']) &&
    VALID_STRESS.includes(e.stressLevel as DailyEntry['stressLevel'])
  );
}

/**
 * Recupera todas as entradas do localStorage com validação robusta
 */
function getStoredEntries(): DailyEntry[] {
  try {
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (!storedData) return [];

    const parsedData = JSON.parse(storedData);
    
    if (!Array.isArray(parsedData)) {
      console.error('Dados do localStorage não são um array');
      localStorage.removeItem(STORAGE_KEY);
      return [];
    }

    // Valida estrutura das entradas, valores de enum e normaliza notes
    const validEntries = parsedData
      .filter((entry: unknown): entry is Record<string, unknown> => {
        if (!entry || typeof entry !== 'object') return false;
        const e = entry as Record<string, unknown>;
        return (
          typeof e.date === 'string' &&
          /^\d{4}-\d{2}-\d{2}$/.test(e.date as string) &&
          typeof e.energy === 'string' &&
          typeof e.mood === 'string' &&
          typeof e.sleepQuality === 'string' &&
          typeof e.stressLevel === 'string' &&
          hasValidEnumValues(e)
        );
      })
      .map((e): DailyEntry => ({
        date: e.date as string,
        energy: e.energy as DailyEntry['energy'],
        mood: e.mood as DailyEntry['mood'],
        sleepQuality: e.sleepQuality as DailyEntry['sleepQuality'],
        stressLevel: e.stressLevel as DailyEntry['stressLevel'],
        notes: e.notes != null && typeof e.notes === 'string' && e.notes.length > 0
          ? e.notes.slice(0, 500)
          : undefined,
      }));

    if (validEntries.length !== parsedData.length) {
      console.warn('Algumas entradas inválidas foram filtradas');
      saveEntries(validEntries);
    }

    return validEntries;
  } catch (error) {
    console.error('Erro ao ler localStorage:', error);
    localStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

/**
 * Salva entradas no localStorage
 */
function saveEntries(entries: DailyEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch (error) {
    console.error('Erro ao salvar no localStorage:', error);
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.error('Cota do localStorage excedida');
    }
  }
}

/**
 * Salva um novo check-in diário
 * Sempre adiciona uma nova entrada (permite múltiplos check-ins por dia)
 */
export function saveDailyEntry(entry: Omit<DailyEntry, 'date'>): void {
  const entries = getStoredEntries();
  const today = new Date();
  const notes = entry.notes?.trim();
  const newEntry: DailyEntry = {
    ...entry,
    date: format(today, 'yyyy-MM-dd'),
    notes: notes && notes.length > 0 ? notes.slice(0, 500) : undefined,
  };

  entries.push(newEntry);
  
  // Ordena por data decrescente
  const sortedEntries = entries.sort((a, b) => {
    const dateA = parse(a.date, 'yyyy-MM-dd', new Date());
    const dateB = parse(b.date, 'yyyy-MM-dd', new Date());
    return dateB.getTime() - dateA.getTime();
  });

  saveEntries(sortedEntries);
}

/**
 * Recupera entradas dos últimos N dias (hoje + N-1 dias anteriores)
 */
export function getEntriesForLastNDays(days: number): DailyEntry[] {
  const allEntries = getStoredEntries();
  const today = new Date();
  const startDate = subDays(today, days - 1);

  const intervalStart = startOfDay(startDate);
  const intervalEnd = endOfDay(today);

  return allEntries.filter(entry => {
    try {
      const entryDate = parse(entry.date, 'yyyy-MM-dd', new Date());
      return isWithinInterval(entryDate, { start: intervalStart, end: intervalEnd });
    } catch {
      return false;
    }
  });
}

/**
 * Recupera entradas dos últimos 7 dias (hoje + 6 dias anteriores)
 */
export function getEntriesForLast7Days(): DailyEntry[] {
  return getEntriesForLastNDays(7);
}

/**
 * Recupera todas as entradas armazenadas
 */
export function getAllEntries(): DailyEntry[] {
  return getStoredEntries();
}

/**
 * Conta quantos dias distintos têm entradas
 */
export function getDistinctDaysCount(entries: DailyEntry[]): number {
  const uniqueDates = new Set(entries.map(e => e.date));
  return uniqueDates.size;
}

/**
 * Agrupa entradas por data
 */
export function groupEntriesByDate(entries: DailyEntry[]): Map<string, DailyEntry[]> {
  const grouped = new Map<string, DailyEntry[]>();
  
  for (const entry of entries) {
    const existing = grouped.get(entry.date) || [];
    existing.push(entry);
    grouped.set(entry.date, existing);
  }
  
  return grouped;
}

/**
 * Verifica se há check-in para a data de hoje
 */
export function hasCheckedInToday(): boolean {
  const entries = getStoredEntries();
  const today = format(new Date(), 'yyyy-MM-dd');
  return entries.some(e => e.date === today);
}

/**
 * Calcula a sequência de dias consecutivos com check-in (streak).
 * Conta a partir de ontem em ordem decrescente.
 */
export function getStreakCount(): number {
  const entries = getStoredEntries();
  if (entries.length === 0) return 0;

  const uniqueDates = [...new Set(entries.map(e => e.date))].sort((a, b) =>
    parse(b, 'yyyy-MM-dd', new Date()).getTime() - parse(a, 'yyyy-MM-dd', new Date()).getTime()
  );

  let streak = 0;
  const today = format(new Date(), 'yyyy-MM-dd');
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');

  // Se hoje tem check-in, começa a contar de hoje. Senão, de ontem.
  const startDate = uniqueDates.includes(today) ? today : uniqueDates.includes(yesterday) ? yesterday : null;
  if (!startDate) return 0;

  let currentDate = parse(startDate, 'yyyy-MM-dd', new Date());
  const dateSet = new Set(uniqueDates);

  while (dateSet.has(format(currentDate, 'yyyy-MM-dd'))) {
    streak++;
    currentDate = subDays(currentDate, 1);
  }

  return streak;
}
