import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { saveDailyEntry, hasCheckedInToday } from '@/lib/storage';
import { getCheckInMessage } from '@/lib/messages';
import { ArrowLeft, Check } from 'lucide-react';
import type { EnergyLevel, MoodLevel, SleepQuality, StressLevel } from '@/lib/types';

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
  { value: 'boa', label: 'Boa', emoji: '✨' },
];

const stressOptions: { value: StressLevel; label: string; emoji: string }[] = [
  { value: 'baixo', label: 'Baixo', emoji: '🧘' },
  { value: 'medio', label: 'Médio', emoji: '😤' },
  { value: 'alto', label: 'Alto', emoji: '🔥' },
];

interface OptionGroupProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string; emoji: string }[];
  name: string;
}

function OptionGroup({ label, value, onChange, options, name }: OptionGroupProps) {
  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium text-foreground">{label}</Label>
      <RadioGroup
        value={value}
        onValueChange={onChange}
        className="grid grid-cols-2 sm:grid-cols-3 gap-2"
      >
        {options.map((opt) => (
          <div key={opt.value}>
            <RadioGroupItem
              value={opt.value}
              id={`${name}-${opt.value}`}
              className="peer sr-only"
            />
            <Label
              htmlFor={`${name}-${opt.value}`}
              className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all"
            >
              <span className="text-xl mb-1">{opt.emoji}</span>
              <span className="text-xs font-medium">{opt.label}</span>
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}

const CheckInPage = () => {
  const navigate = useNavigate();
  const [energy, setEnergy] = useState<EnergyLevel | ''>('');
  const [mood, setMood] = useState<MoodLevel | ''>('');
  const [sleepQuality, setSleepQuality] = useState<SleepQuality | ''>('');
  const [stressLevel, setStressLevel] = useState<StressLevel | ''>('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Valida se todas as opções foram selecionadas
    if (!energy || !mood || !sleepQuality || !stressLevel) {
      toast.error('Complete todas as opções', {
        description: 'Por favor, selecione uma opção para cada categoria antes de salvar.',
      });
      return;
    }
    
    // FIX BUG 7: bloqueia check-in duplicado no mesmo dia
    if (hasCheckedInToday()) {
      toast.warning('Você já fez check-in hoje!', {
        description: 'Só um registro por dia é permitido.',
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
            Selecione suas percepções para cada categoria.
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <OptionGroup
              label="Nível de Energia"
              name="energy"
              value={energy}
              onChange={(v) => setEnergy(v as EnergyLevel)}
              options={energyOptions}
            />
            
            <OptionGroup
              label="Humor"
              name="mood"
              value={mood}
              onChange={(v) => setMood(v as MoodLevel)}
              options={moodOptions}
            />
            
            <OptionGroup
              label="Qualidade do Sono"
              name="sleep"
              value={sleepQuality}
              onChange={(v) => setSleepQuality(v as SleepQuality)}
              options={sleepOptions}
            />
            
            <OptionGroup
              label="Nível de Estresse"
              name="stress"
              value={stressLevel}
              onChange={(v) => setStressLevel(v as StressLevel)}
              options={stressOptions}
            />

            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">
                O que marcou o seu dia?
              </Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value.slice(0, NOTES_MAX_LENGTH))}
                placeholder="Ex: Reunião importante, passeio no parque, um momento de gratidão..."
                className="resize-none min-h-[80px] text-sm"
                maxLength={NOTES_MAX_LENGTH}
              />
              <p className="text-xs text-muted-foreground text-right">
                {notes.length}/{NOTES_MAX_LENGTH}
              </p>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-medium gap-2 mt-4"
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
                  Salvar check-in
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
