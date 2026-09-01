"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Caravan, GalleryPhoto } from "@/types";
import { API_URL } from "@/lib/api";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const STATUS_LABEL: Record<string, string> = {
  open: "Vagas disponíveis",
  full: "Esgotada",
  cancelled: "Cancelada",
  completed: "Realizada",
};
const STATUS_COLOR: Record<string, string> = {
  open: "bg-[#C8A951]",
  full: "bg-yellow-600",
  cancelled: "bg-red-700",
  completed: "bg-gray-600",
};

export default function CaravanasPage() {
  const [caravans, setCaravans]   = useState<Caravan[]>([]);
  const [gallery, setGallery]     = useState<GalleryPhoto[]>([]);
  const [loading, setLoading]     = useState(true);
  const [lightbox, setLightbox]   = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/caravans`).then(r => r.json()),
      fetch(`${API_URL}/caravans/gallery?featured=true`).then(r => r.json()),
    ]).then(([c, g]) => {
      setCaravans(Array.isArray(c) ? c : []);
      setGallery(Array.isArray(g) ? g : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const upcoming = caravans.filter(c => c.status === "open" || c.status === "full");
  const past     = caravans.filter(c => c.status === "completed");

  if (loading) return (
    <>
      <Header />
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="text-white text-xl animate-pulse">Carregando caravanas...</div>
      </div>
      <Footer />
    </>
  );

  return (
    <>
      <Header />
      <div className="min-h-screen bg-transparent text-white">
      <section className="bg-gradient-to-b from-black/60 to-black/40 py-16 text-center border-b border-gray-800">
        <div className="mb-3"><Image src="/logo.jpeg" alt="Fiel Rio Pardo" width={80} height={80} className="rounded-full border-2 border-[#C8A951] mx-auto" unoptimized /></div>
        <h1 className="text-4xl font-bold text-white mb-2">Caravanas</h1>
        <p className="text-gray-400 text-lg">Fiel Rio Pardo — juntos em cada batalha</p>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <span>🗓️</span> Próximas Caravanas
          </h2>
          {upcoming.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center text-gray-400">
              Nenhuma caravana agendada no momento. Fique ligado!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcoming.map(c => (
                <CaravanCard key={c.id} caravan={c} />
              ))}
            </div>
          )}
        </section>

        {gallery.length > 0 && (
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <span>📸</span> Galeria de Destaque
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {gallery.map(p => (
                <button
                  key={p.id}
                  onClick={() => setLightbox(p.url)}
                  className="relative aspect-square overflow-hidden rounded-xl group cursor-pointer border border-gray-800 hover:border-gray-600 transition-all"
                >
                  <img
                    src={p.url}
                    alt={p.title ?? "Foto caravana"}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  {p.title && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                      <span className="text-white text-sm font-medium">{p.title}</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
            <div className="mt-4 text-center">
              <Link href="/caravanas/galeria" className="text-gray-400 hover:text-white text-sm underline">
                Ver galeria completa →
              </Link>
            </div>
          </section>
        )}

        {past.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <span>🏆</span> Caravanas Realizadas
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {past.map(c => (
                <CaravanCard key={c.id} caravan={c} />
              ))}
            </div>
          </section>
        )}
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <img src={lightbox} alt="Foto ampliada" className="max-w-full max-h-full rounded-xl shadow-2xl" />
          <button
            className="absolute top-4 right-4 text-white text-3xl font-bold hover:text-gray-300"
            onClick={() => setLightbox(null)}
          >×</button>
        </div>
      )}
      <Footer />
    </div>
    </>
  );
}

function CaravanCard({ caravan: c }: { caravan: Caravan }) {
  const router = useRouter();
  const date = new Date(c.departureDatetime);
  const spots = c.capacity - c.spotsTaken;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-gray-600 transition-all hover:shadow-lg hover:shadow-black/50 group">
      <div
        className="cursor-pointer"
        onClick={() => router.push(`/caravanas/${c.id}`)}
      >
        <div className="relative h-44 bg-gray-800">
          {c.coverImage ? (
            <img src={c.coverImage} alt={c.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="w-full h-full flex items-center justify-center"><Image src="/logo.jpeg" alt="Fiel Rio Pardo" width={64} height={64} className="rounded-full opacity-50" unoptimized /></div>
          )}
          <span className={`absolute top-3 right-3 ${STATUS_COLOR[c.status]} text-white text-xs font-bold px-3 py-1 rounded-full`}>
            {STATUS_LABEL[c.status]}
          </span>
        </div>

        <div className="p-5 pb-3">
          <h3 className="text-white font-bold text-lg mb-1 line-clamp-2">{c.title}</h3>

          {c.match && (
            <p className="text-gray-400 text-sm mb-2">
              ⚽ {c.match.homeTeam} × {c.match.awayTeam}
            </p>
          )}

          <div className="space-y-1 text-sm text-gray-400 mb-3">
            <p>📅 {date.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</p>
            <p>🕒 {date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>
            <p>📍 {c.departureCity}</p>
            {c.price > 0 && <p>💰 R$ {Number(c.price).toFixed(2)}</p>}
          </div>
        </div>
      </div>

      <div className="px-5 pb-5 flex items-center justify-between gap-3 flex-wrap">
        {c.contactWhatsapp && (
          <a
            href={((() => {
              const num = c.contactWhatsapp!.replace(/\D/g, '');
              const dt  = new Date(c.departureDatetime);
              const dtStr = dt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
              const hrStr = dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
              const E = String.fromCodePoint;
              const msg = encodeURIComponent(
                'Olá! Vim pelo site da Fiel Rio Pardo e tenho interesse na caravana:\n\n' +
                E(0x1F68C) + ' *' + c.title + '*\n' +
                E(0x1F4C5) + ' Data: ' + dtStr + '\n' +
                E(0x1F552) + ' Saída: ' + hrStr + '\n' +
                E(0x1F4CD) + ' Local: ' + c.departureCity + (c.departurePoint ? ' — ' + c.departurePoint : '') + '\n' +
                (c.price > 0 ? E(0x1F4B0) + ' Valor: R$ ' + Number(c.price).toFixed(2) + '\n' : '') +
                '\nPor favor, me informe mais detalhes e disponibilidade. Obrigado! ' + E(0x1F985)
              );
              return `https://wa.me/55${num}?text=${msg}`;
            })()
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-[#C8A951] hover:bg-[#a08535] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            onClick={e => e.stopPropagation()}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.105.544 4.082 1.499 5.799L0 24l6.335-1.499A11.955 11.955 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.886 0-3.65-.494-5.176-1.357l-.371-.22-3.763.89.908-3.659-.241-.379A9.946 9.946 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
            </svg>
            WhatsApp
          </a>
        )}
        <div className="flex items-center justify-between flex-1 pt-2 border-t border-gray-800 mt-0">
          <span className="text-sm text-gray-400">
            {c.status === "open" && spots > 0
              ? `${spots} vaga${spots !== 1 ? "s" : ""} disponível`
              : c.status === "full" ? "Sem vagas" : ""}
          </span>
          <Link
            href={`/caravanas/${c.id}`}
            className="text-gray-400 hover:text-white text-sm transition-colors"
            onClick={e => e.stopPropagation()}
          >
            Ver detalhes →
          </Link>
        </div>
      </div>
    </div>
  );
}
