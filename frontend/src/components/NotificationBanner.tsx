'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePushNotifications } from '@/hooks/usePushNotifications';

const DISMISSED_KEY = 'fiel-push-dismissed';
const DISMISS_DAYS  = 14;

function isPwaMode(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true ||
    document.referrer.includes('android-app://')
  );
}

export default function NotificationBanner() {
  const { token } = useAuth();
  const [visible, setVisible] = useState(false);
  const [isPwa, setIsPwa] = useState(false);
  const { permission, isSubscribed, loading, subscribe } = usePushNotifications();

  useEffect(() => {
    if (!token) return;
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return;
    if (permission === 'granted' || permission === 'denied') return;
    if (isSubscribed) return;

    const pwaMode = isPwaMode();
    setIsPwa(pwaMode);

    const dismissed = localStorage.getItem(DISMISSED_KEY);
    if (dismissed && Date.now() < Number(dismissed)) return;

    const delay = pwaMode ? 500 : 5000;
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [token, permission, isSubscribed]);

  const handleAllow = async () => {
    if (!token) return;
    setVisible(false);
    const ok = await subscribe(token);
    if (!ok) {
      localStorage.setItem(DISMISSED_KEY, String(Date.now() + DISMISS_DAYS * 86400 * 1000));
    }
  };

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem(DISMISSED_KEY, String(Date.now() + DISMISS_DAYS * 86400 * 1000));
  };

  if (!visible) return null;

  if (isPwa) {
    return (
      <>
        <div className="fixed inset-0 bg-black/70 z-40 animate-in fade-in duration-300" onClick={handleDismiss} />
        <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-md mx-auto bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 border-2 border-yellow-500/50 rounded-3xl shadow-2xl p-6 animate-in zoom-in-95 duration-300">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mb-4 animate-pulse">
              <span className="text-5xl">🔔</span>
            </div>
            <h3 className="text-white font-bold text-xl mb-2">Ative as Notificações!</h3>
            <p className="text-zinc-300 text-sm leading-relaxed mb-6 px-2">Receba alertas em tempo real sobre:</p>
            <div className="w-full bg-zinc-800/50 rounded-2xl p-4 mb-6 space-y-3 text-left">
              <div className="flex items-start gap-3">
                <span className="text-xl mt-0.5">⚽</span>
                <div className="flex-1">
                  <p className="text-white font-semibold text-sm">Jogos do Corinthians</p>
                  <p className="text-zinc-400 text-xs">Horários e resultados</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xl mt-0.5">🎯</span>
                <div className="flex-1">
                  <p className="text-white font-semibold text-sm">Bolão Aberto</p>
                  <p className="text-zinc-400 text-xs">Não perca a chance de palpitar</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xl mt-0.5">🏆</span>
                <div className="flex-1">
                  <p className="text-white font-semibold text-sm">Ranking Atualizado</p>
                  <p className="text-zinc-400 text-xs">Veja sua posição no bolão</p>
                </div>
              </div>
            </div>
            <div className="w-full flex flex-col gap-3">
              <button onClick={handleAllow} disabled={loading} className="w-full bg-yellow-500 hover:bg-yellow-400 active:scale-95 disabled:opacity-50 disabled:scale-100 text-black font-bold text-base py-4 px-6 rounded-xl transition-all shadow-lg">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Ativando…
                  </span>
                ) : '✓ Ativar Notificações'}
              </button>
              <button onClick={handleDismiss} className="w-full bg-transparent hover:bg-zinc-800 text-zinc-400 hover:text-white text-sm py-3 px-4 rounded-xl transition-colors border border-zinc-700">Agora não</button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 max-w-sm mx-auto bg-zinc-900 border border-yellow-500/30 rounded-2xl shadow-2xl p-4 flex items-start gap-3 animate-in slide-in-from-bottom-4">
      <span className="text-2xl mt-0.5">🔔</span>
      <div className="flex-1 min-w-0">
        <p className="text-white font-semibold text-sm leading-snug">Ativar notificações</p>
        <p className="text-zinc-400 text-xs mt-0.5 leading-snug">Saiba quando o bolão abrir, resultados dos jogos e atualização do ranking.</p>
        <div className="flex gap-2 mt-3">
          <button onClick={handleAllow} disabled={loading} className="flex-1 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-black font-bold text-xs py-2 px-3 rounded-xl transition-colors">
            {loading ? 'Ativando…' : 'Ativar'}
          </button>
          <button onClick={handleDismiss} className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white text-xs py-2 px-3 rounded-xl transition-colors">Agora não</button>
        </div>
      </div>
      <button onClick={handleDismiss} className="text-zinc-500 hover:text-zinc-300 text-lg leading-none mt-0.5">×</button>
    </div>
  );
}
