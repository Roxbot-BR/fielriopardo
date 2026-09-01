"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { Match } from "@/types";
import { formatDate } from "@/lib/utils";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Spinner from "@/components/ui/Spinner";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default function HistoricoPage() {
  const [matches, setMatches]   = useState<Match[]>([]);
  const [seasons, setSeasons]   = useState<string[]>([]);
  const [comps, setComps]       = useState<string[]>([]);
  const [loading, setLoading]   = useState(true);
  const [season, setSeason]     = useState("");
  const [comp, setComp]         = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo]     = useState("");

  useEffect(() => {
    Promise.all([
      api.get("/matches/seasons"),
      api.get("/matches/competitions"),
    ]).then(([s, c]) => { setSeasons(s.data ?? []); setComps(c.data ?? []); });
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ status: "finished" });
    if (season)   params.set("season", season);
    if (comp)     params.set("competition", comp);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo)   params.set("dateTo", dateTo);
    api.get(`/bolao/historico?${params}`).then(({ data }) => setMatches(Array.isArray(data) ? data : [])).finally(() => setLoading(false));
  }, [season, comp, dateFrom, dateTo]);

  const selectCls = "bg-dark-2 border border-dark-3 rounded-lg px-3 py-2 text-sm text-white focus:border-gold outline-none";
  const inputCls  = "bg-dark-2 border border-dark-3 rounded-lg px-3 py-2 text-sm text-white focus:border-gold outline-none";

  return (
    <>
      <Header />
      <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gold flex items-center gap-2">📋 Histórico de Bolões</h1>
        <p className="text-gray-500 text-sm mt-1">Todos os jogos finalizados com resultados do bolão</p>
      </div>

      {/* Filtros */}
      <Card className="p-4 mb-6">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Temporada</label>
            <select value={season} onChange={(e) => setSeason(e.target.value)} className={selectCls}>
              <option value="">Todas</option>
              {seasons.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Campeonato</label>
            <select value={comp} onChange={(e) => setComp(e.target.value)} className={selectCls}>
              <option value="">Todos</option>
              {comps.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">De</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={inputCls}/>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Até</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={inputCls}/>
          </div>
          {(season || comp || dateFrom || dateTo) && (
            <button onClick={() => { setSeason(""); setComp(""); setDateFrom(""); setDateTo(""); }}
              className="text-xs text-red-400 hover:text-red-300 transition-colors pb-1">✕ Limpar filtros</button>
          )}
        </div>
      </Card>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg"/></div>
      ) : matches.length === 0 ? (
        <Card className="p-10 text-center text-gray-500">Nenhum jogo encontrado com estes filtros.</Card>
      ) : (
        <div className="flex flex-col gap-3">
          {matches.map((m) => (
            <Card key={m.id} className="p-4 hover:border-gold/40 transition-colors">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    {m.homeTeamLogo && <img src={m.homeTeamLogo} alt={m.homeTeam} className="w-6 h-6 object-contain" />}
                    <span className="font-bold text-white">{m.homeTeam}</span>
                    <span className="bg-dark-3 px-3 py-1 rounded-lg font-black text-gold text-lg">
                      {m.homeScore ?? "?"} x {m.awayScore ?? "?"}
                    </span>
                    <span className="font-bold text-white">{m.awayTeam}</span>
                    {m.awayTeamLogo && <img src={m.awayTeamLogo} alt={m.awayTeam} className="w-6 h-6 object-contain" />}
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    <span className="text-xs text-gray-500">📆 {formatDate(m.matchDate)}</span>
                    <Badge color="gold" className="text-xs">{m.competition}</Badge>
                    <span className="text-xs text-gray-600">{m.season}</span>
                    {m.roundLabel && <span className="text-xs text-gray-600">{m.roundLabel}</span>}
                  </div>
                </div>
                <div className="flex gap-2 flex-col sm:flex-row">
                  <Link href={`/bolao/resultado/${m.id}`}
                    className="bg-dark-2 border border-dark-3 hover:border-gold text-sm px-4 py-2 rounded-lg transition-colors whitespace-nowrap text-center">
                    Ver Resultado →
                  </Link>
                  <Link href={`/bolao/acertadores/${m.id}`}
                    className="bg-dark-2 border border-[#C8A951]/30 hover:border-[#C8A951] text-[#C8A951] text-sm px-4 py-2 rounded-lg transition-colors whitespace-nowrap text-center font-semibold">
                    🏆 Acertadores
                  </Link>
                </div>
              </div>
            </Card>
          ))}
          <p className="text-center text-xs text-gray-600 mt-2">{matches.length} jogo{matches.length !== 1 ? "s" : ""} encontrado{matches.length !== 1 ? "s" : ""}</p>
        </div>
      )}
    </div>
      <Footer />
    </>
  );
}
