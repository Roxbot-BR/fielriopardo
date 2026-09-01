"use client";
import { useEffect, useState, useMemo } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ShirtIcon, KitPlaceholder } from "@/components/ui/ShirtIcon";
import api from "@/lib/api";

interface Kit {
  id: string;
  yearStart: number;
  yearEnd: number | null;
  type: string;
  manufacturer: string | null;
  eraLabel: string | null;
  title: string;
  description: string | null;
  imageUrl: string | null;
  sourceCredit: string | null;
  displayOrder: number | null;
}

const TYPE_LABELS: Record<string, string> = {
  all: "Todos",
  home: "Titular",
  away: "Reserva",
  third: "Terceiro",
  goalkeeper: "Goleiro",
  special: "Especial",
  training: "Treino",
};

const TYPE_BADGE: Record<string, string> = {
  home:       "bg-white text-gray-800 border border-gray-300",
  away:       "bg-gray-800 text-white border border-gray-600",
  third:      "bg-purple-700 text-white",
  goalkeeper: "bg-yellow-400 text-gray-900",
  special:    "bg-[#C8A951] text-black",
  training:   "bg-green-700 text-white",
};

const ERAS = [
  "Era Fundação",
  "Anos 30",
  "Anos 40",
  "Anos 50",
  "Anos 60",
  "Anos 70",
  "Democracia Corinthiana",
  "Era Finta",
  "Era Topper",
  "Era Nike Clássica",
  "Era Nike Moderna",
];

function getDecade(year: number) {
  return Math.floor(year / 10) * 10;
}

function KitImage({ kit, height = 150 }: { kit: Kit; height?: number }) {
  const [imgError, setImgError] = useState(false);
  if (!kit.imageUrl || imgError) {
    return <KitPlaceholder type={kit.type} yearStart={kit.yearStart} height={height} />;
  }
  return (
    <img
      src={kit.imageUrl}
      alt={kit.title}
      className="w-full object-contain"
      style={{ height, objectFit: "contain" }}
      onError={() => setImgError(true)}
      loading="lazy"
      referrerPolicy="no-referrer"
    />
  );
}

function KitModal({ kit, onClose }: { kit: Kit; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#1a1a1a] rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative w-full bg-[#111] rounded-t-2xl overflow-hidden">
          <KitImage kit={kit} height={300} />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center text-lg hover:bg-black/80"
          >
            ×
          </button>
        </div>
        <div className="p-5">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${TYPE_BADGE[kit.type] ?? "bg-gray-700 text-white"}`}>
              {TYPE_LABELS[kit.type] ?? kit.type}
            </span>
            {kit.eraLabel && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#C8A951]/20 text-[#C8A951]">
                {kit.eraLabel}
              </span>
            )}
          </div>
          <h2 className="text-white text-xl font-bold mb-1">{kit.title}</h2>
          <p className="text-[#C8A951] text-sm font-medium mb-3">
            {kit.yearStart}{kit.yearEnd && kit.yearEnd !== kit.yearStart ? `\u2013${kit.yearEnd}` : ""}
            {kit.manufacturer ? ` \u00b7 ${kit.manufacturer}` : ""}
          </p>
          {kit.description && (
            <p className="text-gray-300 text-sm leading-relaxed">{kit.description}</p>
          )}
          {kit.sourceCredit && (
            <p className="text-gray-600 text-xs mt-4">Fonte: {kit.sourceCredit}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function UniformesPage() {
  const [allKits, setAllKits] = useState<Kit[]>([]);
  const [typeFilter, setTypeFilter] = useState("all");
  const [eraFilter, setEraFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedKit, setSelectedKit] = useState<Kit | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Kit[]>("/kits")
      .then((r) => setAllKits(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return allKits.filter((k) => {
      if (typeFilter !== "all" && k.type !== typeFilter) return false;
      if (eraFilter !== "all" && k.eraLabel !== eraFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const inYear = String(k.yearStart).includes(q);
        const inTitle = k.title.toLowerCase().includes(q);
        const inMfr = (k.manufacturer ?? "").toLowerCase().includes(q);
        if (!inYear && !inTitle && !inMfr) return false;
      }
      return true;
    });
  }, [allKits, typeFilter, eraFilter, search]);

  const decades = useMemo(() =>
    Array.from(new Set(filtered.map((k) => getDecade(k.yearStart)))).sort(),
    [filtered]
  );

  const eraOptions = useMemo(() =>
    ERAS.filter((era) => allKits.some((k) => k.eraLabel === era)),
    [allKits]
  );

  return (
    <div className="min-h-screen bg-[#111] text-white flex flex-col">
      <Header />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">

        {/* Hero */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold text-white mb-1 flex items-center justify-center gap-2">
            <ShirtIcon size={32} />
            Uniformes do Timão
          </h1>
          <p className="text-[#C8A951] font-medium">1910–2026 · Evolução histórica completa</p>
          {!loading && (
            <p className="text-gray-400 text-sm mt-1">
              {allKits.length} uniformes catalogados · {filtered.length} exibidos
            </p>
          )}
        </div>

        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Buscar por ano, nome ou fabricante..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#222] text-white placeholder-gray-500 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#C8A951]"
          />
        </div>

        {/* Type filters */}
        <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
          {Object.entries(TYPE_LABELS).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTypeFilter(key)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all ${
                typeFilter === key ? "bg-[#C8A951] text-black" : "bg-[#222] text-gray-300 hover:bg-[#333]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Era filters */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setEraFilter("all")}
            className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              eraFilter === "all" ? "bg-[#C8A951]/30 text-[#C8A951] border border-[#C8A951]/50" : "bg-[#1a1a1a] text-gray-400 hover:bg-[#222]"
            }`}
          >
            Todas as eras
          </button>
          {eraOptions.map((era) => (
            <button
              key={era}
              onClick={() => setEraFilter(era)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                eraFilter === era ? "bg-[#C8A951]/30 text-[#C8A951] border border-[#C8A951]/50" : "bg-[#1a1a1a] text-gray-400 hover:bg-[#222]"
              }`}
            >
              {era}
            </button>
          ))}
        </div>

        {loading && (
          <div className="text-center py-20 text-gray-500">
            <div className="flex justify-center mb-3">
              <ShirtIcon size={48} />
            </div>
            Carregando uniformes...
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            <div className="flex justify-center mb-3">
              <ShirtIcon size={48} />
            </div>
            Nenhum uniforme encontrado para os filtros selecionados
          </div>
        )}

        {/* Grouped by decade */}
        {!loading && decades.map((decade) => {
          const decadeKits = filtered.filter((k) => getDecade(k.yearStart) === decade);
          if (decadeKits.length === 0) return null;
          const era = decadeKits[0]?.eraLabel;
          return (
            <div key={decade} className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-[#C8A951] font-bold text-lg">{decade}s</h2>
                {era && eraFilter === "all" && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#C8A951]/10 text-[#C8A951]/70">{era}</span>
                )}
                <div className="flex-1 h-px bg-[#C8A951]/20" />
                <span className="text-gray-500 text-sm">{decadeKits.length}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {decadeKits.map((kit) => (
                  <button
                    key={kit.id}
                    onClick={() => setSelectedKit(kit)}
                    className="bg-[#1a1a1a] rounded-xl overflow-hidden hover:ring-2 hover:ring-[#C8A951] transition-all text-left group"
                  >
                    <div className="relative overflow-hidden rounded-t-xl bg-[#111]">
                      <KitImage kit={kit} height={140} />
                      <span className={`absolute top-2 left-2 text-xs font-bold px-2 py-0.5 rounded-full ${TYPE_BADGE[kit.type] ?? "bg-gray-700 text-white"}`}>
                        {TYPE_LABELS[kit.type] ?? kit.type}
                      </span>
                    </div>
                    <div className="p-2.5">
                      <div className="text-[#C8A951] text-xs font-bold mb-0.5">{kit.yearStart}</div>
                      <div className="text-white text-xs font-semibold leading-tight line-clamp-2">{kit.title}</div>
                      {kit.manufacturer && (
                        <div className="text-gray-500 text-xs mt-0.5">{kit.manufacturer}</div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}

        <div className="mt-8 p-4 bg-[#1a1a1a] rounded-xl text-center text-gray-500 text-xs">
          Imagens: Football Kit Archive (CC) · Dados históricos: Wikipedia PT, Wikimedia Commons (CC-BY-SA)
        </div>
      </main>

      <Footer />

      {selectedKit && (
        <KitModal kit={selectedKit} onClose={() => setSelectedKit(null)} />
      )}
    </div>
  );
}
