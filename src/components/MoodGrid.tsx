import { useMemo } from 'react';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { DailyEntry } from '@/lib/types';
import { moodLabels } from '@/lib/types';
import { cn } from '@/lib/utils';

interface MoodGridProps {
  entries: DailyEntry[];
}

const moodColors: Record<DailyEntry['mood'], string> = {
  feliz: 'bg-emerald-400',
  neutro: 'bg-amber-300',
  triste: 'bg-sky-300',
};

// Mon=0 … Sun=6 (ISO order)
const weekDayLabels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

export function MoodGrid({ entries }: MoodGridProps) {
  const cells = useMemo(() => {
    // Index entries by date — last entry per day wins
    const moodByDate = new Map<string, DailyEntry['mood']>();
    for (const entry of entries) {
      moodByDate.set(entry.date, entry.mood);
    }

    const today = new Date();
    const days: Array<{ date: Date; dateStr: string; mood: DailyEntry['mood'] | null }> = [];
    for (let i = 27; i >= 0; i--) {
      const date = subDays(today, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      days.push({ date, dateStr, mood: moodByDate.get(dateStr) ?? null });
    }

    // Pad the front so the first cell lands on Monday
    const firstDow = days[0].date.getDay(); // JS: 0=Sun … 6=Sat
    const isoFirstDow = firstDow === 0 ? 6 : firstDow - 1; // convert to Mon=0 … Sun=6
    const padding = Array(isoFirstDow).fill(null) as null[];

    return [...padding, ...days];
  }, [entries]);

  if (entries.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-foreground">Humor nos últimos 28 dias</h3>
      <div className="rounded-lg border border-border/50 bg-card p-4">
        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 gap-1.5 mb-1">
          {weekDayLabels.map((d) => (
            <div key={d} className="text-center text-[10px] text-muted-foreground font-medium">
              {d}
            </div>
          ))}
        </div>

        {/* Grid cells */}
        <div className="grid grid-cols-7 gap-1.5">
          {cells.map((cell, i) =>
            cell === null ? (
              <div key={`pad-${i}`} className="aspect-square" />
            ) : (
              <div
                key={cell.dateStr}
                title={`${format(cell.date, "d 'de' MMM", { locale: ptBR })}: ${
                  cell.mood ? moodLabels[cell.mood] : 'sem registro'
                }`}
                className={cn(
                  'aspect-square rounded-md',
                  cell.mood ? moodColors[cell.mood] : 'bg-muted/50'
                )}
              />
            )
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 mt-3 pt-3 border-t border-border/50">
          {(['triste', 'neutro', 'feliz'] as const).map((m) => (
            <div key={m} className="flex items-center gap-1.5">
              <div className={cn('w-3 h-3 rounded-sm', moodColors[m])} />
              <span className="text-xs text-muted-foreground">{moodLabels[m]}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-muted/50" />
            <span className="text-xs text-muted-foreground">Sem registro</span>
          </div>
        </div>
      </div>
    </div>
  );
}
