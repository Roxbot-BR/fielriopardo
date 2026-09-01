"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Caravan } from "@/types";
import { API_URL } from "@/lib/api";
import { Header } from "@/components/layout/Header";
import { Download, MessageCircle, ChevronLeft, ChevronRight, X, Camera, ZoomIn } from "lucide-react";

interface Photo { id: string; url: string; caption?: string; isFeatured?: boolean; }

const ANGLE_STEP = 42;   // graus entre cada foto no cilindro
const RADIUS     = 460;  // px — raio do cilindro
const SENSITIVITY = 0.28; // graus por pixel arrastado

export default function CaravanaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [caravan, setCaravan]   = useState<Caravan | null>(null);
  const [lbOpen, setLbOpen]     = useState(false);
  const [lbIndex, setLbIndex]   = useState(0);
  const [rotation, setRotation] = useState(0);
  const [snapping, setSnapping] = useState(false);

  const dragging      = useRef(false);
  const startX        = useRef(0);
  const startRotation = useRef(0);

  useEffect(() => {
    fetch(`${API_URL}/caravans/${id}`)
      .then(r => r.json())
      .then(setCaravan)
      .catch(console.error);
  }, [id]);

  const photos: Photo[] = (caravan?.photos ?? []) as Photo[];

  const openAt = useCallback((idx: number) => {
    setLbIndex(idx);
    setRotation(-idx * ANGLE_STEP);
    setSnapping(false);
    setLbOpen(true);
  }, []);

  const snapTo = useCallback((raw: number) => {
    const n = photos.length;
    const idx = Math.max(0, Math.min(n - 1, Math.round(-raw / ANGLE_STEP)));
    const target = -idx * ANGLE_STEP;
    setLbIndex(idx);
    setRotation(target);
    setSnapping(true);
  }, [photos.length]);

  const goTo = (next: number) => {
    if (next < 0 || next >= photos.length) return;
    setLbIndex(next);
    setRotation(-next * ANGLE_STEP);
    setSnapping(true);
  };

  // Pointer (mouse + touch unified)
  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current   = true;
    startX.current     = e.clientX;
    startRotation.current = rotation;
    setSnapping(false);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const delta = e.clientX - startX.current;
    setRotation(startRotation.current + delta * SENSITIVITY);
  };
  const onPointerUp = () => {
    if (!dragging.current) return;
    dragging.current = false;
    snapTo(rotation);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!lbOpen) return;
      if (e.key === "ArrowRight") { const ni = Math.min(lbIndex+1, photos.length-1); setLbIndex(ni); setRotation(-ni*ANGLE_STEP); setSnapping(true); }
      if (e.key === "ArrowLeft")  { const pi = Math.max(lbIndex-1, 0);               setLbIndex(pi); setRotation(-pi*ANGLE_STEP); setSnapping(true); }
      if (e.key === "Escape")     setLbOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lbOpen, lbIndex, photos.length]);

  if (!caravan) return (
    <div className="min-h-screen bg-transparent flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-2 border-[#C8A951] border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">Carregando caravana...</p>
      </div>
    </div>
  );

  const date  = new Date(caravan.departureDatetime);
  const spots = caravan.capacity - caravan.spotsTaken;
  const currentPhoto = photos[lbIndex] ?? null;

  function downloadPhoto(photo: Photo) {
    const a = document.createElement("a");
    a.href = photo.url;
    a.download = photo.caption ? photo.caption + ".jpg" : "foto-caravana.jpg";
    a.target = "_blank";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  }

  function shareWhatsApp(photo: Photo) {
    if (!caravan) return;
    const url  = encodeURIComponent(window.location.origin + photo.url);
    const text = encodeURIComponent("🖤🤍 " + caravan.title + (photo.caption ? " — " + photo.caption : "") + "\n");
    window.open("https://wa.me/?text=" + text + url, "_blank");
  }

  function buildWhatsAppLink() {
    if (!caravan) return "#";
    const num    = (caravan.contactWhatsapp ?? "").replace(/\D/g, "");
    const dtStr  = date.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
    const hrStr  = date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    const price  = Number(caravan.price) > 0 ? "\n💰 R$ " + Number(caravan.price).toFixed(2) : "";
    const msg    = encodeURIComponent(
      "Olá! Vim pelo site da Fiel Rio Pardo e tenho interesse na caravana:\n\n" +
      "🚌 *" + caravan.title + "*\n📅 " + dtStr + " às " + hrStr +
      "\n📍 " + caravan.departureCity + (caravan.departurePoint ? " — " + caravan.departurePoint : "") +
      price + "\n\nGostaria de garantir minha vaga. Pode me ajudar? 🦅"
    );
    return "https://wa.me/55" + num + "?text=" + msg;
  }

  return (
    <div className="min-h-screen bg-transparent text-white">
      <Header />

      {/* Hero */}
      <div className="relative h-72 md:h-96 bg-[#0a0a0a] overflow-hidden">
        {caravan.coverImage ? (
          <img src={caravan.coverImage} alt={caravan.title}
            className="w-full h-full object-cover opacity-75"
            style={{ objectPosition: (caravan as any).coverImagePosition ?? "50% 50%" }} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-8xl">🚌</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#C8A951] to-transparent opacity-60" />
        <div className="absolute bottom-6 left-6 right-6">
          <p className="text-[#C8A951] text-xs font-bold uppercase tracking-widest mb-1">Fiel Rio Pardo</p>
          <h1 className="text-2xl md:text-3xl font-black text-white drop-shadow-lg mb-2">{caravan.title}</h1>
          {caravan.match && <p className="text-gray-300 text-sm">⚽ {caravan.match.homeTeam} × {caravan.match.awayTeam} — {caravan.match.competition}</p>}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <Link href="/caravanas" className="inline-flex items-center gap-1 text-gray-500 hover:text-[#C8A951] text-sm mb-8 transition-colors">
          <ChevronLeft size={14} /> Voltar às caravanas
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            {caravan.description && (
              <div className="bg-[#111] rounded-2xl p-6 border border-[#2d2d2d]">
                <h2 className="text-base font-bold text-[#C8A951] uppercase tracking-wider mb-3">Sobre a caravana</h2>
                <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">{caravan.description}</p>
              </div>
            )}

            {photos.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-8 h-8 rounded-full bg-[#C8A951]/15 border border-[#C8A951]/30 flex items-center justify-center">
                    <Camera size={14} className="text-[#C8A951]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Álbum de Fotos</h2>
                    <p className="text-xs text-gray-500">{photos.length} foto{photos.length !== 1 ? "s" : ""}</p>
                  </div>
                  <div className="flex-1 h-px bg-gradient-to-r from-[#C8A951]/30 to-transparent" />
                </div>

                {/* Foto destaque */}
                {(() => {
                  const featured = photos.find(p => p.isFeatured) ?? photos[0];
                  const fidx = photos.indexOf(featured);
                  return (
                    <div className="relative mb-3 group">
                      <button onClick={() => openAt(fidx)}
                        className="relative w-full h-64 md:h-80 rounded-2xl overflow-hidden border border-[#2d2d2d] hover:border-[#C8A951]/40 transition-all shadow-[0_0_30px_rgba(0,0,0,0.6)] block">
                        <img src={featured.url} alt={featured.caption ?? "Foto em destaque"} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                        <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-[#C8A951]/50 rounded-tl-lg" />
                        <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-[#C8A951]/50 rounded-tr-lg" />
                        <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-[#C8A951]/50 rounded-bl-lg" />
                        <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-[#C8A951]/50 rounded-br-lg" />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="bg-black/60 rounded-full p-3 border border-[#C8A951]/40"><ZoomIn size={22} className="text-[#C8A951]" /></div>
                        </div>
                        {featured.caption && <p className="absolute bottom-3 left-4 right-16 text-white text-sm font-medium drop-shadow text-left">{featured.caption}</p>}
                      </button>
                      <div className="absolute top-3 right-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <button onClick={() => downloadPhoto(featured)} className="p-2 rounded-lg bg-black/70 border border-white/20 text-white hover:border-[#C8A951] hover:text-[#C8A951] transition-colors" title="Baixar"><Download size={14} /></button>
                        <button onClick={() => shareWhatsApp(featured)} className="p-2 rounded-lg bg-black/70 border border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366]/20 transition-colors" title="WhatsApp"><MessageCircle size={14} /></button>
                      </div>
                    </div>
                  );
                })()}

                {photos.length > 1 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {photos.map((p, idx) => (
                      <div key={p.id} className="group relative aspect-square">
                        <button onClick={() => openAt(idx)}
                          className="w-full h-full rounded-xl overflow-hidden border border-[#2d2d2d] hover:border-[#C8A951]/50 transition-all hover:scale-[1.03] hover:shadow-[0_0_15px_rgba(200,169,81,0.2)] block">
                          <img src={p.url} alt={p.caption ?? "Foto"} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" loading="lazy" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-xl" />
                          {p.isFeatured && <div className="absolute top-1 left-1 text-[#C8A951] text-[10px] drop-shadow">⭐</div>}
                        </button>
                        <div className="absolute bottom-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                          <button onClick={() => downloadPhoto(p)} className="p-1 rounded bg-black/80 text-white hover:text-[#C8A951] transition-colors" title="Baixar"><Download size={10} /></button>
                          <button onClick={() => shareWhatsApp(p)} className="p-1 rounded bg-black/80 text-[#25D366] hover:bg-[#25D366]/20 transition-colors" title="WhatsApp"><MessageCircle size={10} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-[#111] border border-[#2d2d2d] rounded-2xl p-6 space-y-4 sticky top-4">
              <h3 className="text-base font-bold text-[#C8A951] uppercase tracking-wider">Detalhes</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <span className="text-xl mt-0.5">📅</span>
                  <div>
                    <p className="text-gray-500 text-xs uppercase">Data de saída</p>
                    <p className="text-white font-medium capitalize">{date.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}</p>
                    <p className="text-[#C8A951]">{date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-xl mt-0.5">📍</span>
                  <div>
                    <p className="text-gray-500 text-xs uppercase">Local de saída</p>
                    <p className="text-white font-medium">{caravan.departureCity}</p>
                    <p className="text-gray-400 text-xs">{caravan.departurePoint}</p>
                  </div>
                </div>
                {caravan.price > 0 && (
                  <div className="flex items-start gap-3">
                    <span className="text-xl mt-0.5">💰</span>
                    <div>
                      <p className="text-gray-500 text-xs uppercase">Valor</p>
                      <p className="text-white font-bold text-lg">R$ {Number(caravan.price).toFixed(2)}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <span className="text-xl mt-0.5">👥</span>
                  <div>
                    <p className="text-gray-500 text-xs uppercase">Vagas</p>
                    <p className="text-white">{caravan.spotsTaken}/{caravan.capacity}</p>
                    <div className="w-full bg-[#2d2d2d] rounded-full h-1.5 mt-1.5">
                      <div className="bg-[#C8A951] h-1.5 rounded-full" style={{ width: Math.min(100, (caravan.spotsTaken / caravan.capacity) * 100) + "%" }} />
                    </div>
                    <p className="text-xs mt-1 text-gray-400">
                      {caravan.status === "open" ? spots + " vaga" + (spots !== 1 ? "s" : "") + " disponível" : caravan.status === "full" ? "⛔ Esgotada" : caravan.status}
                    </p>
                  </div>
                </div>
              </div>
              {caravan.contactWhatsapp && (
                <a href={buildWhatsAppLink()} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-[#C8A951] hover:bg-[#d4b85a] text-black font-bold py-3 rounded-xl transition-colors shadow-[0_0_20px_rgba(200,169,81,0.25)]">
                  <MessageCircle size={16} /> Reservar via WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ===== LIGHTBOX COVERFLOW 3D ===== */}
      {lbOpen && photos.length > 0 && currentPhoto && (
        <div className="fixed inset-0 z-[9999] flex flex-col bg-black/96 backdrop-blur-sm" style={{ userSelect: "none" }}>

          {/* Topo */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 flex-shrink-0 flex-wrap z-10">
            <div className="flex items-center gap-2 mr-2">
              <div className="w-8 h-8 rounded-full bg-black border-2 border-[#C8A951] flex items-center justify-center text-xs font-black text-white shadow-[0_0_12px_rgba(200,169,81,0.4)]">SC</div>
              <div>
                <p className="text-sm font-bold text-white leading-tight">{caravan.title}</p>
                <p className="text-xs text-[#C8A951]">{lbIndex + 1} / {photos.length}</p>
              </div>
            </div>
            <div className="flex-1" />
            <button onClick={() => downloadPhoto(currentPhoto)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#1a1a1a] text-white hover:bg-[#2d2d2d] transition-colors text-sm border border-[#2d2d2d] font-medium">
              <Download size={14} /> Baixar
            </button>
            <button onClick={() => shareWhatsApp(currentPhoto)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#25D366]/15 text-[#25D366] hover:bg-[#25D366]/25 transition-colors text-sm border border-[#25D366]/30 font-medium">
              <MessageCircle size={14} /> WhatsApp
            </button>
            <button onClick={() => setLbOpen(false)}
              className="p-2 rounded-lg bg-[#1a1a1a] text-gray-400 hover:text-white hover:bg-[#2d2d2d] transition-colors border border-[#2d2d2d]">
              <X size={18} />
            </button>
          </div>

          {/* Palco coverflow */}
          <div
            className="flex-1 relative flex items-center justify-center"
            style={{ perspective: "1200px" }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            {photos.map((p, i) => {
              const rawOffset = i - lbIndex;
              // dragOffset em indices (0..1)
              const dragOffset = dragging.current ? -(rotation - startRotation.current) / 120 : 0;
              const offset = rawOffset + dragOffset;
              const absOffset = Math.abs(offset);
              if (absOffset > 2.5) return null;

              const translateX = offset * (typeof window !== "undefined" && window.innerWidth < 640 ? 160 : 280);
              const rotateY    = offset * -35;   // inclina até ±35°
              const scale      = Math.max(0.6, 1 - absOffset * 0.18);
              const opacity    = Math.max(0.15, 1 - absOffset * 0.45);
              const zIndex     = Math.round(10 - absOffset * 3);
              const isActive   = i === lbIndex && !dragging.current;

              return (
                <div
                  key={p.id}
                  onClick={() => { if (Math.abs(rawOffset) > 0) goTo(i); }}
                  style={{
                    position: "absolute",
                    transform: `translateX(${translateX}px) rotateY(${rotateY}deg) scale(${scale})`,
                    opacity,
                    zIndex,
                    transition: dragging.current ? "none" : "transform 0.4s cubic-bezier(0.25,1,0.5,1), opacity 0.3s ease",
                    cursor: rawOffset !== 0 ? "pointer" : "default",
                  }}
                >
                  {/* Sombra e bordas da foto ativa */}
                  <div style={{
                    borderRadius: "16px",
                    overflow: "hidden",
                    boxShadow: isActive
                      ? "0 30px 80px rgba(0,0,0,0.9), 0 0 40px rgba(200,169,81,0.2)"
                      : "0 10px 40px rgba(0,0,0,0.6)",
                    border: isActive ? "2px solid rgba(200,169,81,0.6)" : "2px solid rgba(255,255,255,0.06)",
                    position: "relative",
                  }}>
                    {isActive && <>
                      <div style={{ position:"absolute", top:8, left:8, width:18, height:18, borderTop:"2px solid #C8A951", borderLeft:"2px solid #C8A951", borderRadius:"3px 0 0 0", zIndex:2 }} />
                      <div style={{ position:"absolute", top:8, right:8, width:18, height:18, borderTop:"2px solid #C8A951", borderRight:"2px solid #C8A951", borderRadius:"0 3px 0 0", zIndex:2 }} />
                      <div style={{ position:"absolute", bottom:8, left:8, width:18, height:18, borderBottom:"2px solid #C8A951", borderLeft:"2px solid #C8A951", borderRadius:"0 0 0 3px", zIndex:2 }} />
                      <div style={{ position:"absolute", bottom:8, right:8, width:18, height:18, borderBottom:"2px solid #C8A951", borderRight:"2px solid #C8A951", borderRadius:"0 0 3px 0", zIndex:2 }} />
                    </>}
                    <img
                      src={p.url}
                      alt={p.caption ?? "Foto"}
                      draggable={false}
                      style={{
                        width:  "clamp(200px, 42vw, 520px)",
                        height: "clamp(140px, 30vw, 370px)",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  </div>
                </div>
              );
            })}

            {/* Setas */}
            {lbIndex > 0 && (
              <button
                className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/70 border border-[#C8A951]/30 text-white hover:bg-[#C8A951]/20 hover:border-[#C8A951] transition-all"
                onPointerDown={e => e.stopPropagation()}
                onClick={() => goTo(lbIndex - 1)}
              ><ChevronLeft size={24} /></button>
            )}
            {lbIndex < photos.length - 1 && (
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/70 border border-[#C8A951]/30 text-white hover:bg-[#C8A951]/20 hover:border-[#C8A951] transition-all"
                onPointerDown={e => e.stopPropagation()}
                onClick={() => goTo(lbIndex + 1)}
              ><ChevronRight size={24} /></button>
            )}

            <p className="absolute bottom-4 left-0 right-0 text-center text-xs text-gray-700 pointer-events-none select-none">← arraste para navegar →</p>
          </div>

          {/* Rodapé */}
          <div className="flex-shrink-0 px-6 py-3 border-t border-white/10 flex items-center justify-between gap-4 flex-wrap z-10">
            <div className="min-w-0">
              {currentPhoto.caption
                ? <p className="text-white font-semibold truncate">{currentPhoto.caption}</p>
                : <p className="text-gray-600 italic text-sm">Fiel Rio Pardo · {caravan.title}</p>}
            </div>
            <div className="hidden md:flex gap-1.5">
              {photos.slice(Math.max(0, lbIndex - 3), lbIndex + 4).map((p, i) => {
                const realIdx = Math.max(0, lbIndex - 3) + i;
                return (
                  <button key={p.id}
                    onPointerDown={e => e.stopPropagation()}
                    onClick={() => goTo(realIdx)}
                    className={["flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all",
                      realIdx === lbIndex ? "border-[#C8A951] scale-110 shadow-[0_0_12px_rgba(200,169,81,0.5)]" : "border-transparent opacity-40 hover:opacity-75"
                    ].join(" ")}>
                    <img src={p.url} alt="" className="w-full h-full object-cover" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}