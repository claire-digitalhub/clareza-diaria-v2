import { Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Suggestion } from '@/lib/messages';

interface SuggestionCardProps {
  suggestion: Suggestion;
  onDismiss: (id: string) => void;
}

export function SuggestionCard({ suggestion, onDismiss }: SuggestionCardProps) {
  return (
    <div className="p-4 rounded-lg bg-accent/30 border border-accent/50 space-y-3">
      <div className="flex items-start gap-3">
        <div className="p-1.5 rounded-full bg-accent/50 text-accent-foreground shrink-0">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="flex-1 space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Para experimentar
          </p>
          <p className="text-sm text-foreground/80 leading-relaxed">
            {suggestion.text}
          </p>
        </div>
      </div>
      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1"
          onClick={() => onDismiss(suggestion.id)}
        >
          <X className="w-3 h-3" />
          Ignorar por enquanto
        </Button>
      </div>
    </div>
  );
}
