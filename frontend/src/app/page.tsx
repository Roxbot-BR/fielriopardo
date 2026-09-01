'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { NewsCard } from '@/components/NewsCard';
import { SocialCards } from '@/components/SocialCards';
import { ElencoSlider } from '@/components/ElencoSlider';
import { CaravanasPreview } from '@/components/CaravanasPreview';
import { buttonVariants } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { MatchCardLive } from '@/components/MatchCardLive';
import type { NewsItem, Match } from '@/types';
import api from '@/lib/api';

export default function HomePage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [nextMatch, setNextMatch] = useState<Match | null>(null);
  const [bolaoStats, setBolaoStats] = useState<{ participants: number } | null>(null);
  const [curiosity, setCuriosity] = useState<{ fact: string } | null>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const [newsRes, matchRes, usersRes, curioRes, playersRes] = await Promise.allSettled([
          api.get('/news?limit=6'),
          api.get('/matches/next'),
          api.get('/users/count'),
          api.get('/news/curiosidades'),
          api.get('/players'),
        ]);

        if (!active) return;

        if (newsRes.status === 'fulfilled' && Array.isArray(newsRes.value.data)) {
          setNews(newsRes.value.data);
        }
        if (matchRes.status === 'fulfilled' && matchRes.value.data) {
          setNextMatch(matchRes.value.data);
        }
        if (usersRes.status === 'fulfilled' && usersRes.value.data) {
          setBolaoStats({ participants: usersRes.value.data.total ?? 0 });
        }
        if (curioRes.status === 'fulfilled' && Array.isArray(curioRes.value.data) && curioRes.value.data.length > 0) {
          const item = curioRes.value.data[0];
          setCuriosity({ fact: item.content ?? item.title ?? '' });
        }
        if (playersRes.status === 'fulfilled' && Array.isArray(playersRes.value.data)) {
          setPlayers(playersRes.value.data.filter((p: any) => p.status === 'active'));
        }
      } catch {
        /* silent */
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();
    return () => { active = false; };
  }, []);

  return (
    <>
      <Header />
      <main>
        {/* HERO */}
        <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: `url('/logo.jpeg')`,
              backgroundSize: '300px',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right center',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent pointer-events-none" />
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
              <Link href="/bolao" className={buttonVariants({ size: 'lg' })}>⚽ Entrar no Bolão</Link>
              <Link href="/jogos" className={buttonVariants({ size: 'lg', variant: 'outline' })}>Ver Próximo Jogo</Link>
            </div>
          </div>
        </section>

        {/* Próximo Jogo / Jogo ao Vivo */}
        <MatchCardLive initialMatch={nextMatch as any} />

        {/* Últimas Notícias */}
        <section className="py-12">
          <PageWrapper>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📰</span>
                <h2 className="text-2xl font-black text-white">Últimas Notícias</h2>
              </div>
              <Link href="/noticias" className={buttonVariants({ variant: 'outline', size: 'sm' })}>Ver todas →</Link>
            </div>
            {news.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {news.map((item) => (
                  <NewsCard key={item.id} news={item} />
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                {loading ? 'Carregando notícias...' : 'Nenhuma notícia disponível no momento.'}
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
                <Link href="/bolao" className={buttonVariants({ size: 'lg', variant: 'secondary' })}>Participar do Bolão</Link>
                <Link href="/bolao/ranking" className={buttonVariants({ size: 'lg', variant: 'ghost', className: 'text-black hover:text-black' })}>Ver Ranking</Link>
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
                <Link href="/elenco" className="text-sm text-[#C8A951] hover:underline">Ver todos →</Link>
              </div>
              <ElencoSlider players={players} />
            </PageWrapper>
          </section>
        )}

        {/* Caravanas */}
        <section className="py-12 border-y border-[#2d2d2d]">
          <PageWrapper>
            <CaravanasPreview />
          </PageWrapper>
        </section>

        {/* Redes Sociais */}
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
