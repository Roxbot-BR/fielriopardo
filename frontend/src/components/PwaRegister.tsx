'use client';

import { useEffect } from 'react';

export default function PwaRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'CACHE_UPDATED') {
          console.log('[PWA] Cache atualizado, recarregando...');
          setTimeout(() => window.location.reload(), 2000);
        }
      });

      navigator.serviceWorker
        .register('/sw.js', { scope: '/', updateViaCache: 'none' })
        .then((reg) => {
          console.log('[PWA] Service Worker registrado:', reg.scope);
          setInterval(() => reg.update(), 60000);
          reg.update();
        })
        .catch((err) => console.warn('[PWA] Falha ao registrar SW:', err));
    }
  }, []);

  return null;
}
