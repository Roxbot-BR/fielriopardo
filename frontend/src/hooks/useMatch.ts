'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Match } from '@/types';
import api from '@/lib/api';
import { useSocket } from './useSocket';

interface UseMatchReturn {
  match: Match | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useMatch(matchId: string): UseMatchReturn {
  const [match, setMatch] = useState<Match | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { subscribe, unsubscribe } = useSocket();

  const fetchMatch = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data } = await api.get<Match>(`/matches/${matchId}`);
      setMatch(data);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar jogo');
    } finally {
      setIsLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    fetchMatch();
  }, [fetchMatch]);

  useEffect(() => {
    const handleUpdate = (data: unknown) => {
      const updated = data as Partial<Match>;
      setMatch((prev) => (prev ? { ...prev, ...updated } : prev));
    };
    subscribe(`match:${matchId}:update`, handleUpdate);
    return () => unsubscribe(`match:${matchId}:update`, handleUpdate);
  }, [matchId, subscribe, unsubscribe]);

  return { match, isLoading, error, refetch: fetchMatch };
}
