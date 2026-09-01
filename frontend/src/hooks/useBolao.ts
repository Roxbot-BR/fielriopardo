'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Prediction, SeasonRanking } from '@/types';
import api from '@/lib/api';

interface PredictionPayload {
  homeScore: number;
  awayScore: number;
}

interface UseBolaoReturn {
  prediction: Prediction | null;
  ranking: SeasonRanking[];
  isLoading: boolean;
  isSubmitting: boolean;
  submitPrediction: (matchId: string, payload: PredictionPayload) => Promise<void>;
  fetchPrediction: (matchId: string) => Promise<void>;
  fetchRanking: () => Promise<void>;
}

export function useBolao(): UseBolaoReturn {
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [ranking, setRanking] = useState<SeasonRanking[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPrediction = useCallback(async (matchId: string) => {
    try {
      setIsLoading(true);
      const { data } = await api.get<Prediction>(`/bolao/prediction/${matchId}`);
      setPrediction(data);
    } catch {
      setPrediction(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchRanking = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data } = await api.get<SeasonRanking[]>('/bolao/ranking');
      setRanking(data);
    } catch {
      setRanking([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const submitPrediction = useCallback(
    async (matchId: string, payload: PredictionPayload) => {
      setIsSubmitting(true);
      try {
        const { data } = await api.post<Prediction>(`/bolao/prediction/${matchId}`, payload);
        setPrediction(data);
      } finally {
        setIsSubmitting(false);
      }
    },
    []
  );

  return { prediction, ranking, isLoading, isSubmitting, submitPrediction, fetchPrediction, fetchRanking };
}
