'use client';

import { useEffect } from 'react';

export default function PwaDetector() {
  useEffect(() => {
    // Detectar se está em modo standalone (PWA)
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    if (isStandalone) {
      document.documentElement.classList.add('pwa-standalone');
      console.log('✅ PWA mode detected - adding pwa-standalone class');
    } else {
      document.documentElement.classList.remove('pwa-standalone');
      console.log('ℹ️ Browser mode - no PWA class');
    }
  }, []);

  return null;
}
