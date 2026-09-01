"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import api from "@/lib/api";
import { ArrowLeft, Flag, Ruler, Weight, Calendar, Shirt } from "lucide-react";

interface Player {
  id: string;
  name: string;
  number: number | null;
  position: string | null;
  nationality: string | null;
  birthDate: string | null;
  height: string | null;
  weight: string | null;
  imageUrl: string | null;
  bio: string | null;
  status: string;
  arrivedAt: string | null;
}

const POSITION_LABELS: Record<string, string> = {
  GK: "Goleiro", ZAG: "Zagueiro", LAT: "Lateral",
  VOL: "Volante", MC: "Meia", ATK: "Atacante",
};

const PLACEHOLDER = "/logo.jpeg";

function calcAge(birthDate: string | null) {
  if (!birthDate) return null;
  const diff = Date.now() - new Date(birthDate).getTime();
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000));
}

export default function PlayerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Player>(`/players/${id}`)
      .then(r => setPlayer(r.data))
      .catch(() => router.push("/elenco"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <>
      <Header />
      <div className="min-h-screen bg-black flex items-center justify-center text-gray-400">Carregando...</div>
      <Footer />
    </>
  );
  if (!player) return null;

  const imgSrc = player.imageUrl || PLACEHOLDER;
  const age = calcAge(player.birthDate);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-black text-white pb-16">
        <div className="max-w-4xl mx-auto px-4 pt-6">
          <Link href="/elenco" className="inline-flex items-center gap-2 text-gray-400 hover:text-yellow-400 transition-colors text-sm">
            <ArrowLeft size={16}/> Voltar ao Elenco
          </Link>
        </div>

        <div className="max-w-4xl mx-auto px-4 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Photo */}
            <div className="md:col-span-1">
              <div className="aspect-square bg-gray-900 rounded-2xl overflow-hidden border border-gray-800">
                <img
                  src={imgSrc}
                  alt={player.name}
                  className="w-full h-full object-cover object-top"
                  onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER; }}
                />
              </div>
              {player.number && (
                <div className="text-center mt-3 text-5xl font-black text-yellow-400/20 select-none">
                  #{player.number}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="md:col-span-2">
              <div className="flex items-start gap-3 mb-2">
                {player.number && (
                  <span className="bg-yellow-400 text-black font-bold text-lg px-3 py-1 rounded-lg">#{player.number}</span>
                )}
                <div>
                  <h1 className="text-3xl font-bold text-white">{player.name}</h1>
                  <div className="text-yellow-400 font-medium mt-1">
                    {POSITION_LABELS[player.position ?? ""] ?? player.position ?? "—"}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-6">
                {player.nationality && (
                  <div className="bg-gray-900 rounded-xl p-4 flex items-center gap-3 border border-gray-800">
                    <Flag size={20} className="text-yellow-400"/>
                    <div>
                      <div className="text-xs text-gray-500">Nacionalidade</div>
                      <div className="font-semibold">{player.nationality}</div>
                    </div>
                  </div>
                )}
                {age !== null && (
                  <div className="bg-gray-900 rounded-xl p-4 flex items-center gap-3 border border-gray-800">
                    <Calendar size={20} className="text-yellow-400"/>
                    <div>
                      <div className="text-xs text-gray-500">Idade</div>
                      <div className="font-semibold">{age} anos</div>
                    </div>
                  </div>
                )}
                {player.height && (
                  <div className="bg-gray-900 rounded-xl p-4 flex items-center gap-3 border border-gray-800">
                    <Ruler size={20} className="text-yellow-400"/>
                    <div>
                      <div className="text-xs text-gray-500">Altura</div>
                      <div className="font-semibold">{player.height}</div>
                    </div>
                  </div>
                )}
                {player.weight && (
                  <div className="bg-gray-900 rounded-xl p-4 flex items-center gap-3 border border-gray-800">
                    <Weight size={20} className="text-yellow-400"/>
                    <div>
                      <div className="text-xs text-gray-500">Peso</div>
                      <div className="font-semibold">{player.weight}</div>
                    </div>
                  </div>
                )}
                {player.arrivedAt && (
                  <div className="bg-gray-900 rounded-xl p-4 flex items-center gap-3 border border-gray-800">
                    <Shirt size={20} className="text-yellow-400"/>
                    <div>
                      <div className="text-xs text-gray-500">No Clube desde</div>
                      <div className="font-semibold">
                        {new Date(player.arrivedAt).toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {player.bio && (
                <div className="mt-6 bg-gray-900 rounded-xl p-5 border border-gray-800">
                  <h2 className="text-yellow-400 font-semibold mb-3">Sobre o jogador</h2>
                  <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{player.bio}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
