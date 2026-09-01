import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { NewsCard } from '@/components/NewsCard';
import { SocialCards } from '@/components/SocialCards';
import { ElencoSlider } from '@/components/ElencoSlider';
import { CaravanasPreview } from '@/components/CaravanasPreview';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { MatchCardLive } from '@/components/MatchCardLive';
import type { NewsItem, Match } from '@/types';

async function getNews(): Promise<NewsItem[]> {
  try {
    const res = await fetch(
      `${process.env.INTERNAL_API_URL || 'http://backend:3001'}/api/news?limit=6`,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return [];
    const ntext = await res.text();
    if (!ntext) return [];
    return JSON.parse(ntext);
  } catch {
    return [];
  }
}

async function getNextMatch(): Promise<Match | null> {
  try {
    const res = await fetch(
      `${process.env.INTERNAL_API_URL || 'http://backend:3001'}/api/matches/next`,
      { cache: 'no-store' }
    );
    if (!res.ok) return null;
    const text = await res.text();
    if (!text || text === 'null') return null;
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function getBolaoStats(): Promise<{ participants: number; currentGame: string } | null> {
  try {
    const res = await fetch(
      `${process.env.INTERNAL_API_URL || 'http://backend:3001'}/api/users/count`,
      { cache: 'no-store' }
    );
    if (!res.ok) return null;
    const text2 = await res.text();
    if (!text2) return null;
    try {
      const data = JSON.parse(text2);
      const participants = data?.total ?? 0;
      return { participants, currentGame: '' };
    } catch { return null; }
  } catch {
    return null;
  }
}

async function getDailyCuriosity(): Promise<{ fact: string } | null> {
  try {
    const res = await fetch(
      `${process.env.INTERNAL_API_URL || 'http://backend:3001'}/api/news/curiosidades`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return null;
    const ctext = await res.text();
    if (!ctext) return null;
    try {
      const cdata = JSON.parse(ctext);
      if (Array.isArray(cdata) && cdata.length > 0) {
        const item = cdata[0];
        const fact = item.content ?? item.title ?? '';
        return { fact };
      }
      return null;
    } catch { return null; }
  } catch {
    return null;
  }
}

async function getPlayers(): Promise<any[]> {
  try {
    const res = await fetch(
      `${process.env.INTERNAL_API_URL || 'http://backend:3001'}/api/players`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data.filter((p: any) => p.status === 'active') : [];
  } catch { return []; }
}

export default async function HomePage() {
  const [news, nextMatch, bolaoStats, curiosity, players] = await Promise.all([
    getNews(),
    getNextMatch(),
    getBolaoStats(),
    getDailyCuriosity(),
    getPlayers(),
  ]);

  return (
    <>
      <Header />
      <main>
        {/* HERO */}
        <section
          className="relative min-h-[70vh] flex items-center justify-center overflow-hidden"
          style={{
            background: 'transparent',
          }}
        >
          <div className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `url('/logo.jpeg')`,
              backgroundSize: '300px',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right center',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
          <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
            <div className="flex justify-center mb-6">
              <Image
                src="/logo.jpeg"
                alt="Fiel Rio Pardo"
                width={140}
                height={140}
                className="rounded-full ring-4 ring-[#C8A951] shadow-2xl shadow-[#C8A951]/30 object-cover"
                priority
              />
            </div>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white mb-4 leading-none tracking-tight">
              FIEL{' '}
              <span className="text-[#C8A951]">RIO PARDO</span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-300 mb-2 font-medium">
              Torcida Organizada do Corinthians
            </p>
            <p className="text-sm text-gray-500 mb-8">
              São José do Rio Pardo — SP 🖤🤍
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg">
                <Link href="/bolao">⚽ Entrar no Bolão</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/jogos">Ver Próximo Jogo</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Próximo Jogo / Jogo ao Vivo — client component with countdown + live clock */}
        <MatchCardLive initialMatch={nextMatch as any} />

        {/* Últimas Notícias */}
        <section className="py-12">
          <PageWrapper>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📰</span>
                <h2 className="text-2xl font-black text-white">Últimas Notícias</h2>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/noticias">Ver todas →</Link>
              </Button>
            </div>
            {news.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {news.map((item) => (
                  <NewsCard key={item.id} news={item} />
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                Nenhuma notícia disponível no momento.
              </p>
            )}
          </PageWrapper>
        </section>

        {/* Bolão em Destaque */}
        <section className="py-12 bg-[#C8A951]/90">
          <PageWrapper>
            <div className="text-center">
              <h2 className="text-3xl font-black text-black mb-2">🏆 BOLÃO FIEL RIO PARDO</h2>
              <p className="text-black/70 mb-6 text-lg">
                Acerte os placares e dispute prêmios com a galera!
              </p>
              {bolaoStats && (
                <div className="flex flex-wrap justify-center gap-8 mb-8">
                  <div className="text-center">
                    <p className="text-4xl font-black text-black">{bolaoStats.participants}</p>
                    <p className="text-black/70 text-sm">Participantes</p>
                  </div>
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" variant="secondary">
                  <Link href="/bolao">Participar do Bolão</Link>
                </Button>
                <Button asChild size="lg" variant="ghost">
                  <Link href="/bolao/ranking" className="text-black hover:text-black">Ver Ranking</Link>
                </Button>
              </div>
            </div>
          </PageWrapper>
        </section>

        {/* Elenco Slider */}
        {players.length > 0 && (
          <section className="py-12 border-y border-[#2d2d2d]">
            <PageWrapper>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">👕</span>
                  <h2 className="text-2xl font-black text-white">Elenco Masculino</h2>
                </div>
                <a href="/elenco" className="text-sm text-[#C8A951] hover:underline">Ver todos →</a>
              </div>
              <ElencoSlider players={players} />
            </PageWrapper>
          </section>
        )}

        {/* Redes Sociais */}
        <section className="py-12 border-y border-[#2d2d2d]">
          <PageWrapper>
            <CaravanasPreview />
          </PageWrapper>
        </section>

        <section className="py-12 bg-[#0d0d0d]/70 border-y border-[#2d2d2d]">
          <PageWrapper>
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">📱</span>
              <h2 className="text-2xl font-black text-white">Siga nas Redes Sociais</h2>
            </div>
            <SocialCards />
          </PageWrapper>
        </section>

        {/* Curiosidade do Dia */}
        {curiosity && (
          <section className="py-12">
            <PageWrapper>
              <Card variant="highlight" className="max-w-2xl mx-auto">
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-3">🤔</div>
                  <h3 className="text-[#C8A951] font-bold text-sm uppercase tracking-wider mb-3">
                    Curiosidade do Dia
                  </h3>
                  <p className="text-white text-base leading-relaxed">{curiosity.fact}</p>
                </CardContent>
              </Card>
            </PageWrapper>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
