'use client';
import { getAuthHeader } from '@/lib/api';
import { useState, useEffect, useCallback } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0))).buffer;
}

export type PushPermission = 'default' | 'granted' | 'denied';

export function usePushNotifications() {
  const [permission, setPermission] = useState<PushPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return;
    setPermission(Notification.permission as PushPermission);

    // Check if already subscribed
    navigator.serviceWorker.ready.then((reg) =>
      reg.pushManager.getSubscription().then((sub) => setIsSubscribed(!!sub))
    );
  }, []);

  const subscribe = useCallback(async (token: string): Promise<boolean> => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;

    setLoading(true);
    try {
      // Request permission
      const perm = await Notification.requestPermission();
      setPermission(perm as PushPermission);
      if (perm !== 'granted') return false;

      // Get VAPID public key from backend
      const keyRes = await fetch(`${API_BASE}/api/notifications/vapid-public-key`);
      const { publicKey } = await keyRes.json() as { publicKey: string };

      // Subscribe
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      const subJson = sub.toJSON() as {
        endpoint: string;
        keys: { p256dh: string; auth: string };
      };

      // Send subscription to backend
      await fetch(`${API_BASE}/api/notifications/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: getAuthHeader(token),
        },
        body: JSON.stringify(subJson),
      });

      setIsSubscribed(true);
      return true;
    } catch (err) {
      console.error('Push subscription failed', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const unsubscribe = useCallback(async (token: string): Promise<void> => {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (!sub) return;

      await fetch(`${API_BASE}/api/notifications/subscribe`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: getAuthHeader(token),
        },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      });

      await sub.unsubscribe();
      setIsSubscribed(false);
    } finally {
      setLoading(false);
    }
  }, []);

  return { permission, isSubscribed, loading, subscribe, unsubscribe };
}
