'use client';

import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PlayerModal } from './PlayerModal';

interface Player {
  id: string;
  name: string;
  number: number;
  position: string;
  nationality: string;
  imageUrl: string | null;
  birthDate?: string | null;
  height?: string | null;
  weight?: string | null;
  bio?: string | null;
  arrivedAt?: string | null;
}

const POSITION_LABEL: Record<string, string> = {
  GK: 'Goleiro', ZAG: 'Zagueiro', LAT: 'Lateral',
  VOL: 'Volante', MC: 'Meia', ATK: 'Atacante',
};

export function ElencoSlider({ players }: { players: Player[] }) {
  const [current, setCurrent] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [selected, setSelected] = useState<Player | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const perPage = isMobile ? 1 : 3;
  const total = Math.ceil(players.length / perPage);

  const prev = useCallback(() => setCurrent(c => (c - 1 + total) % total), [total]);
  const next = useCallback(() => setCurrent(c => (c + 1) % total), [total]);

  // Auto-play (pause when modal open)
  useEffect(() => {
    if (selected) return;
    const t = setInterval(next, 4000);
    return () => clearInterval(t);
  }, [next, selected]);

  const visible = players.slice(current * perPage, current * perPage + perPage);

  return (
    <div className="relative select-none">
      {/* Cards */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${perPage}, 1fr)` }}>
        {visible.map((p) => (
          <button key={p.id} onClick={() => setSelected(p)}
            className="group bg-[#111] border border-[#2a2a2a] rounded-2xl overflow-hidden hover:border-[#C8A951] transition-all duration-300 flex flex-col items-center text-center p-4 gap-3 w-full">
            <div className="relative w-28 h-28 rounded-full overflow-hidden border-2 border-[#2a2a2a] group-hover:border-[#C8A951] transition-all">
              {p.imageUrl ? (
                <img src={p.imageUrl} alt={p.name}
                  className="w-full h-full object-cover object-top"
                  onError={(e) => { (e.target as HTMLImageElement).src = '/logo.jpeg'; }}
                />
              ) : (
                <img src="/logo.jpeg" alt={p.name}
                  className="w-full h-full object-cover object-center opacity-60"
                />
              )}
              <div className="absolute bottom-0 right-0 bg-[#C8A951] text-black text-xs font-black w-6 h-6 rounded-full flex items-center justify-center">
                {p.number || '?'}
              </div>
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight group-hover:text-[#C8A951] transition-colors">{p.name}</p>
              <p className="text-gray-500 text-xs mt-0.5">{POSITION_LABEL[p.position] ?? p.position}</p>
              <p className="text-gray-600 text-xs">{p.nationality}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-center gap-4 mt-5">
        <button onClick={prev}
          className="w-9 h-9 rounded-full border border-[#3d3d3d] bg-[#1a1a1a] hover:border-[#C8A951] hover:text-[#C8A951] text-gray-400 flex items-center justify-center transition-all">
          <ChevronLeft size={18} />
        </button>
        <div className="flex gap-1.5">
          {Array.from({ length: total }).map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)}
              className={`h-1.5 rounded-full transition-all ${i === current ? 'w-5 bg-[#C8A951]' : 'w-1.5 bg-[#3d3d3d]'}`}
            />
          ))}
        </div>
        <button onClick={next}
          className="w-9 h-9 rounded-full border border-[#3d3d3d] bg-[#1a1a1a] hover:border-[#C8A951] hover:text-[#C8A951] text-gray-400 flex items-center justify-center transition-all">
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Modal rendered via portal to avoid z-index stacking context issues */}
      {mounted && selected && ReactDOM.createPortal(
        <PlayerModal player={selected} onClose={() => setSelected(null)} />,
        document.body
      )}
    </div>
  );
}
