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
      <div className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 border-2 border-yellow-500/50 rounded-2xl shadow-2xl p-5 animate-in slide-in-from-bottom-4">
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center mb-3">
            <span className="text-3xl">🔔</span>
          </div>
          <h3 className="text-white font-bold text-lg mb-1">Ative as Notificações!</h3>
          <p className="text-zinc-300 text-xs leading-relaxed mb-4 px-2">Receba alertas em tempo real sobre jogos, bolão e ranking.</p>
          <div className="w-full flex gap-2">
            <button onClick={handleAllow} disabled={loading} className="flex-1 bg-yellow-500 hover:bg-yellow-400 active:scale-95 disabled:opacity-50 text-black font-bold text-xs py-2.5 px-4 rounded-xl transition-all">
              {loading ? 'Ativando…' : '✓ Ativar'}
            </button>
            <button onClick={handleDismiss} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white text-xs py-2.5 px-4 rounded-xl transition-colors border border-zinc-700">Agora não</button>
          </div>
        </div>
      </div>
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
