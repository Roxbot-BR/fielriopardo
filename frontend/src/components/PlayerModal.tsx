'use client';
import React from 'react';
import { X, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface Player {
  id: string;
  name: string;
  number: number;
  position: string;
  nationality: string;
  birthDate?: string | null;
  height?: string | null;
  weight?: string | null;
  imageUrl?: string | null;
  bio?: string | null;
  arrivedAt?: string | null;
}

const POSITION_LABEL: Record<string, string> = {
  GK: 'Goleiro', ZAG: 'Zagueiro', LAT: 'Lateral',
  VOL: 'Volante', MC: 'Meia', ATK: 'Atacante',
};

function formatDate(d: string | null | undefined) {
  if (!d) return '—';
  try {
    return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR');
  } catch { return d; }
}

export function PlayerModal({ player, onClose }: { player: Player; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-sm bg-[#111] border border-[#C8A951] rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}>
        <div className="relative bg-gradient-to-b from-[#000] to-[#1a1a1a] pt-8 pb-4 flex flex-col items-center gap-3">
          <button onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-[#2a2a2a] hover:bg-[#C8A951] hover:text-black text-gray-400 flex items-center justify-center transition-all">
            <X size={16} />
          </button>
          <div className="absolute top-3 left-3 bg-[#C8A951] text-black text-lg font-black w-10 h-10 rounded-full flex items-center justify-center shadow-lg">
            {player.number || '?'}
          </div>
          <div className="w-32 h-32 rounded-full overflow-hidden" style={{borderWidth:'3px', borderColor:'#C8A951', borderStyle:'solid'}}>
            {player.imageUrl ? (
              <img src={player.imageUrl} alt={player.name}
                className="w-full h-full object-cover object-top"
                onError={(e) => { (e.target as HTMLImageElement).src = '/logo.jpeg'; }}
              />
            ) : (
              <img src="/logo.jpeg" alt={player.name}
                className="w-full h-full object-cover object-center opacity-70"
              />
            )}
          </div>
          <div className="text-center px-4">
            <h2 className="text-xl font-black text-white leading-tight">{player.name}</h2>
            <p className="text-[#C8A951] text-sm font-semibold mt-0.5">
              {POSITION_LABEL[player.position] ?? player.position}
            </p>
          </div>
        </div>

        <div className="px-5 py-4 flex flex-col gap-2">
          {[
            { icon: '🌍', label: 'Nacionalidade', value: player.nationality },
            { icon: '📅', label: 'Nascimento', value: formatDate(player.birthDate) },
            { icon: '📏', label: 'Altura', value: player.height ?? '—' },
            { icon: '⚖️', label: 'Peso', value: player.weight ?? '—' },
            { icon: '⏳', label: 'No clube desde', value: formatDate(player.arrivedAt) },
          ].map(({ icon, label, value }) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-[#2a2a2a] last:border-0">
              <span className="text-gray-500 text-sm">{icon} {label}</span>
              <span className="text-white text-sm font-semibold">{value}</span>
            </div>
          ))}
          {player.bio && (
            <p className="text-gray-400 text-xs leading-relaxed mt-2 pt-2 border-t border-[#2a2a2a]">{player.bio}</p>
          )}
        </div>

        <div className="px-5 pb-5">
          <Link href={`/elenco/${player.id}`}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#C8A951]/10 border border-[#C8A951]/30 hover:bg-[#C8A951] hover:text-black text-[#C8A951] text-sm font-semibold transition-all">
            <ExternalLink size={14} />
            Ver perfil completo
          </Link>
        </div>
      </div>
    </div>
  );
}
