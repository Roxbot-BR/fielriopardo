"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { Match, Prediction } from "@/types";
import { formatDate, formatTime } from "@/lib/utils";
import Card from "@/components/ui/Card";
import { CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Spinner from "@/components/ui/Spinner";
import toast from "react-hot-toast";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { BarChart2, TrendingUp } from "lucide-react";
import { GoalCelebration } from "@/components/GoalCelebration";
import { CountdownTimer } from "@/components/CountdownTimer";

interface PubPrediction {
  id: string;
  nick: string;
  homeScore: number;
  awayScore: number;
  submittedAt: string;
  updatedAt: string;
}

interface MatchInsights {
  totalPredictions: number;
  topPrediction: string | null;
  topPredictionCount: number;
  topPredictionPct: number;
  distribution: { score: string; count: number; pct: number }[];
  winPct: number;
  drawPct: number;
  lossPct: number;
  aiContext: string | null;
}

interface OddsData {
  found: boolean;
  reason?: string;
  homeWin?: { odd: number; label: string; pct: number };
  draw?: { odd: number; label: string; pct: number };
  awayWin?: { odd: number; label: string; pct: number };
  source?: string;
  updatedAt?: string;
  cacheLabel?: string;
  summary?: string;
}

const CHANNEL_URLS: Record<string, string> = {
  'ESPN':                'https://www.disneyplus.com',
  'ESPN Brasil':         'https://www.disneyplus.com',
  'Disney+':             'https://www.disneyplus.com',
  'Amazon Prime Video':  'https://www.primevideo.com',
  'Premiere':            'https://premiere.globo.com',
  'SporTV':              'https://ge.globo.com/sportv/',
  'TV Globo':            'https://globoplay.globo.com',
  'Globoplay':           'https://globoplay.globo.com',
  'Paramount+':          'https://www.paramountplus.com',
  'CONMEBOL TV':         'https://conmeboltv.com.br',
  'Cazé TV':             'https://www.youtube.com/@CazeTV/live',
  'Caze TV':             'https://www.youtube.com/@CazeTV/live',
  'CazéTV':              'https://www.youtube.com/@CazeTV/live',
  'SBT':                 'https://www.sbt.com.br/ao-vivo',
  'RecordTV':            'https://www.r7.com/recordtv',
  'TV Band':             'https://www.band.uol.com.br/ao-vivo',
  'YouTube':             'https://www.youtube.com/@Corinthians/live',
  'GOAT':                'https://www.youtube.com/@CanalGOAT/live',
  'GeTV':                'https://ge.globo.com',
  'Record':              'https://www.r7.com/recordtv',
  'Globo':               'https://globoplay.globo.com',
};

export default function PalpitePage() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [match, setMatch]             = useState<Match | null>(null);
  const [myPred, setMyPred]           = useState<Prediction | null>(null);
  const [allPreds, setAllPreds]       = useState<PubPrediction[]>([]);
  const [insights, setInsights]       = useState<MatchInsights | null>(null);
  const [odds, setOdds]               = useState<OddsData | null>(null);
  const [oddsLoading, setOddsLoading] = useState(true);
  const [home, setHome]               = useState("");
  const [away, setAway]               = useState("");
  const [saving, setSaving]           = useState(false);
  const [loading, setLoading]         = useState(true);
  const [showGoal, setShowGoal]       = useState(false);
  const [savedPalpite, setSavedPalpite] = useState("");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/bolao/entrar");
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated || !id) return;
    // Primary data — shows the page
    Promise.all([
      api.get(`/matches/${id}`),
      api.get(`/bolao/my-prediction/${id}`).catch(() => ({ data: null })),
    ]).then(([m, p]) => {
      setMatch(m.data);
      if (p.data) {
        setMyPred(p.data);
        setHome(String(p.data.homeScore));
        setAway(String(p.data.awayScore));
      }
    }).finally(() => {
      setLoading(false);
      // Secondary cards — non-blocking after page renders
      api.get(`/bolao/predictions/${id}`)
        .then((r: any) => setAllPreds(Array.isArray(r.data) ? r.data : []))
        .catch(() => {});
      api.get(`/bolao/insights/${id}`)
        .then((r: any) => r.data && setInsights(r.data))
        .catch(() => {});
      api.get<OddsData>(`/bolao/odds/${id}`)
        .then((r) => setOdds(r.data))
        .catch(() => setOdds({ found: false, reason: "Não foi possível buscar odds" }))
        .finally(() => setOddsLoading(false));
    });
  }, [id, isAuthenticated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (home === "" || away === "") return toast.error("Preencha ambos os placares");
    setSaving(true);
    try {
      const { data } = await api.post(`/bolao/predict`, {
        matchId: id, homeScore: +home, awayScore: +away,
      });
      setMyPred(data);
      setSavedPalpite(`${+home} × ${+away}`);
      setShowGoal(true);
      toast.success(myPred ? "Palpite alterado! ✅" : "Palpite enviado! ⚽");
      api.get(`/bolao/predictions/${id}`)
        .then((r) => setAllPreds(Array.isArray(r.data) ? r.data : []))
        .catch(() => null);
      // Refresh insights after new prediction
      api.get(`/bolao/insights/${id}`)
        .then((r) => r.data && setInsights(r.data))
        .catch(() => null);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? "Erro ao enviar palpite");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || loading) return (
    <><Header /><div className="flex justify-center py-20"><Spinner size="lg"/></div><Footer /></>
  );
  if (!match) return (
    <><Header /><div className="text-center py-20 text-gray-500">Jogo não encontrado.</div><Footer /></>
  );

  const scoreInput = "w-20 text-3xl font-black text-center bg-dark-3 border-2 border-dark-3 focus:border-gold outline-none rounded-xl py-3 text-white transition-colors";

  return (
    <>
      <Header />
      <div className="max-w-xl mx-auto px-4 py-10 flex flex-col gap-6">

        {/* Match header */}
        <div className="text-center">
          <Badge color={match.bolaoOpen ? "gold" : "red"} className="mb-3">
            {match.bolaoOpen ? "🟢 Bolão Aberto" : "🔒 Bolão Encerrado"}
          </Badge>
          <h1 className="text-xl font-bold text-gray-300 mb-1">{match.competition}</h1>
          <div className="text-sm text-gray-500">
            {formatDate(match.matchDate)} · {formatTime(match.matchDate)} · {match.stadium}
          </div>
        </div>

        {/* Teams card */}
        <Card className="border-gold shadow-[0_0_20px_rgba(200,169,81,0.3)] p-6">
          <div className="flex items-center justify-center gap-4 text-center">
            <div className="flex-1 flex flex-col items-center gap-2">
              {match.homeTeamLogo && (
                <img src={match.homeTeamLogo} alt={match.homeTeam} className="w-14 h-14 object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              )}
              <div className="text-base font-bold text-white">{match.homeTeam}</div>
            </div>
            <div className="text-gold text-2xl font-black">X</div>
            <div className="flex-1 flex flex-col items-center gap-2">
              {match.awayTeamLogo && (
                <img src={match.awayTeamLogo} alt={match.awayTeam} className="w-14 h-14 object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              )}
              <div className="text-base font-bold text-white">{match.awayTeam}</div>
            </div>
          </div>
          {match.tvChannel && (
            <div className="flex justify-center items-center gap-1.5 flex-wrap mt-3 text-xs">
              <span className="text-gray-500">📺</span>
              {match.tvChannel.split(/\s*\/\s*/).map((ch: string, i: number) => {
                const trimmed = ch.trim();
                const url = match.matchStats?.broadcastUrls?.[trimmed] || CHANNEL_URLS[trimmed];
                return (
                  <span key={trimmed}>
                    {i > 0 && <span className="text-gray-600 mx-0.5">·</span>}
                    {url ? (
                      <a href={url} target="_blank" rel="noopener noreferrer"
                         className="text-yellow-400 hover:text-yellow-300 underline underline-offset-2 transition-colors">
                        {trimmed}
                      </a>
                    ) : (
                      <span className="text-gray-400">{trimmed}</span>
                    )}
                  </span>
                );
              })}
            </div>
          )}
        </Card>

        {match.bolaoOpen && new Date(match.matchDate).getTime() > Date.now() && (
          <CountdownTimer targetDate={match.matchDate} label="Bolão fecha em:" />
        )}

        {/* Odds card */}
        <section>
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <BarChart2 size={18} className="text-[#C8A951]" />
            Probabilidades
          </h2>
          <Card variant="default">
            <CardContent className="p-5">
              {oddsLoading ? (
                <div className="flex items-center gap-3 py-4">
                  <Spinner size="sm" />
                  <span className="text-gray-400 text-sm">Carregando odds...</span>
                </div>
              ) : odds?.found ? (
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-3 text-center">
                      <div className="text-xs text-green-400 font-bold uppercase tracking-wider mb-1 leading-tight">{odds.homeWin?.label}</div>
                      <div className="text-2xl font-black text-white">{odds.homeWin?.odd?.toFixed(2)}</div>
                      <div className="text-xs text-gray-400 mt-1">{odds.homeWin?.pct}% chance</div>
                    </div>
                    <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-3 text-center">
                      <div className="text-xs text-yellow-400 font-bold uppercase tracking-wider mb-1">Empate</div>
                      <div className="text-2xl font-black text-white">{odds.draw?.odd?.toFixed(2)}</div>
                      <div className="text-xs text-gray-400 mt-1">{odds.draw?.pct}% chance</div>
                    </div>
                    <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-3 text-center">
                      <div className="text-xs text-red-400 font-bold uppercase tracking-wider mb-1 leading-tight">{odds.awayWin?.label}</div>
                      <div className="text-2xl font-black text-white">{odds.awayWin?.odd?.toFixed(2)}</div>
                      <div className="text-xs text-gray-400 mt-1">{odds.awayWin?.pct}% chance</div>
                    </div>
                  </div>
                  {odds.homeWin?.pct && odds.draw?.pct && odds.awayWin?.pct && (
                    <div className="flex rounded-full overflow-hidden h-3">
                      <div className="bg-green-500 transition-all" style={{ width: `${odds.homeWin.pct}%` }} title={`Vitória ${odds.homeWin.pct}%`} />
                      <div className="bg-yellow-500 transition-all" style={{ width: `${odds.draw.pct}%` }} title={`Empate ${odds.draw.pct}%`} />
                      <div className="bg-red-500 transition-all" style={{ width: `${odds.awayWin.pct}%` }} title={`Derrota ${odds.awayWin.pct}%`} />
                    </div>
                  )}
                  {odds.summary && (
                    <p className="text-gray-300 text-sm leading-relaxed">{odds.summary}</p>
                  )}
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span>Fonte: Google</span>
                    {odds.updatedAt && <span>{odds.updatedAt}</span>}
                    {odds.cacheLabel && <span className="text-gray-500">· atualizado {odds.cacheLabel}</span>}
                  </div>
                  <p className="text-xs text-gray-600 italic">⚠️ Odds obtidas em tempo real via busca na web. Valores podem variar. Não constituem recomendação de apostas.</p>
                </div>
              ) : (
                <div className="py-4 text-center">
                  <p className="text-gray-500 text-sm">{odds?.reason || "Odds não disponíveis para este jogo no momento."}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Palpite form */}
        {match.bolaoOpen ? (
          <form onSubmit={handleSubmit}>
            <Card className="p-6">
              <h2 className="text-center text-gold font-semibold mb-6">
                {myPred ? "✏️ Alterar Palpite" : "🎯 Dar Palpite"}
              </h2>
              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="text-center">
                  {match.homeTeamLogo && (
                    <img src={match.homeTeamLogo} alt={match.homeTeam}
                      className="w-10 h-10 object-contain mx-auto mb-1"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  )}
                  <div className="text-xs text-gray-500 mb-2">{match.homeTeam}</div>
                  <input type="number" min={0} max={20} value={home}
                    onChange={(e) => setHome(e.target.value)}
                    className={scoreInput} placeholder="0" required />
                </div>
                <div className="text-2xl font-black text-gold mt-4">X</div>
                <div className="text-center">
                  {match.awayTeamLogo && (
                    <img src={match.awayTeamLogo} alt={match.awayTeam}
                      className="w-10 h-10 object-contain mx-auto mb-1"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  )}
                  <div className="text-xs text-gray-500 mb-2">{match.awayTeam}</div>
                  <input type="number" min={0} max={20} value={away}
                    onChange={(e) => setAway(e.target.value)}
                    className={scoreInput} placeholder="0" required />
                </div>
              </div>
              {myPred && (
                <p className="text-center text-xs text-gray-500 mb-4">
                  Palpite atual: <strong className="text-white">{myPred.homeScore}x{myPred.awayScore}</strong>
                  {" "}· Alterações: {myPred.changeCount}
                </p>
              )}
              <Button type="submit" loading={saving} size="lg" className="w-full">
                {myPred ? "💾 Salvar Alteração" : "⚽ Confirmar Palpite"}
              </Button>
              <p className="text-center text-xs text-gray-600 mt-3">
                Palpites aceitos até 1 minuto antes do jogo
              </p>
            </Card>
          </form>
        ) : (
          <Card className="p-6 text-center">
            <div className="text-4xl mb-3">🔒</div>
            <p className="text-gray-400">O bolão deste jogo está encerrado.</p>
            {myPred && (
              <p className="text-gold mt-2 font-semibold">
                Seu palpite: {myPred.homeScore}x{myPred.awayScore}
              </p>
            )}
            <Button variant="secondary" size="sm" className="mt-4"
              onClick={() => router.push(`/bolao/resultado/${id}`)}>
              Ver Resultado →
            </Button>
          </Card>
        )}

        {/* Insights / Curiosidades */}
        {insights && (
          <section>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-[#C8A951]" />
              Curiosidades do Bolão
            </h2>
            <Card variant="default">
              <CardContent className="p-5 flex flex-col gap-5">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 bg-[#C8A951]/10 border border-[#C8A951]/30 rounded-xl p-4 text-center">
                    <div className="text-xs text-[#C8A951] font-bold uppercase tracking-wider mb-1">Palpite Mais Votado</div>
                    <div className="text-3xl font-black text-white">{insights.topPrediction}</div>
                    <div className="text-sm text-gray-400 mt-1">
                      {insights.topPredictionCount} voto{insights.topPredictionCount !== 1 ? "s" : ""} · {insights.topPredictionPct}%
                    </div>
                  </div>
                  <div className="flex-1 bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-4">
                    <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-3">O Bolão aposta em...</div>
                    <div className="flex justify-between text-sm">
                      <div className="text-center">
                        <div className="text-green-400 font-black text-xl">{insights.winPct}%</div>
                        <div className="text-gray-500 text-xs">Vitória Corinthians</div>
                      </div>
                      <div className="text-center">
                        <div className="text-yellow-400 font-black text-xl">{insights.drawPct}%</div>
                        <div className="text-gray-500 text-xs">Empate</div>
                      </div>
                      <div className="text-center">
                        <div className="text-red-400 font-black text-xl">{insights.lossPct}%</div>
                        <div className="text-gray-500 text-xs">Derrota</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-3">Distribuição dos Palpites</div>
                  <div className="flex flex-col gap-2">
                    {insights.distribution.map((d) => (
                      <div key={d.score} className="flex items-center gap-3">
                        <div className="w-14 text-right text-white font-bold text-sm">{d.score}</div>
                        <div className="flex-1 bg-[#1a1a1a] rounded-full h-5 overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-[#C8A951] to-[#8B6914] rounded-full transition-all"
                            style={{ width: `${d.pct}%` }} />
                        </div>
                        <div className="w-16 text-gray-400 text-xs">{d.count}x · {d.pct}%</div>
                      </div>
                    ))}
                  </div>
                </div>
                {insights.aiContext && (
                  <div className="border-t border-[#2d2d2d] pt-4">
                    <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">📚 Contexto do Confronto</div>
                    <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">{insights.aiContext}</div>
                    <div className="mt-2 text-xs text-gray-600 italic">⚠️ Contexto baseado em dados históricos. Odds em tempo real são exibidas no card acima.</div>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        )}

        {/* Transparency — all predictions */}
        {allPreds.length > 0 && (
          <Card className="p-5">
            <h2 className="text-gold font-semibold mb-1 flex items-center gap-2">
              🎯 Palpites dos Participantes
              <span className="text-xs text-gray-500 font-normal">({allPreds.length})</span>
            </h2>
            <p className="text-xs text-gray-600 mb-4">Todos os palpites registrados — visível apenas para participantes logados.</p>
            <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1">
              {allPreds.map((pred) => {
                const isMe = myPred &&
                  pred.homeScore === myPred.homeScore &&
                  pred.awayScore === myPred.awayScore &&
                  pred.nick === (myPred as any).nick;
                return (
                  <div key={pred.id}
                    className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
                      isMe
                        ? "bg-[#C8A951]/10 border border-[#C8A951]/40"
                        : "bg-[#111] border border-[#1a1a1a]"
                    }`}>
                    <div className="flex items-center gap-2">
                      {isMe && <span className="text-xs text-[#C8A951]">✓</span>}
                      <span className={`font-medium ${isMe ? "text-[#C8A951]" : "text-white"}`}>{pred.nick}</span>
                    </div>
                    <span className={`font-black text-base ${isMe ? "text-[#C8A951]" : "text-white"}`}>
                      {pred.homeScore} × {pred.awayScore}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

      </div>
      <Footer />
      <GoalCelebration show={showGoal} palpite={savedPalpite} onDone={() => setShowGoal(false)} />
    </>
  );
}
