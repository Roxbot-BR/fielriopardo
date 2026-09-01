"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import api from "@/lib/api";

interface Player {
  id: string;
  name: string;
  number: number | null;
  position: string | null;
  nationality: string | null;
  imageUrl: string | null;
  status: string;
}

const POSITION_LABELS: Record<string, string> = {
  GK: "Goleiro",
  ZAG: "Zagueiro",
  LAT: "Lateral",
  VOL: "Volante",
  MC: "Meia",
  ATK: "Atacante",
};

const POSITION_ORDER = ["GK", "ZAG", "LAT", "VOL", "MC", "ATK"];

const POSITION_FILTER_LABELS: Record<string, string> = {
  all: "Todos",
  GK: "🧤 Goleiros",
  ZAG: "🛡️ Zagueiros",
  LAT: "🏃 Laterais",
  VOL: "⚙️ Volantes",
  MC: "🎯 Meias",
  ATK: "⚡ Atacantes",
};

const PLACEHOLDER = "/logo.jpeg";

export default function ElencoPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Player[]>("/players?status=active")
      .then(r => setPlayers(r.data))
      .catch(() => setPlayers([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === "all" ? players : players.filter(p => p.position === filter);

  const grouped = POSITION_ORDER.reduce((acc, pos) => {
    const group = filtered.filter(p => p.position === pos);
    if (group.length) acc[pos] = group;
    return acc;
  }, {} as Record<string, Player[]>);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-black text-white pb-16">
        {/* Hero */}
        <div className="bg-gradient-to-b from-gray-900 to-black border-b border-yellow-400/20 pt-8 pb-6 px-4 text-center">
          <h1 className="text-3xl font-bold text-yellow-400">Elenco 2026</h1>
          <p className="text-gray-400 mt-1">Futebol Masculino Profissional</p>
        </div>

        <div className="max-w-6xl mx-auto px-4 pt-6">
          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-8 justify-center">
            {Object.entries(POSITION_FILTER_LABELS).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  filter === key
                    ? "bg-yellow-400 text-black"
                    : "bg-gray-900 text-gray-300 border border-gray-700 hover:border-yellow-400"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center text-gray-400 py-16">Carregando elenco...</div>
          ) : players.length === 0 ? (
            <div className="text-center text-gray-400 py-16">
              <p>Elenco em atualização.</p>
              <p className="text-sm mt-1 text-gray-600">Os dados dos jogadores serão exibidos em breve.</p>
            </div>
          ) : (
            <>
              {Object.entries(grouped).map(([pos, group]) => (
                <section key={pos} className="mb-10">
                  <h2 className="text-lg font-semibold text-yellow-400 border-b border-yellow-400/20 pb-2 mb-4">
                    {POSITION_LABELS[pos]}s
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {group.map(p => <PlayerCard key={p.id} player={p} />)}
                  </div>
                </section>
              ))}
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

function PlayerCard({ player: p }: { player: Player }) {
  return (
    <Link href={`/elenco/${p.id}`} className="group block bg-gray-900 rounded-xl overflow-hidden border border-gray-800 hover:border-yellow-400 transition-all hover:-translate-y-1">
      <div className="relative aspect-square bg-gray-800 overflow-hidden">
        <img
          src={p.imageUrl || PLACEHOLDER}
          alt={p.name}
          className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
          onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER; }}
        />
        {p.number && (
          <div className="absolute top-2 left-2 bg-black/70 text-yellow-400 font-bold text-sm px-2 py-0.5 rounded">
            #{p.number}
          </div>
        )}
      </div>
      <div className="p-3">
        <div className="font-semibold text-white text-sm truncate">{p.name}</div>
        <div className="text-xs text-yellow-400 mt-0.5">{POSITION_LABELS[p.position ?? ""] ?? p.position ?? "—"}</div>
      </div>
    </Link>
  );
}
