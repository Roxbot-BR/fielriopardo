"use client";
import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import Link from "next/link";
import { GalleryPhoto } from "@/types";
import { API_URL } from "@/lib/api";

const CATEGORIES = ["Todos", "caravana", "festa", "jogo", "torcida", "geral"];

export default function GaleriaPage() {
  const [photos, setPhotos]       = useState<GalleryPhoto[]>([]);
  const [category, setCategory]   = useState("Todos");
  const [lightbox, setLightbox]   = useState<GalleryPhoto | null>(null);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    const cat = category === "Todos" ? "" : category;
    fetch(`${API_URL}/caravans/gallery${cat ? `?category=${cat}` : ""}`)
      .then(r => r.json())
      .then(d => { setPhotos(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [category]);

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <section className="bg-gradient-to-b from-gray-900 to-black py-14 text-center border-b border-gray-800">
        <div className="text-5xl mb-3">📸</div>
        <h1 className="text-4xl font-bold mb-2">Galeria</h1>
        <p className="text-gray-400">Momentos inesquecíveis da Fiel Rio Pardo</p>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-10">
        <Link href="/caravanas" className="text-gray-400 hover:text-white text-sm mb-6 block">← Voltar</Link>

        {/* Category filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          {CATEGORIES.map(c => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors capitalize ${
                category === c ? "bg-white text-black" : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center text-gray-400 py-20 animate-pulse">Carregando fotos...</div>
        ) : photos.length === 0 ? (
          <div className="text-center text-gray-400 py-20">Nenhuma foto nesta categoria.</div>
        ) : (
          <div className="columns-2 md:columns-3 lg:columns-4 gap-3 space-y-3">
            {photos.map(p => (
              <button
                key={p.id}
                onClick={() => setLightbox(p)}
                className="break-inside-avoid w-full overflow-hidden rounded-xl border border-gray-800 hover:border-gray-600 transition group block"
              >
                <img
                  src={p.url}
                  alt={p.title ?? "Foto"}
                  className="w-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {p.title && (
                  <div className="bg-gray-900 px-3 py-2 text-left">
                    <p className="text-white text-sm font-medium truncate">{p.title}</p>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <div className="max-w-4xl w-full" onClick={e => e.stopPropagation()}>
            <img src={lightbox.url} alt={lightbox.title ?? "Foto"} className="w-full max-h-[80vh] object-contain rounded-xl" />
            {(lightbox.title || lightbox.description) && (
              <div className="mt-3 text-center">
                {lightbox.title && <p className="text-white font-semibold">{lightbox.title}</p>}
                {lightbox.description && <p className="text-gray-400 text-sm mt-1">{lightbox.description}</p>}
              </div>
            )}
          </div>
          <button className="absolute top-4 right-4 text-white text-4xl font-bold" onClick={() => setLightbox(null)}>×</button>
        </div>
      )}
    </div>
  );
}
