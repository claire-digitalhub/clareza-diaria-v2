import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getAllEntries, hasCheckedInToday, getStreakCount } from '@/lib/storage';
import { Sun, ArrowRight, List, Flame } from 'lucide-react';

const HomePage = () => {
  const navigate = useNavigate();
  const entries = getAllEntries();
  const hasEntries = entries.length > 0;
  const checkedInToday = hasCheckedInToday();
  const streak = getStreakCount();

  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-4 sm:p-6">
      <Card className="w-full max-w-md shadow-card border-0 animate-fade-in">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Sun className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-display text-foreground">
            Clareza Diária
          </CardTitle>
          <p className="text-muted-foreground mt-2">
            Acompanhe sua energia, humor, sono e estresse.
          </p>
          {streak > 0 && (
            <p className="text-sm text-muted-foreground mt-1 flex items-center justify-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-500" />
              {streak} dia{streak !== 1 ? 's' : ''} consecutivo{streak !== 1 ? 's' : ''} registrando
            </p>
          )}
        </CardHeader>

        <CardContent className="space-y-4 pt-6">
          {!checkedInToday && hasEntries && (
            <p className="text-center text-sm text-muted-foreground/90 py-1 px-3 rounded-md bg-muted/50">
              Ainda não registrou hoje
            </p>
          )}
          <Button
            onClick={() => navigate('/check-in')}
            className="w-full h-12 text-base font-medium gap-2"
            size="lg"
          >
            Fazer check-in de hoje
            <ArrowRight className="w-4 h-4 shrink-0" />
          </Button>

          {hasEntries && (
            <Button
              onClick={() => navigate('/resumo')}
              variant="secondary"
              className="w-full h-11 text-base font-medium gap-2"
            >
              <List className="w-4 h-4 shrink-0" />
              Ver meus registros ({entries.length})
            </Button>
          )}

          {!hasEntries && (
            <p className="text-center text-sm text-muted-foreground pt-2">
              Você ainda não tem registros. Comece seu primeiro check-in!
            </p>
          )}
        </CardContent>
      </Card>
    </main>
  );
};

export default HomePage;
