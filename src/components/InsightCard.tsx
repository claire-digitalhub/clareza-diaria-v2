import { Lightbulb } from 'lucide-react';

interface InsightCardProps {
  insight: string;
}

export function InsightCard({ insight }: InsightCardProps) {
  return (
    <div className="p-4 rounded-lg bg-secondary/30 border border-secondary/50 flex items-start gap-3">
      <div className="p-1.5 rounded-full bg-secondary/50 text-secondary-foreground shrink-0">
        <Lightbulb className="w-4 h-4" />
      </div>
      <p className="text-sm text-foreground/80 leading-relaxed">
        {insight}
      </p>
    </div>
  );
}
