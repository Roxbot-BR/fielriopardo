'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { Socket } from 'socket.io-client';
import { getSocket, connectSocket, disconnectSocket } from '@/lib/socket';
import { useAuth } from '@/contexts/AuthContext';

interface SocketHook {
  isConnected: boolean;
  lastEvent: { name: string; data: unknown } | null;
  subscribe: (event: string, callback: (data: unknown) => void) => void;
  unsubscribe: (event: string, callback: (data: unknown) => void) => void;
}

export function useSocket(): SocketHook {
  const { isAuthenticated } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<{ name: string; data: unknown } | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    connectSocket();
    const s = getSocket();
    socketRef.current = s;

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);

    if (s.connected) setIsConnected(true);

    return () => {
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
    };
  }, [isAuthenticated]);

  const subscribe = useCallback((event: string, callback: (data: unknown) => void) => {
    getSocket().on(event, (data) => {
      setLastEvent({ name: event, data });
      callback(data);
    });
  }, []);

  const unsubscribe = useCallback((event: string, callback: (data: unknown) => void) => {
    getSocket().off(event, callback);
  }, []);

  return { isConnected, lastEvent, subscribe, unsubscribe };
}
