import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

// Declaração do gtag global para TypeScript
declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
  }
}

const CONSENT_KEY = 'clareza-diaria-ga-consent';

/**
 * Banner de consentimento LGPD para Google Analytics.
 * Aparece apenas uma vez. Atualiza o GA Consent Mode v2 após decisão.
 */
export function ConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CONSENT_KEY);
      if (!stored) setVisible(true);
    } catch {
      // localStorage bloqueado — não exibe banner, GA permanece denied
    }
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem(CONSENT_KEY, 'granted');
      window.gtag?.('consent', 'update', { analytics_storage: 'granted' });
    } catch {
      // silencioso
    }
    setVisible(false);
  };

  const handleDecline = () => {
    try {
      localStorage.setItem(CONSENT_KEY, 'denied');
    } catch {
      // silencioso
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Consentimento de cookies"
      className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background border-t border-border shadow-lg"
    >
      <div className="max-w-md mx-auto space-y-3">
        <p className="text-sm text-foreground">
          Este app usa Google Analytics para entender como é utilizado.
          Nenhum dado pessoal é coletado.
          Você pode recusar sem perder nenhuma funcionalidade.
        </p>
        <div className="flex gap-2">
          <Button size="sm" onClick={handleAccept}>
            Aceitar
          </Button>
          <Button size="sm" variant="ghost" onClick={handleDecline}>
            Recusar
          </Button>
        </div>
      </div>
    </div>
  );
}
