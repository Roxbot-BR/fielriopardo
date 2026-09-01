'use client';

import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

type BannerMode = 'android' | 'ios' | null;

function isIosSafari(): boolean {
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  // Exclude Chrome/Firefox on iOS (they use Safari engine but have different UA)
  const isSafariBased = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
  return isIOS && isSafariBased;
}

export default function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [mode, setMode] = useState<BannerMode>(null);

  useEffect(() => {
    // Don't show if already running as installed PWA
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (isStandalone) return;

    // Don't show if user dismissed recently (7 days)
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed && Date.now() - Number(dismissed) < 7 * 24 * 60 * 60 * 1000) return;

    // iOS Safari: no beforeinstallprompt — show manual instructions
    if (isIosSafari()) {
      setTimeout(() => setMode('ios'), 3000);
      return;
    }

    // Android / Chrome: listen for native install event
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setMode('android'), 3000);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'dismissed') {
      localStorage.setItem('pwa-install-dismissed', String(Date.now()));
    }
    setMode(null);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa-install-dismissed', String(Date.now()));
    setMode(null);
  };

  if (!mode) return null;

  return (
    <>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(110%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        .pwa-banner { animation: slideUp 0.4s ease-out; }
      `}</style>

      {/* ── Android / Chrome banner ── */}
      {mode === 'android' && (
        <div className="pwa-banner fixed bottom-4 left-4 right-4 z-50">
          <div
            className="rounded-2xl p-4 flex items-center gap-3 shadow-2xl border border-[#C8A951]/30"
            style={{ background: 'linear-gradient(135deg, #111 0%, #1a1a0a 100%)' }}
          >
            <img src="/icon-192x192.png" alt="Fiel Rio Pardo" className="w-12 h-12 rounded-xl flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm leading-tight">Instalar Fiel Rio Pardo</p>
              <p className="text-gray-400 text-xs mt-0.5 leading-snug">
                Acesso rápido, funciona offline e sem ocupar espaço
              </p>
            </div>
            <div className="flex flex-col gap-1.5 flex-shrink-0">
              <button
                onClick={handleInstall}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-black whitespace-nowrap"
                style={{ background: '#C8A951' }}
              >
                Instalar
              </button>
              <button
                onClick={handleDismiss}
                className="px-3 py-1.5 rounded-lg text-xs text-gray-400 whitespace-nowrap border border-gray-700"
              >
                Agora não
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── iOS Safari banner — instrução manual ── */}
      {mode === 'ios' && (
        <div className="pwa-banner fixed bottom-4 left-4 right-4 z-50">
          {/* Arrow pointing down to the Safari share button */}
          <div className="flex justify-center mb-1">
            <div
              className="w-3 h-3 rotate-45 border-r border-b border-[#C8A951]/40"
              style={{ background: 'linear-gradient(135deg, transparent 50%, #1a1a0a 50%)' }}
            />
          </div>
          <div
            className="rounded-2xl p-4 shadow-2xl border border-[#C8A951]/30"
            style={{ background: 'linear-gradient(135deg, #111 0%, #1a1a0a 100%)' }}
          >
            <div className="flex items-start gap-3 mb-3">
              <img src="/icon-192x192.png" alt="Fiel Rio Pardo" className="w-10 h-10 rounded-xl flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-white font-bold text-sm leading-tight">Instalar Fiel Rio Pardo</p>
                <p className="text-gray-400 text-xs mt-0.5">Adicione à tela de início para acesso rápido</p>
              </div>
              <button onClick={handleDismiss} className="ml-auto text-gray-500 text-lg leading-none flex-shrink-0">✕</button>
            </div>

            {/* Step-by-step instructions */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2.5 bg-white/5 rounded-xl px-3 py-2">
                <span className="text-xl">
                  {/* Safari share icon SVG */}
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C8A951" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                    <polyline points="16 6 12 2 8 6"/>
                    <line x1="12" y1="2" x2="12" y2="15"/>
                  </svg>
                </span>
                <p className="text-gray-300 text-xs">
                  <span className="text-white font-semibold">1.</span> Toque no botão{' '}
                  <span className="text-[#C8A951] font-semibold">Compartilhar</span>{' '}
                  na barra do Safari
                </p>
              </div>
              <div className="flex items-center gap-2.5 bg-white/5 rounded-xl px-3 py-2">
                <span className="text-xl">
                  {/* Plus in square icon */}
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C8A951" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="3"/>
                    <line x1="12" y1="8" x2="12" y2="16"/>
                    <line x1="8" y1="12" x2="16" y2="12"/>
                  </svg>
                </span>
                <p className="text-gray-300 text-xs">
                  <span className="text-white font-semibold">2.</span> Selecione{' '}
                  <span className="text-[#C8A951] font-semibold">"Adicionar à Tela de Início"</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
