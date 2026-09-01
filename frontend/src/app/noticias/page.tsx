'use client';

import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { NewsCard } from '@/components/NewsCard';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Card, CardContent } from '@/components/ui/Card';
import type { NewsItem } from '@/types';
import api from '@/lib/api';
import { RefreshCw, History } from 'lucide-react';

interface Curiosidade {
  title: string;
  content: string;
  emoji?: string;
}

// DB enum values → label
const TABS = [
  { value: 'all',           label: '🗞️ Todas'          },
  { value: 'news',          label: '⚽ Notícias'        },
  { value: 'match_preview', label: '📅 Próximos Jogos'  },
  { value: 'retrospect',    label: '📊 Retrospecto'     },
  { value: 'transfer',      label: '🔄 Transferências'  },
  { value: 'oficial',        label: '🏟️ Oficial'          },
  { value: 'trivia',        label: '💡 Curiosidades'    },
];

const PAGE_SIZE = 12;

function CuriosidadesSection() {
  const [items, setItems] = useState<Curiosidade[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get<Curiosidade[]>('/news/curiosidades');
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <div className="flex justify-center py-8"><Spinner size="sm" /></div>;

  if (items.length === 0) return (
    <div className="text-center py-12 text-gray-500">
      <p className="text-3xl mb-3">💡</p>
      <p>Curiosidades sendo geradas pelos agentes de IA...</p>
      <button onClick={load} className="text-[#C8A951] text-sm mt-2 hover:underline flex items-center gap-1 mx-auto">
        <RefreshCw size={12} /> Tentar novamente
      </button>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((c, i) => (
        <Card key={i} variant="default" className="border-[#C8A951]/20 hover:border-[#C8A951]/40 transition-colors">
          <CardContent className="p-5">
            <div className="text-3xl mb-3">{c.emoji ?? '💡'}</div>
            <h3 className="text-white font-bold text-sm mb-2">{c.title}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">{c.content}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function NoticiasPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);

  const fetchNews = async (tab: string, pg: number, reset = false) => {
    setLoading(true);
    try {
      let data: NewsItem[];
      if (tab === 'all') {
        const res = await api.get<NewsItem[]>('/news', { params: { limit: PAGE_SIZE, page: pg } });
        data = res.data;
      } else {
        // Use category route — backend: GET /news/category/:cat
        const res = await api.get<NewsItem[]>(`/news/category/${tab}`, { params: { limit: PAGE_SIZE, page: pg } });
        data = res.data;
      }
      if (reset) setNews(data);
      else setNews((prev) => [...prev, ...data]);
      setHasMore(data.length === PAGE_SIZE);
    } catch {
      if (reset) setNews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    if (activeTab !== 'trivia') fetchNews(activeTab, 1, true);
    else setLoading(false);
  }, [activeTab]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchNews(activeTab, next);
  };

  return (
    <>
      <Header />
      <PageWrapper glass>
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white mb-2">📰 Notícias & Curiosidades</h1>
          <p className="text-gray-400">Fique por dentro de tudo sobre o Corinthians — atualizado pelos agentes de IA</p>
        </div>
        <Link href="/noticias/historico" className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-[#C8A951] transition-colors">
          <History size={14} />
          Ver histórico completo
        </Link>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-[#2d2d2d] mb-8 overflow-x-auto pb-1">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors rounded-t
                ${activeTab === tab.value
                  ? 'text-[#C8A951] border-b-2 border-[#C8A951]'
                  : 'text-gray-400 hover:text-white'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Curiosidades */}
        {activeTab === 'trivia' && <CuriosidadesSection />}

        {/* News grid */}
        {activeTab !== 'trivia' && (
          <>
            {loading && page === 1 ? (
              <div className="flex justify-center py-16"><Spinner size="lg" /></div>
            ) : news.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-3xl mb-3">📭</p>
                <p className="text-gray-500">Nenhuma notícia encontrada nesta categoria.</p>
                <p className="text-gray-600 text-sm mt-1">Os agentes buscam novidades a cada 30 minutos.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {news.map((item) => <NewsCard key={item.id} news={item} />)}
                </div>
                {hasMore && (
                  <div className="mt-8 text-center">
                    <Button variant="outline" onClick={loadMore} disabled={loading}>
                      {loading ? 'Carregando...' : 'Carregar mais'}
                    </Button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </PageWrapper>
      <Footer />
    </>
  );
}
