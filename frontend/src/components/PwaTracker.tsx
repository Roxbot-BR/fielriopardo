'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';

/**
 * Silently tracks when a logged-in user opens the app in standalone (PWA) mode.
 * Calls the backend once to mark pwa_installed = true for this user.
 */
export default function PwaTracker() {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;

    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;

    if (!isStandalone) return;

    const tracked = sessionStorage.getItem('pwa-tracked');
    if (tracked) return;

    api.post('/notifications/track-pwa').catch(() => {});
    sessionStorage.setItem('pwa-tracked', '1');
  }, [isAuthenticated]);

  return null;
}
