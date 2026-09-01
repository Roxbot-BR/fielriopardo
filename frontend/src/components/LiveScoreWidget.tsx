'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff } from 'lucide-react';
import type { Match, MatchEvent } from '@/types';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useSocket } from '@/hooks/useSocket';

interface LiveScoreWidgetProps {
  matchId: string;
  initialMatch: Match;
}

function EventIcon({ type }: { type: MatchEvent['type'] }) {
  const icons: Record<MatchEvent['type'], string> = {
    GOAL: '⚽',
    YELLOW_CARD: '🟨',
    RED_CARD: '🟥',
    SUBSTITUTION: '🔄',
    PENALTY: '⚽🎯',
  };
  return <span>{icons[type] ?? '•'}</span>;
}

export function LiveScoreWidget({ matchId, initialMatch }: LiveScoreWidgetProps) {
  const [match, setMatch] = useState<Match>(initialMatch);
  const [newGoal, setNewGoal] = useState(false);
  const { isConnected, subscribe, unsubscribe } = useSocket();

  useEffect(() => {
    const handleUpdate = (data: unknown) => {
      const updated = data as Partial<Match>;
      setMatch((prev) => {
        const hadGoal =
          updated.homeScore !== undefined && updated.homeScore !== prev.homeScore ||
          updated.awayScore !== undefined && updated.awayScore !== prev.awayScore;
        if (hadGoal) {
          setNewGoal(true);
          setTimeout(() => setNewGoal(false), 1500);
        }
        return { ...prev, ...updated };
      });
    };

    subscribe(`match:${matchId}:update`, handleUpdate);
    return () => unsubscribe(`match:${matchId}:update`, handleUpdate);
  }, [matchId, subscribe, unsubscribe]);

  const recentEvents = [...(match.matchEvents ?? [])].reverse().slice(0, 5);

  return (
    <Card variant="highlight" className="overflow-hidden">
      <div className="bg-[#0d0d0d] border-b border-[#C8A951] px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="live">AO VIVO</Badge>
        </div>
        <div className={`flex items-center gap-1 text-xs ${isConnected ? 'text-[#C8A951]' : 'text-red-400'}`}>
          {isConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
          {isConnected ? 'Conectado' : 'Reconectando...'}
        </div>
      </div>

      <CardContent className="p-6">
        {/* Placar */}
        <motion.div
          animate={newGoal ? { backgroundColor: ['transparent', '#C8A951', 'transparent'] } : {}}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-center gap-6 py-4 rounded-lg mb-4"
        >
          <div className="text-center flex-1 flex flex-col items-center gap-1">
            {match.homeTeamLogo && (
              <img src={match.homeTeamLogo} alt={match.homeTeam} className="w-8 h-8 object-contain" />
            )}
            <p className="text-sm font-bold text-white">{match.homeTeam}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <AnimatePresence mode="wait">
              <motion.span
                key={`home-${match.homeScore}`}
                initial={{ scale: 1.5, color: '#C8A951' }}
                animate={{ scale: 1, color: '#ffffff' }}
                className="text-5xl font-black text-white"
              >
                {match.homeScore ?? 0}
              </motion.span>
            </AnimatePresence>
            <span className="text-2xl text-gray-500 font-bold">x</span>
            <AnimatePresence mode="wait">
              <motion.span
                key={`away-${match.awayScore}`}
                initial={{ scale: 1.5, color: '#C8A951' }}
                animate={{ scale: 1, color: '#ffffff' }}
                className="text-5xl font-black text-white"
              >
                {match.awayScore ?? 0}
              </motion.span>
            </AnimatePresence>
          </div>
          <div className="text-center flex-1 flex flex-col items-center gap-1">
            {match.awayTeamLogo && (
              <img src={match.awayTeamLogo} alt={match.awayTeam} className="w-8 h-8 object-contain" />
            )}
            <p className="text-sm font-bold text-white">{match.awayTeam}</p>
          </div>
        </motion.div>

        {/* Eventos recentes */}
        {recentEvents.length > 0 && (
          <div className="mt-4">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-2">
              Últimos eventos
            </p>
            <div className="flex flex-col gap-2">
              {recentEvents.map((event, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex items-center gap-2 text-sm ${event.team === 'HOME' ? '' : 'flex-row-reverse text-right'}`}
                >
                  <span className="text-gray-400 font-mono text-xs w-8 shrink-0 text-right">
                    {event.minute}'
                  </span>
                  <EventIcon type={event.type} />
                  <span className="text-gray-300">{event.playerName}</span>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
