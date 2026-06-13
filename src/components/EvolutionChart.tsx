import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ChartContainer, ChartTooltip } from '@/components/ui/chart';
import { format, parse, subDays, startOfDay, isWithinInterval, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { DailyEntry } from '@/lib/types';

interface EvolutionChartProps {
  entries: DailyEntry[];
}

// Converte valores categóricos para numéricos
function convertEnergyToNumber(energy: DailyEntry['energy']): number {
  switch (energy) {
    case 'baixa': return 1;
    case 'media': return 2;
    case 'alta': return 3;
  }
}

function convertMoodToNumber(mood: DailyEntry['mood']): number {
  switch (mood) {
    case 'triste': return 1;
    case 'neutro': return 2;
    case 'feliz': return 3;
  }
}

// Formata data para exibição no eixo X
function formatDateLabel(dateStr: string): string {
  const date = parse(dateStr, 'yyyy-MM-dd', new Date());
  return format(date, 'dd/MM', { locale: ptBR });
}

export function EvolutionChart({ entries }: EvolutionChartProps) {
  const chartData = useMemo(() => {
    if (entries.length < 3) return [];

    const today = new Date();
    const sevenDaysAgo = subDays(today, 6);
    const intervalStart = startOfDay(sevenDaysAgo);
    const intervalEnd = endOfDay(today);

    // Filtra apenas últimos 7 dias
    const recentEntries = entries.filter(entry => {
      try {
        const entryDate = parse(entry.date, 'yyyy-MM-dd', new Date());
        return isWithinInterval(entryDate, { start: intervalStart, end: intervalEnd });
      } catch {
        return false;
      }
    });

    // Agrupa por data e calcula médias
    const groupedByDate = new Map<string, { energy: number[]; mood: number[] }>();

    for (const entry of recentEntries) {
      const date = entry.date;
      if (!groupedByDate.has(date)) {
        groupedByDate.set(date, { energy: [], mood: [] });
      }
      const dayData = groupedByDate.get(date)!;
      dayData.energy.push(convertEnergyToNumber(entry.energy));
      dayData.mood.push(convertMoodToNumber(entry.mood));
    }

    // Gera array de datas dos últimos 7 dias
    const dates: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(today, i);
      dates.push(format(date, 'yyyy-MM-dd'));
    }

    // Cria dados do gráfico com médias
    const data = dates.map(date => {
      const dayData = groupedByDate.get(date);
      const energyAvg = dayData?.energy.length
        ? dayData.energy.reduce((a, b) => a + b, 0) / dayData.energy.length
        : null;
      const moodAvg = dayData?.mood.length
        ? dayData.mood.reduce((a, b) => a + b, 0) / dayData.mood.length
        : null;

      return {
        date,
        dateLabel: formatDateLabel(date),
        energia: energyAvg !== null ? Number(energyAvg.toFixed(2)) : null,
        humor: moodAvg !== null ? Number(moodAvg.toFixed(2)) : null,
      };
    });

    return data;
  }, [entries]);

  if (entries.length < 3) {
    return null;
  }

  const chartConfig = {
    energia: {
      label: 'Energia',
      color: 'hsl(38, 92%, 50%)', // Laranja/âmbar
    },
    humor: {
      label: 'Humor',
      color: 'hsl(200, 80%, 50%)', // Azul/cyan
    },
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-foreground">
        Evolução dos últimos 7 dias
      </h3>
      <div className="rounded-lg border border-border/50 bg-card p-4">
        <ChartContainer config={chartConfig} className="h-[240px] w-full">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis
              dataKey="dateLabel"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              tickLine={{ stroke: 'hsl(var(--border))' }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <YAxis
              domain={[1, 3]}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              tickLine={{ stroke: 'hsl(var(--border))' }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              tickCount={3}
              tickFormatter={(value) => {
                if (value === 1) return 'Baixa';
                if (value === 2) return 'Média';
                if (value === 3) return 'Alta';
                return '';
              }}
            />
            <ChartTooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                
                const data = payload[0].payload;
                return (
                  <div className="rounded-lg border border-border/50 bg-background px-3 py-2 shadow-lg">
                    <p className="text-xs text-muted-foreground mb-1.5">
                      {format(parse(data.date, 'yyyy-MM-dd', new Date()), "EEEE, d 'de' MMMM", { locale: ptBR })}
                    </p>
                    <div className="space-y-1">
                      {data.energia !== null && (
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-2">
                            <div
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: chartConfig.energia.color }}
                            />
                            <span className="text-xs text-muted-foreground">Energia</span>
                          </div>
                          <span className="text-xs font-medium text-foreground">
                            {data.energia === 1 ? 'Baixa' : data.energia === 2 ? 'Média' : 'Alta'}
                          </span>
                        </div>
                      )}
                      {data.humor !== null && (
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-2">
                            <div
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: chartConfig.humor.color }}
                            />
                            <span className="text-xs text-muted-foreground">Humor</span>
                          </div>
                          <span className="text-xs font-medium text-foreground">
                            {data.humor === 1 ? 'Triste' : data.humor === 2 ? 'Neutro' : 'Feliz'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }}
            />
            <Line
              type="monotone"
              dataKey="energia"
              stroke={chartConfig.energia.color}
              strokeWidth={2}
              dot={{ fill: chartConfig.energia.color, r: 4 }}
              activeDot={{ r: 6 }}
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="humor"
              stroke={chartConfig.humor.color}
              strokeWidth={2}
              dot={{ fill: chartConfig.humor.color, r: 4 }}
              activeDot={{ r: 6 }}
              connectNulls={false}
            />
          </LineChart>
        </ChartContainer>
        <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-border/50">
          <div className="flex items-center gap-2">
            <div
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: chartConfig.energia.color }}
            />
            <span className="text-xs text-muted-foreground">Energia</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: chartConfig.humor.color }}
            />
            <span className="text-xs text-muted-foreground">Humor</span>
          </div>
        </div>
      </div>
    </div>
  );
}
