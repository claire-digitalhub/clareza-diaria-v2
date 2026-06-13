import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileDown, FileText } from 'lucide-react';
import type { DailyEntry } from '@/lib/types';
import {
  getWeeklyPatterns,
  getSignificantNotes,
  getWeeklyNumericSummary,
  getWeeklyReportPrintContent,
} from '@/lib/weeklyReport';
import { format, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface WeeklySummaryProps {
  entries: DailyEntry[];
}

export function WeeklySummary({ entries }: WeeklySummaryProps) {
  const distinctDays = new Set(entries.map(e => e.date)).size;
  if (distinctDays < 7) return null;

  const numericSummary = getWeeklyNumericSummary(entries);
  const patterns = getWeeklyPatterns(entries);
  const notes = getSignificantNotes(entries);

  const handleExportReport = () => {
    const content = getWeeklyReportPrintContent(entries, numericSummary, patterns, notes);
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <Card className="border-primary/30 bg-primary/5 shadow-card overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-lg font-display text-foreground flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Relatório Semanal
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">
              {distinctDays} dias registrados nesta janela
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 shrink-0"
            onClick={handleExportReport}
          >
            <FileDown className="w-4 h-4" />
            Exportar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <div className="p-3 rounded-lg bg-background/60 border border-border/50">
          <p className="text-sm text-foreground">{numericSummary}</p>
        </div>

        {patterns.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Top padrões
            </h4>
            <ul className="space-y-1.5 text-sm text-foreground/90">
              {patterns.map((p, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-primary font-medium">{i + 1}.</span>
                  {p}
                </li>
              ))}
            </ul>
          </div>
        )}

        {notes.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Suas notas da semana
            </h4>
            <ul className="space-y-2">
              {notes.map(({ note, date }, i) => (
                <li
                  key={i}
                  className="p-3 rounded-lg bg-secondary/30 border border-secondary/40 text-sm text-foreground/90 italic"
                >
                  <span className="text-xs text-muted-foreground not-italic font-medium">
                    {format(parse(date, 'yyyy-MM-dd', new Date()), "EEEE, d 'de' MMM", { locale: ptBR })}:
                  </span>
                  <br />
                  &ldquo;{note}&rdquo;
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
