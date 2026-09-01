'use client';

import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  targetDate: Date | string;
  label?: string;
  onExpire?: () => void;
  variant?: 'default' | 'compact' | 'hero';
}

function pad(n: number) { return String(n).padStart(2, '0'); }

export function CountdownTimer({ targetDate, label = 'Fechamento do Bolão em:', onExpire, variant = 'default' }: CountdownTimerProps) {
  const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate;

  const calc = () => {
    const diff = Math.max(0, Math.floor((target.getTime() - Date.now()) / 1000));
    return {
      days: Math.floor(diff / 86400),
      hours: Math.floor((diff % 86400) / 3600),
      minutes: Math.floor((diff % 3600) / 60),
      seconds: diff % 60,
      expired: diff === 0,
    };
  };

  const [time, setTime] = useState<ReturnType<typeof calc> | null>(null);

  useEffect(() => {
    setTime(calc());
    const t = setInterval(() => {
      const next = calc();
      setTime(next);
      if (next.expired) { clearInterval(t); onExpire?.(); }
    }, 1000);
    return () => clearInterval(t);
  }, [target]);

  if (!time) return null;
  if (time.expired) {
    return (
      <div className={variant === 'compact'
        ? 'inline-flex items-center gap-1.5 text-red-400 text-xs font-bold'
        : 'flex items-center gap-2 bg-red-900/20 border border-red-500/30 rounded-xl px-4 py-3'
      }>
        <Clock size={variant === 'compact' ? 12 : 16} className="text-red-400" />
        <span className={variant === 'compact' ? '' : 'text-red-400 font-bold'}>Bolão Encerrado</span>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="inline-flex items-center gap-1.5 text-[#C8A951] text-xs font-bold">
        <Clock size={12} />
        <span>
          {time.days > 0 && `${time.days}d `}
          {pad(time.hours)}:{pad(time.minutes)}:{pad(time.seconds)}
        </span>
      </div>
    );
  }

  const units = time.days > 0
    ? [
        { v: time.days, l: 'Dias' },
        { v: time.hours, l: 'Horas' },
        { v: time.minutes, l: 'Min' },
        { v: time.seconds, l: 'Seg' },
      ]
    : [
        { v: time.hours, l: 'Horas' },
        { v: time.minutes, l: 'Min' },
        { v: time.seconds, l: 'Seg' },
      ];

  return (
    <div className={variant === 'hero'
      ? 'bg-gradient-to-r from-black to-[#0d0d0d] border border-[#C8A951]/40 rounded-2xl p-5'
      : 'bg-[#0d0d0d] border border-[#C8A951]/20 rounded-xl p-4'
    }>
      <div className="flex items-center gap-2 mb-3">
        <Clock size={14} className="text-[#C8A951]" />
        <span className="text-xs text-[#C8A951] font-bold uppercase tracking-wider">{label}</span>
      </div>
      <div className="flex items-center justify-center gap-3">
        {units.map(({ v, l }, i) => (
          <React.Fragment key={l}>
            <div className="text-center">
              <div className={`font-black text-white tabular-nums ${variant === 'hero' ? 'text-4xl' : 'text-3xl'}`}>
                {pad(v)}
              </div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">{l}</div>
            </div>
            {i < units.length - 1 && (
              <span className="text-[#C8A951] font-black text-2xl mb-3">:</span>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
