import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { saveDailyEntry, hasCheckedInToday } from '@/lib/storage';
import { getCheckInMessage } from '@/lib/messages';
import { ArrowLeft, Check } from 'lucide-react';
import type { EnergyLevel, MoodLevel, SleepQuality, StressLevel } from '@/lib/types';
import { cn } from '@/lib/utils';

const NOTES_MAX_LENGTH = 500;

const energyOptions: { value: EnergyLevel; label: string; emoji: string }[] = [
  { value: 'baixa', label: 'Baixa', emoji: '🔋' },
  { value: 'media', label: 'Média', emoji: '⚡' },
  { value: 'alta', label: 'Alta', emoji: '🚀' },
];

const moodOptions: { value: MoodLevel; label: string; emoji: string }[] = [
  { value: 'triste', label: 'Triste', emoji: '😔' },
  { value: 'neutro', label: 'Neutro', emoji: '😐' },
  { value: 'feliz', label: 'Feliz', emoji: '😊' },
];

const sleepOptions: { value: SleepQuality; label: string; emoji: string }[] = [
  { value: 'ruim', label: 'Ruim', emoji: '😴' },
  { value: 'ok', label: 'Ok', emoji: '🛏️' },
  { value: 'boa', label: 'Bom', emoji: '✨' },
];

const stressOptions: { value: StressLevel; label: string; emoji: string }[] = [
  { value: 'baixo', label: 'Baixo', emoji: '🧘' },
  { value: 'medio', label: 'Médio', emoji: '😤' },
  { value: 'alto', label: 'Alto', emoji: '🔥' },
];

interface EmojiGroupProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string; emoji: string }[];
}

function EmojiGroup({ label, value, onChange, options }: EmojiGroupProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground">{label}</p>
      <div className="grid grid-cols-3 gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            aria-pressed={value === opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              'flex flex-col items-center justify-center rounded-xl py-4 border-2 transition-all duration-150 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              value === opt.value
                ? 'border-primary bg-primary/10 shadow-sm scale-[1.05]'
                : 'border-muted bg-muted/30 hover:border-primary/40 hover:bg-muted/50'
            )}
          >
            <span className="text-2xl mb-1">{opt.emoji}</span>
            <span className="text-xs font-medium text-foreground">{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

const CheckInPage = () => {
  const navigate = useNavigate();
  const alreadyCheckedIn = hasCheckedInToday();
  const [energy, setEnergy] = useState<EnergyLevel | ''>('');
  const [mood, setMood] = useState<MoodLevel | ''>('');
  const [sleepQuality, setSleepQuality] = useState<SleepQuality | ''>('');
  const [stressLevel, setStressLevel] = useState<StressLevel | ''>('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Mostra tela de "já registrado" antes de renderizar o formulário
  if (alreadyCheckedIn) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background p-4 sm:p-6">
        <Card className="w-full max-w-md shadow-card border-0 animate-fade-in text-center">
          <CardContent className="pt-10 pb-8 space-y-4">
            <div className="text-5xl">✅</div>
            <div>
              <h2 className="text-lg font-display font-semibold text-foreground">
                Você já registrou hoje!
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Só um check-in por dia. Volte amanhã.
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <Button onClick={() => navigate('/resumo')} className="w-full gap-2">
                Ver meus registros
              </Button>
              <Button variant="ghost" onClick={() => navigate('/')} className="w-full">
                Voltar ao início
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!energy || !mood || !sleepQuality || !stressLevel) {
      toast.error('Complete todas as opções', {
        description: 'Toque em uma opção para cada categoria antes de salvar.',
      });
      return;
    }

    setIsLoading(true);

    try {
      saveDailyEntry({
        energy: energy as EnergyLevel,
        mood: mood as MoodLevel,
        sleepQuality: sleepQuality as SleepQuality,
        stressLevel: stressLevel as StressLevel,
        notes: notes.trim() || undefined,
      });

      toast.success('Check-in salvo!', {
        description: getCheckInMessage(),
      });

      navigate('/resumo');
    } catch (error) {
      console.error('Erro ao salvar check-in:', error);
      toast.error('Falha ao salvar', {
        description: 'Não foi possível registrar. Tente novamente.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-4 sm:p-6 pb-8">
      <Card className="w-full max-w-md shadow-card border-0 animate-slide-up">
        <CardHeader className="pb-2">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2 -ml-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
          <CardTitle className="text-xl font-display text-foreground">
            Como você está hoje?
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Toque para selecionar.
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <EmojiGroup
              label="Energia"
              value={energy}
              onChange={(v) => setEnergy(v as EnergyLevel)}
              options={energyOptions}
            />

            <EmojiGroup
              label="Humor"
              value={mood}
              onChange={(v) => setMood(v as MoodLevel)}
              options={moodOptions}
            />

            <EmojiGroup
              label="Sono"
              value={sleepQuality}
              onChange={(v) => setSleepQuality(v as SleepQuality)}
              options={sleepOptions}
            />

            <EmojiGroup
              label="Estresse"
              value={stressLevel}
              onChange={(v) => setStressLevel(v as StressLevel)}
              options={stressOptions}
            />

            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">
                O que marcou o seu dia? <span className="text-muted-foreground font-normal">(opcional)</span>
              </Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value.slice(0, NOTES_MAX_LENGTH))}
                placeholder="Um momento, uma observação..."
                className="resize-none min-h-[72px] text-sm"
                maxLength={NOTES_MAX_LENGTH}
              />
              {notes.length > 0 && (
                <p className="text-xs text-muted-foreground text-right">
                  {notes.length}/{NOTES_MAX_LENGTH}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-medium gap-2 mt-2"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Salvar
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
};

export default CheckInPage;
