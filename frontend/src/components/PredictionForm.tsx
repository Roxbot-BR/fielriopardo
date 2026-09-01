'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Clock, CheckCircle, Lock } from 'lucide-react';
import type { Match, Prediction } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { useBolao } from '@/hooks/useBolao';
import { formatDateTime } from '@/lib/utils';
import { differenceInMinutes } from 'date-fns';

const schema = z.object({
  homeScore: z.number().int().min(0).max(99),
  awayScore: z.number().int().min(0).max(99),
});

type FormData = z.infer<typeof schema>;

interface PredictionFormProps {
  match: Match;
  initialPrediction?: Prediction | null;
}

export function PredictionForm({ match, initialPrediction }: PredictionFormProps) {
  const { submitPrediction, isSubmitting } = useBolao();
  const [prediction, setPrediction] = useState<Prediction | null>(initialPrediction ?? null);
  const minutesLeft = differenceInMinutes(new Date(match.matchDate), new Date());
  const closingSoon = minutesLeft > 0 && minutesLeft <= 60;
  const isClosed = !match.bolaoOpen || match.status !== 'scheduled';

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      homeScore: prediction?.homeScore ?? 0,
      awayScore: prediction?.awayScore ?? 0,
    },
  });

  useEffect(() => {
    if (prediction) {
      reset({ homeScore: prediction.homeScore, awayScore: prediction.awayScore });
    }
  }, [prediction, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      await submitPrediction(match.id, data);
      setPrediction((prev) => ({
        ...((prev ?? {}) as Prediction),
        homeScore: data.homeScore,
        awayScore: data.awayScore,
      }));
      toast.success('Palpite registrado com sucesso! 🦅');
    } catch {
      toast.error('Erro ao registrar palpite. Tente novamente.');
    }
  };

  if (isClosed) {
    return (
      <Card variant="default">
        <CardContent className="p-6 text-center">
          <Lock className="mx-auto mb-2 text-gray-500" size={32} />
          <p className="text-gray-400 font-medium">Bolão encerrado para este jogo</p>
          {prediction && (
            <p className="mt-2 text-sm text-gray-500">
              Seu palpite: <span className="text-[#C8A951] font-bold">{prediction.homeScore} x {prediction.awayScore}</span>
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant={prediction ? 'highlight' : 'default'}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-white text-lg">Seu Palpite</h3>
          {prediction && (
            <span className="flex items-center gap-1 text-[#C8A951] text-sm">
              <CheckCircle size={14} /> Palpite enviado
            </span>
          )}
        </div>

        {closingSoon && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30 px-3 py-2">
            <Clock size={14} className="text-yellow-400" />
            <p className="text-yellow-400 text-sm font-medium">
              Bolão fecha em {minutesLeft} minutos!
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="flex flex-col items-center gap-2 flex-1">
              <p className="text-sm font-medium text-gray-400 text-center">{match.homeTeam}</p>
              <input
                type="number"
                min="0"
                max="99"
                {...register('homeScore')}
                className="w-20 h-16 text-center text-3xl font-black bg-[#0d0d0d] border-2 border-[#3d3d3d] focus:border-[#C8A951] rounded-lg text-white outline-none transition-colors"
              />
              {errors.homeScore && (
                <p className="text-xs text-red-400">{errors.homeScore.message}</p>
              )}
            </div>
            <span className="text-2xl text-gray-500 font-bold mt-6">x</span>
            <div className="flex flex-col items-center gap-2 flex-1">
              <p className="text-sm font-medium text-gray-400 text-center">{match.awayTeam}</p>
              <input
                type="number"
                min="0"
                max="99"
                {...register('awayScore')}
                className="w-20 h-16 text-center text-3xl font-black bg-[#0d0d0d] border-2 border-[#3d3d3d] focus:border-[#C8A951] rounded-lg text-white outline-none transition-colors"
              />
              {errors.awayScore && (
                <p className="text-xs text-red-400">{errors.awayScore.message}</p>
              )}
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? 'Enviando...'
              : prediction
              ? '🔄 Atualizar Palpite'
              : '⚽ Confirmar Palpite'}
          </Button>

          <p className="mt-2 text-center text-xs text-gray-500">
            Fecha em: {formatDateTime(match.matchDate)}
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
