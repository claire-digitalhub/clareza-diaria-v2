import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { InsightCard } from '@/components/InsightCard';
import { SuggestionCard } from '@/components/SuggestionCard';
import { EvolutionChart } from '@/components/EvolutionChart';
import { 
  getEntriesForLast7Days, 
  getEntriesForLastNDays,
  getDistinctDaysCount, 
  groupEntriesByDate,
  getAllEntries
} from '@/lib/storage';
import {
  generateInsight,
  getSuggestion,
  getIgnoredSuggestions,
  ignoreSuggestion,
  shouldShowWeeklyMessage,
  markWeeklyMessageShown,
} from '@/lib/messages';
import { 
  energyLabels, 
  moodLabels, 
  sleepLabels, 
  stressLabels,
  energyEmojis,
  moodEmojis,
  sleepEmojis,
  stressEmojis,
} from '@/lib/types';
import type { DailyEntry } from '@/lib/types';
import { format, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { WeeklySummary } from '@/components/WeeklySummary';
import { ArrowLeft, Plus, Calendar, Download, History } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

function EntryCard({ entry, showDate }: { entry: DailyEntry; showDate?: boolean }) {
  const entryDate = parse(entry.date, 'yyyy-MM-dd', new Date());
  const formattedDate = format(entryDate, "EEEE, d 'de' MMMM", { locale: ptBR });
  const hasNotes = entry.notes && entry.notes.trim().length > 0;
  
  return (
    <div className={`p-4 rounded-lg border space-y-3 ${hasNotes ? 'bg-primary/5 border-primary/20' : 'bg-muted/50 border-border/50'}`}>
      {showDate && (
        <div className="flex items-center gap-2 text-sm font-medium text-foreground capitalize">
          <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
          {formattedDate}
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-2 min-w-0">
          <span className="shrink-0">{energyEmojis[entry.energy]}</span>
          <span className="text-muted-foreground truncate">Energia:</span>
          <span className="font-medium truncate">{energyLabels[entry.energy]}</span>
        </div>
        <div className="flex items-center gap-2 min-w-0">
          <span className="shrink-0">{moodEmojis[entry.mood]}</span>
          <span className="text-muted-foreground truncate">Humor:</span>
          <span className="font-medium truncate">{moodLabels[entry.mood]}</span>
        </div>
        <div className="flex items-center gap-2 min-w-0">
          <span className="shrink-0">{sleepEmojis[entry.sleepQuality]}</span>
          <span className="text-muted-foreground truncate">Sono:</span>
          <span className="font-medium truncate">{sleepLabels[entry.sleepQuality]}</span>
        </div>
        <div className="flex items-center gap-2 min-w-0">
          <span className="shrink-0">{stressEmojis[entry.stressLevel]}</span>
          <span className="text-muted-foreground truncate">Estresse:</span>
          <span className="font-medium truncate">{stressLabels[entry.stressLevel]}</span>
        </div>
      </div>
      {hasNotes && (
        <div className="pt-2 mt-2 border-t border-primary/20">
          <p className="text-xs font-medium text-muted-foreground mb-1">O que marcou o dia:</p>
          <p className="text-sm text-foreground/90 italic">&ldquo;{entry.notes}&rdquo;</p>
        </div>
      )}
    </div>
  );
}

function SummarySection({ entries }: { entries: DailyEntry[] }) {
  const distinctDays = getDistinctDaysCount(entries);
  const [showWeeklyMessage, setShowWeeklyMessage] = useState(() => 
    shouldShowWeeklyMessage(distinctDays)
  );
  
  // FIX BUG 2: useState → useEffect (useState não é para side effects)
  useEffect(() => {
    if (showWeeklyMessage && distinctDays >= 7) {
      markWeeklyMessageShown();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Calcula estatísticas simples
  const stats = {
    energy: { baixa: 0, media: 0, alta: 0 },
    mood: { triste: 0, neutro: 0, feliz: 0 },
    sleep: { ruim: 0, ok: 0, boa: 0 },
    stress: { baixo: 0, medio: 0, alto: 0 },
  };
  
  for (const entry of entries) {
    stats.energy[entry.energy]++;
    stats.mood[entry.mood]++;
    stats.sleep[entry.sleepQuality]++;
    stats.stress[entry.stressLevel]++;
  }
  
  // FIX BUG 5: type-safe + guard para array vazio
  const getMostFrequent = <T extends string>(obj: Record<T, number>): T => {
    const entries = Object.entries(obj) as [T, number][];
    return entries.reduce((a, b) => (b[1] > a[1] ? b : a), entries[0])[0];
  };
  
  const topEnergy = getMostFrequent(stats.energy);
  const topMood = getMostFrequent(stats.mood);
  const topSleep = getMostFrequent(stats.sleep);
  const topStress = getMostFrequent(stats.stress);
  
  // Só chama de "semanal" se tiver 7+ dias distintos
  const isWeeklySummary = distinctDays >= 7;
  const summaryTitle = isWeeklySummary ? 'Resumo Semanal' : 'Resumo dos Registros';
  
  return (
    <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-3">
      <h3 className="font-display font-semibold text-foreground">{summaryTitle}</h3>
      {isWeeklySummary && showWeeklyMessage && (
        <p className="text-sm text-muted-foreground italic">
          Registro semanal salvo. Observe com curiosidade e clareza, não com cobrança.
        </p>
      )}
      <p className="text-sm text-muted-foreground">
        {entries.length} check-in{entries.length !== 1 ? 's' : ''} em {distinctDays} dia{distinctDays !== 1 ? 's' : ''} distinto{distinctDays !== 1 ? 's' : ''}
      </p>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="flex items-center gap-2">
          <span>{energyEmojis[topEnergy]}</span>
          <span>Energia: <strong>{energyLabels[topEnergy]}</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <span>{moodEmojis[topMood]}</span>
          <span>Humor: <strong>{moodLabels[topMood]}</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <span>{sleepEmojis[topSleep]}</span>
          <span>Sono: <strong>{sleepLabels[topSleep]}</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <span>{stressEmojis[topStress]}</span>
          <span>Estresse: <strong>{stressLabels[topStress]}</strong></span>
        </div>
      </div>
    </div>
  );
}

const HISTORY_FILTER_OPTIONS = [7, 14, 30] as const;

const ResumoPage = () => {
  const navigate = useNavigate();
  const entries = getEntriesForLast7Days();
  const groupedEntries = groupEntriesByDate(entries);
  
  const [historyDays, setHistoryDays] = useState<number>(7);
  const historyEntries = getEntriesForLastNDays(historyDays);
  const historyGrouped = groupEntriesByDate(historyEntries);
  
  // Estado para sugestões ignoradas (reativo)
  const [ignoredSuggestions, setIgnoredSuggestions] = useState<string[]>(getIgnoredSuggestions);
  
  // Gera insight e sugestão baseados nos dados
  const insight = generateInsight(entries);
  const suggestion = getSuggestion(entries, ignoredSuggestions);

  const handleDismissSuggestion = (id: string) => {
    ignoreSuggestion(id);
    setIgnoredSuggestions(prev => [...prev, id]);
  };

  const handleExport = () => {
    try {
      const allEntries = getAllEntries();
      const dataStr = JSON.stringify(allEntries, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      const today = format(new Date(), 'yyyy-MM-dd');
      link.download = `clareza-diaria-${today}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao exportar dados:', error);
    }
  };
  
  // Converte Map para array ordenado por data decrescente
  const sortedDates = Array.from(groupedEntries.keys()).sort((a, b) => {
    const dateA = parse(a, 'yyyy-MM-dd', new Date());
    const dateB = parse(b, 'yyyy-MM-dd', new Date());
    return dateB.getTime() - dateA.getTime();
  });
  const historySortedDates = Array.from(historyGrouped.keys()).sort((a, b) => {
    const dateA = parse(a, 'yyyy-MM-dd', new Date());
    const dateB = parse(b, 'yyyy-MM-dd', new Date());
    return dateB.getTime() - dateA.getTime();
  });

  return (
    <main className="min-h-screen bg-background p-4 sm:p-6 pb-24">
      <div className="max-w-md mx-auto space-y-4">
        <Card className="shadow-card border-0 animate-fade-in">
          <CardHeader className="pb-2">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2 -ml-1"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </button>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl font-display text-foreground">
                  Meus Registros
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Últimos 7 dias de check-ins
                </p>
              </div>
              {entries.length > 0 && (
                <Button
                  onClick={handleExport}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  Exportar
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {entries.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  Nenhum registro encontrado nos últimos 7 dias.
                </p>
                <Button onClick={() => navigate('/check-in')} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Fazer primeiro check-in
                </Button>
              </div>
            ) : (
              <>
                {/* Micro-insight textual */}
                {insight && <InsightCard insight={insight} />}
                
                {/* Sugestão opcional */}
                {suggestion && (
                  <SuggestionCard 
                    suggestion={suggestion} 
                    onDismiss={handleDismissSuggestion} 
                  />
                )}

                <SummarySection entries={entries} />
                
                <EvolutionChart entries={entries} />

                <WeeklySummary entries={entries} />
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-muted-foreground" />
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Histórico
                    </h3>
                  </div>
                  <Tabs value={String(historyDays)} onValueChange={(v) => setHistoryDays(Number(v) as 7 | 14 | 30)}>
                    <TabsList className="grid w-full grid-cols-3 h-auto flex-wrap gap-1 p-1">
                      {HISTORY_FILTER_OPTIONS.map((d) => (
                        <TabsTrigger key={d} value={String(d)} className="text-xs sm:text-sm py-2">
                          {d} dias
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto overscroll-contain pr-1">
                    {historySortedDates.map((date) => {
                      const dayEntries = historyGrouped.get(date) || [];
                      return dayEntries.map((entry, idx) => (
                        <EntryCard 
                          key={`${date}-${idx}`} 
                          entry={entry} 
                          showDate={idx === 0} 
                        />
                      ));
                    })}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {entries.length > 0 && (
          <Button 
            onClick={() => navigate('/check-in')}
            className="w-full h-12 text-base font-medium gap-2 fixed bottom-4 left-4 right-4 max-w-md mx-auto sm:left-[50%] sm:right-auto sm:translate-x-[-50%]"
            size="lg"
          >
            <Plus className="w-4 h-4" />
            Novo check-in
          </Button>
        )}
      </div>
    </main>
  );
};

export default ResumoPage;
