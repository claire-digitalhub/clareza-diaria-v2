import { format, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { DailyEntry } from './types';

/**
 * Retorna os top 3 padrões identificados para a semana
 */
export function getWeeklyPatterns(entries: DailyEntry[]): string[] {
  if (entries.length < 3) return [];

  const patterns: string[] = [];
  const n = entries.length;

  const highEnergyCount = entries.filter(e => e.energy === 'alta').length;
  const lowEnergyCount = entries.filter(e => e.energy === 'baixa').length;
  const highStressCount = entries.filter(e => e.stressLevel === 'alto').length;
  const poorSleepCount = entries.filter(e => e.sleepQuality === 'ruim').length;
  const goodSleepCount = entries.filter(e => e.sleepQuality === 'boa').length;
  const happyCount = entries.filter(e => e.mood === 'feliz').length;

  if (highEnergyCount >= Math.ceil(n * 0.5)) {
    patterns.push(`${highEnergyCount} dias com energia alta`);
  }
  if (lowEnergyCount >= 2) {
    patterns.push(`Energia baixa em ${lowEnergyCount} dias`);
  }
  if (highStressCount >= 2) {
    patterns.push(`Estresse alto em ${highStressCount} dias`);
  }
  if (poorSleepCount >= 2) {
    patterns.push(`Sono ruim em ${poorSleepCount} dias`);
  }
  if (goodSleepCount >= Math.ceil(n * 0.5)) {
    patterns.push(`${goodSleepCount} dias com sono bom`);
  }
  if (happyCount >= Math.ceil(n * 0.5)) {
    patterns.push(`Humor positivo em ${happyCount} dias`);
  }

  // Correlação sono-energia
  const poorSleepEntries = entries.filter(e => e.sleepQuality === 'ruim');
  if (poorSleepEntries.length >= 2) {
    const lowEnergyOnPoorSleep = poorSleepEntries.filter(e => e.energy === 'baixa' || e.energy === 'media').length;
    if (lowEnergyOnPoorSleep >= poorSleepEntries.length * 0.6) {
      patterns.push('Sono ruim associado a energia baixa');
    }
  }

  return patterns.slice(0, 3);
}

/**
 * Retorna as 2-3 notas mais significativas da semana (entradas com notas).
 * Considera "significativas" as notas mais longas (> 30 chars) primeiro.
 */
export function getSignificantNotes(entries: DailyEntry[]): { note: string; date: string }[] {
  const withNotes = entries
    .filter(e => e.notes && e.notes.trim().length > 0)
    .map(e => ({ note: e.notes!.trim(), date: e.date }))
    .sort((a, b) => b.note.length - a.note.length) // mais longas primeiro
    .slice(0, 3);

  return withNotes;
}

/**
 * Gera resumo numérico para a semana
 */
export function getWeeklyNumericSummary(entries: DailyEntry[]): string {
  const distinctDays = new Set(entries.map(e => e.date)).size;
  const highEnergyCount = entries.filter(e => e.energy === 'alta').length;
  const highStressCount = entries.filter(e => e.stressLevel === 'alto').length;
  const goodMoodCount = entries.filter(e => e.mood === 'feliz' || e.mood === 'neutro').length;

  const parts: string[] = [`${distinctDays} dia${distinctDays !== 1 ? 's' : ''} registrado${distinctDays !== 1 ? 's' : ''}`];
  if (highEnergyCount > 0) {
    parts.push(`${highEnergyCount} com energia alta`);
  }
  if (highStressCount >= 2) {
    parts.push(`${highStressCount} com estresse elevado`);
  }
  if (goodMoodCount >= distinctDays * 0.6) {
    parts.push(`${Math.round((goodMoodCount / entries.length) * 100)}% de humor neutro ou positivo`);
  }

  return parts.join(', ');
}

/**
 * Gera HTML para impressão/PDF do relatório semanal
 */
export function getWeeklyReportPrintContent(
  entries: DailyEntry[],
  numericSummary: string,
  patterns: string[],
  notes: { note: string; date: string }[]
): string {
  const distinctDays = new Set(entries.map(e => e.date)).size;
  const dateRange = entries.length > 0
    ? (() => {
        const dates = [...entries.map(e => parse(e.date, 'yyyy-MM-dd', new Date()))];
        const min = new Date(Math.min(...dates.map(d => d.getTime())));
        const max = new Date(Math.max(...dates.map(d => d.getTime())));
        return `${format(min, "d 'de' MMM", { locale: ptBR })} a ${format(max, "d 'de' MMM yyyy", { locale: ptBR })}`;
      })()
    : '';

  const patternsHtml = patterns.length > 0
    ? `<section><h3>Padrões identificados</h3><ul>${patterns.map(p => `<li>${p}</li>`).join('')}</ul></section>`
    : '';

  const notesHtml = notes.length > 0
    ? `<section><h3>Suas notas da semana</h3><ul>${notes.map(n => `<li><em>${format(parse(n.date, 'yyyy-MM-dd', new Date()), "d/M")}</em>: ${n.note}</li>`).join('')}</ul></section>`
    : '';

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Relatório Semanal - Clareza Diária</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 600px; margin: 2rem auto; padding: 1rem; color: #333; }
    h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
    .meta { color: #666; font-size: 0.9rem; margin-bottom: 1.5rem; }
    section { margin-bottom: 1.5rem; }
    h3 { font-size: 1rem; margin-bottom: 0.5rem; }
    ul { margin: 0; padding-left: 1.25rem; }
    li { margin-bottom: 0.25rem; }
    @media print { body { margin: 1rem; } }
  </style>
</head>
<body>
  <h1>Clareza Diária – Relatório Semanal</h1>
  <p class="meta">${dateRange}</p>
  <section>
    <h3>Resumo</h3>
    <p>${numericSummary}</p>
  </section>
  ${patternsHtml}
  ${notesHtml}
</body>
</html>
  `.trim();
}
