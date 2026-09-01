"use client";

import { useState, useCallback, useRef } from "react";
import { GitMerge, Search, AlertTriangle, CheckCircle2, Loader2, ArrowRight, User } from "lucide-react";
import api from "@/lib/api";

interface UserCard {
  id: string;
  nick: string;
  email?: string;
  fullName?: string;
  isActive: boolean;
  isClaimed: boolean;
  predictionsCount: number;
  ranking?: { total_points: number; season: string } | null;
}

interface PreviewData {
  source: UserCard;
  target: UserCard;
  actions: string[];
}

function UserCardView({ user, label, accent }: { user: UserCard; label: string; accent: string }) {
  return (
    <div className={`rounded-xl border ${accent} bg-[#1a1a1a] p-4 flex-1 min-w-0`}>
      <p className="text-xs font-semibold uppercase tracking-wide mb-3 text-gray-400">{label}</p>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[#2d2d2d] flex items-center justify-center shrink-0">
          <User size={20} className="text-gray-400" />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-white truncate">{user.nick}</p>
          <p className="text-sm text-gray-400 truncate">{user.email ?? "sem email"}</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <div className="bg-[#2d2d2d] rounded-lg p-2">
          <p className="text-xs text-gray-500">Palpites</p>
          <p className="font-semibold text-white">{user.predictionsCount}</p>
        </div>
        <div className="bg-[#2d2d2d] rounded-lg p-2">
          <p className="text-xs text-gray-500">Pontos</p>
          <p className="font-semibold text-white">{user.ranking?.total_points ?? 0}</p>
        </div>
        <div className="bg-[#2d2d2d] rounded-lg p-2 col-span-2">
          <p className="text-xs text-gray-500">Status</p>
          <p className="font-semibold text-white">
            {user.isActive ? "Ativo" : "Inativo"} · {user.isClaimed ? "Cadastrado" : "Não cadastrado"}
          </p>
        </div>
      </div>
    </div>
  );
}

function UserSearch({
  label,
  onSelect,
  selected,
  excludeId,
}: {
  label: string;
  onSelect: (u: any) => void;
  selected: any;
  excludeId?: string;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const search = useCallback(
    (q: string) => {
      clearTimeout(timerRef.current);
      if (q.length < 2) { setResults([]); return; }
      timerRef.current = setTimeout(async () => {
        setLoading(true);
        try {
          const { data } = await api.get("/master/users");
          const filtered = data.filter(
            (u: any) =>
              u.id !== excludeId &&
              (u.nick?.toLowerCase().includes(q.toLowerCase()) ||
                u.email?.toLowerCase().includes(q.toLowerCase())),
          );
          setResults(filtered.slice(0, 8));
        } catch {
          setResults([]);
        } finally {
          setLoading(false);
        }
      }, 350);
    },
    [excludeId],
  );

  return (
    <div className="flex-1 min-w-0">
      <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
      {selected ? (
        <div className="flex items-center gap-2 border border-[#C8A951]/40 rounded-lg p-2 bg-[#1a1a1a]">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white truncate">{selected.nick}</p>
            <p className="text-xs text-gray-400 truncate">{selected.email ?? "sem email"}</p>
          </div>
          <button
            onClick={() => { onSelect(null); setQuery(""); setResults([]); }}
            className="text-red-400 hover:text-red-300 text-xs font-medium shrink-0 transition-colors"
          >
            Trocar
          </button>
        </div>
      ) : (
        <div className="relative">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-2.5 text-gray-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); search(e.target.value); }}
              placeholder="Buscar por nick ou email…"
              className="w-full border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm bg-[#2d2d2d] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#C8A951]/50"
            />
            {loading && <Loader2 size={14} className="absolute right-3 top-2.5 text-gray-400 animate-spin" />}
          </div>
          {results.length > 0 && (
            <ul className="absolute z-10 w-full mt-1 bg-[#2d2d2d] border border-white/10 rounded-lg shadow-xl max-h-56 overflow-y-auto">
              {results.map((u) => (
                <li key={u.id}>
                  <button
                    onClick={() => { onSelect(u); setQuery(""); setResults([]); }}
                    className="w-full text-left px-3 py-2 hover:bg-[#3d3d3d] flex items-center gap-2 transition-colors"
                  >
                    <User size={14} className="text-gray-400 shrink-0" />
                    <div className="min-w-0">
                      <span className="font-medium text-white block truncate">{u.nick}</span>
                      <span className="text-xs text-gray-400 block truncate">{u.email ?? "sem email"}</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

type Step = "select" | "preview" | "done";

export default function MergeAccountsPage() {
  const [step, setStep] = useState<Step>("select");
  const [source, setSource] = useState<any>(null);
  const [target, setTarget] = useState<any>(null);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handlePreview = async () => {
    if (!source || !target) return;
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get<PreviewData>(
        `/master/merge-accounts/preview?sourceId=${source.id}&targetId=${target.id}`,
      );
      setPreview(data);
      setStep("preview");
    } catch (e: any) {
      setError(e.response?.data?.message ?? "Erro ao gerar prévia");
    } finally {
      setLoading(false);
    }
  };

  const handleMerge = async () => {
    if (!preview) return;
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/master/merge-accounts", {
        sourceUserId: source.id,
        targetUserId: target.id,
      });
      setSuccessMsg(data.message);
      setStep("done");
    } catch (e: any) {
      setError(e.response?.data?.message ?? "Erro ao mesclar contas");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep("select");
    setSource(null);
    setTarget(null);
    setPreview(null);
    setError("");
    setSuccessMsg("");
  };

  const steps: Step[] = ["select", "preview", "done"];
  const stepLabels = ["Selecionar", "Confirmar", "Concluído"];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[#C8A951] rounded-lg flex items-center justify-center">
          <GitMerge size={20} className="text-black" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Mesclar Contas</h1>
          <p className="text-sm text-gray-400">Transfira credenciais de uma conta nova para um nick existente</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 text-sm">
        {steps.map((s, i) => {
          const currentIdx = steps.indexOf(step);
          const done = i < currentIdx;
          const active = s === step;
          return (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${active ? "bg-[#C8A951] text-black" : done ? "bg-green-500 text-white" : "bg-[#2d2d2d] text-gray-500"}`}>
                {i + 1}
              </div>
              <span className={active ? "font-semibold text-white" : done ? "text-green-400" : "text-gray-500"}>
                {stepLabels[i]}
              </span>
              {i < 2 && <span className="text-gray-600 mx-1">›</span>}
            </div>
          );
        })}
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-900/30 border border-red-500/40 rounded-lg p-3 text-red-300 text-sm">
          <AlertTriangle size={16} className="shrink-0" />
          {error}
        </div>
      )}

      {/* ── Step 1: Select ── */}
      {step === "select" && (
        <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-6 space-y-5">
          <p className="text-sm text-gray-400">
            <span className="text-[#C8A951] font-semibold">Conta nova</span> = quem se recadastrou (tem e-mail/senha, pouco histórico).<br />
            <span className="text-[#C8A951] font-semibold">Nick existente</span> = o nick antigo com todo o histórico de palpites e ranking.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <UserSearch label="Conta nova (origem)" onSelect={setSource} selected={source} excludeId={target?.id} />
            <div className="flex items-center justify-center pt-7 shrink-0">
              <ArrowRight size={20} className="text-gray-500" />
            </div>
            <UserSearch label="Nick existente (destino)" onSelect={setTarget} selected={target} excludeId={source?.id} />
          </div>

          <button
            onClick={handlePreview}
            disabled={!source || !target || loading}
            className="w-full bg-[#C8A951] text-black py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-40 hover:bg-[#d4b55a] transition-colors"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            Pré-visualizar mesclagem
          </button>
        </div>
      )}

      {/* ── Step 2: Preview ── */}
      {step === "preview" && preview && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-stretch">
            <UserCardView user={preview.source} label="Conta nova (origem)" accent="border-blue-500/50" />
            <div className="flex items-center justify-center shrink-0">
              <ArrowRight size={24} className="text-gray-500" />
            </div>
            <UserCardView user={preview.target} label="Nick existente (destino)" accent="border-[#C8A951]/50" />
          </div>

          <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-5 space-y-3">
            <h3 className="font-semibold text-white">O que será feito:</h3>
            <ul className="space-y-2">
              {preview.actions.map((a, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                  <CheckCircle2 size={16} className="text-green-400 mt-0.5 shrink-0" />
                  {a}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-start gap-3 bg-amber-900/20 border border-amber-500/30 rounded-lg p-4">
            <AlertTriangle size={18} className="text-amber-400 mt-0.5 shrink-0" />
            <p className="text-sm text-amber-300">
              Esta ação é <strong className="text-amber-200">irreversível</strong>. A conta nova será desativada e seu e-mail removido. Certifique-se antes de confirmar.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => { setStep("select"); setError(""); }}
              className="flex-1 border border-white/20 text-gray-300 py-2.5 rounded-lg font-medium hover:bg-white/5 transition-colors"
            >
              Voltar
            </button>
            <button
              onClick={handleMerge}
              disabled={loading}
              className="flex-1 bg-[#C8A951] text-black py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-40 hover:bg-[#d4b55a] transition-colors"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <GitMerge size={16} />}
              Confirmar mesclagem
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Done ── */}
      {step === "done" && (
        <div className="bg-[#1a1a1a] border border-green-500/30 rounded-xl p-8 text-center space-y-4">
          <CheckCircle2 size={48} className="text-green-400 mx-auto" />
          <h2 className="text-xl font-bold text-white">Mesclagem concluída!</h2>
          <p className="text-gray-300 text-sm">{successMsg}</p>
          <button
            onClick={reset}
            className="mt-4 bg-[#C8A951] text-black px-6 py-2.5 rounded-lg font-bold hover:bg-[#d4b55a] transition-colors"
          >
            Nova mesclagem
          </button>
        </div>
      )}
    </div>
  );
}
