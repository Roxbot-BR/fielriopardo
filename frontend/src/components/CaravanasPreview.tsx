"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Caravan, GalleryPhoto } from "@/types";
import { API_URL } from "@/lib/api";

export function CaravanasPreview() {
  const [caravans, setCaravans] = useState<Caravan[]>([]);
  const [photos, setPhotos]     = useState<GalleryPhoto[]>([]);
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/caravans?status=open`)
      .then(r => r.json()).then(d => setCaravans(Array.isArray(d) ? d.slice(0,3) : [])).catch(() => null);
    fetch(`${API_URL}/caravans/gallery?featured=true`)
      .then(r => r.json()).then(d => setPhotos(Array.isArray(d) ? d.slice(0,6) : [])).catch(() => null);
  }, []);

  if (caravans.length === 0 && photos.length === 0) return null;

  return (
    <div className="space-y-10">
      {/* Próximas Caravanas */}
      {caravans.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🚌</span>
              <h2 className="text-2xl font-black text-white">Próximas Caravanas</h2>
            </div>
            <Link href="/caravanas" className="text-gray-400 hover:text-white text-sm transition">Ver todas →</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {caravans.map(c => {
              const date   = new Date(c.departureDatetime);
              const spots  = c.capacity - c.spotsTaken;
              return (
                <Link key={c.id} href={`/caravanas/${c.id}`}>
                  <div className="bg-[#111] border border-[#2d2d2d] rounded-xl overflow-hidden hover:border-[#444] transition group">
                    <div className="relative h-36 bg-[#1a1a1a]">
                      {c.coverImage
                        ? <img src={c.coverImage} alt={c.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        : <div className="w-full h-full flex items-center justify-center text-5xl">🚌</div>
                      }
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    </div>
                    <div className="p-4">
                      <h3 className="text-white font-bold text-sm line-clamp-2 mb-2">{c.title}</h3>
                      <div className="space-y-1 text-xs text-gray-400">
                        <p>📅 {date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })} às {date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>
                        <p>📍 {c.departureCity}</p>
                        {c.price > 0 && <p>💰 R$ {Number(c.price).toFixed(2)}</p>}
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <span className={`text-xs font-semibold ${spots > 0 ? "text-[#C8A951]" : "text-yellow-400"}`}>
                          {spots > 0 ? `✓ ${spots} vagas` : "Esgotada"}
                        </span>
                        <span className="text-gray-500 text-xs">Detalhes →</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Fotos em Destaque */}
      {photos.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📸</span>
              <h2 className="text-2xl font-black text-white">Fotos em Destaque</h2>
            </div>
            <Link href="/caravanas/galeria" className="text-gray-400 hover:text-white text-sm transition">Ver galeria →</Link>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {photos.map(p => (
              <button
                key={p.id}
                onClick={() => setLightbox(p.url)}
                className="aspect-square rounded-xl overflow-hidden border border-[#2d2d2d] hover:border-[#555] transition group"
              >
                <img
                  src={p.url}
                  alt={p.title ?? "Foto"}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <img src={lightbox} alt="Foto ampliada" className="max-w-full max-h-[90vh] rounded-xl shadow-2xl" />
          <button className="absolute top-4 right-4 text-white text-4xl font-bold hover:text-gray-300" onClick={() => setLightbox(null)}>×</button>
        </div>
      )}
    </div>
  );
}
