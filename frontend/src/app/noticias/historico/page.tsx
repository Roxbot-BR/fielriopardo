'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import type { NewsItem } from '@/types';
import api from '@/lib/api';
import { ArrowLeft, Search, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';

const CATEGORY_LABELS: Record<string, string> = {
  news: '⚽ Notícias',
  match_preview: '📅 Pré-Jogo',
  retrospect: '📊 Retrospecto',
  trivia: '💡 Curiosidades',
  transfer: '🔄 Transferências',
};

const CATEGORY_COLORS: Record<string, string> = {
  news: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
  match_preview: 'text-[#C8A951] border-[#C8A951]/30 bg-[#C8A951]/10',
  retrospect: 'text-[#C8A951] border-[#C8A951]/30 bg-[#C8A951]/10',
  trivia: 'text-gray-300 border-gray-500/30 bg-gray-500/10',
  transfer: 'text-red-400 border-red-500/30 bg-red-500/10',
};

interface HistoryResponse {
  items: NewsItem[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

const LIMIT = 24;

const FILTERS = [
  { value: '', label: 'Todas' },
  { value: 'news', label: 'Notícias' },
  { value: 'match_preview', label: 'Pré-Jogo' },
  { value: 'retrospect', label: 'Retrospecto' },
  { value: 'transfer', label: 'Transferências' },
  { value: 'trivia', label: 'Curiosidades' },
];

export default function NoticiasHistoricoPage() {
  const [data, setData] = useState<HistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(LIMIT),
      });
      if (category) params.set('category', category);
      if (search) params.set('q', search);
      const { data: res } = await api.get<HistoryResponse>(`/news/history?${params}`);
      setData(res);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [page, category, search]);

  useEffect(() => { load(); }, [load]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const handleCategory = (cat: string) => {
    setPage(1);
    setCategory(cat);
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

  return (
    <>
      <Header />
      <PageWrapper glass>
        {/* Back + title */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/noticias" className="text-gray-400 hover:text-[#C8A951] transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-white">📰 Histórico de Notícias</h1>
            <p className="text-gray-400 text-sm mt-0.5">
              {data ? `${data.total.toLocaleString('pt-BR')} publicações arquivadas` : 'Carregando...'}
            </p>
          </div>
        </div>

        {/* Search + filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <form onSubmit={handleSearch} className="flex gap-2 flex-1">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Buscar notícias..."
                className="w-full pl-8 pr-4 py-2 rounded-lg bg-[#1a1a1a] border border-[#2d2d2d] text-white text-sm focus:border-[#C8A951] focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-[#C8A951] text-black text-sm font-bold rounded-lg hover:bg-[#b8953f] transition-colors"
            >
              Buscar
            </button>
            {search && (
              <button
                type="button"
                onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }}
                className="px-3 py-2 border border-[#2d2d2d] text-gray-400 text-sm rounded-lg hover:text-white transition-colors"
              >
                ✕
              </button>
            )}
          </form>
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => handleCategory(f.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                category === f.value
                  ? 'bg-[#C8A951] text-black border-[#C8A951]'
                  : 'bg-transparent text-gray-400 border-[#2d2d2d] hover:border-[#C8A951]/50 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : !data || data.items.length === 0 ? (
          <Card variant="default">
            <CardContent className="p-12 text-center">
              <p className="text-4xl mb-3">🔍</p>
              <p className="text-gray-400">Nenhuma notícia encontrada.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* News list */}
            <div className="flex flex-col gap-2">
              {data.items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 p-3 rounded-xl border border-[#2d2d2d] bg-[#0d0d0d] hover:border-[#C8A951]/30 hover:bg-[#1a1a1a] transition-all group"
                >
                  {/* Image thumbnail */}
                  <div className="w-20 h-16 rounded-lg overflow-hidden bg-[#1a1a1a] flex-shrink-0">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => { (e.target as HTMLImageElement).src = '/logo.jpeg'; }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <img src="/logo.jpeg" alt="Fiel" className="w-10 h-10 object-contain opacity-40" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[item.category] ?? 'text-gray-400 border-gray-500/30 bg-gray-500/10'}`}>
                        {CATEGORY_LABELS[item.category] ?? item.category}
                      </span>
                      <span className="text-xs text-gray-500">{formatDate(item.publishedAt)}</span>
                    </div>
                    <h3 className="text-white text-sm font-semibold leading-snug line-clamp-2 group-hover:text-[#C8A951] transition-colors">
                      {item.title}
                    </h3>
                    {item.summary && (
                      <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{item.summary}</p>
                    )}
                  </div>

                  {/* Source link */}
                  {item.sourceUrl && item.sourceUrl.startsWith("http") && item.sourceUrl.length > 30 && item.sourceUrl !== "https://www.meutimao.com.br/" && (
                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="self-center text-gray-600 hover:text-[#C8A951] transition-colors flex-shrink-0"
                      title="Ver fonte"
                    >
                      <ExternalLink size={14} />
                    </a>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination */}
            {data.pages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-8">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg border border-[#2d2d2d] text-gray-400 disabled:opacity-30 hover:border-[#C8A951] hover:text-[#C8A951] transition-colors disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} />
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(data.pages, 7) }, (_, i) => {
                    let p: number;
                    if (data.pages <= 7) {
                      p = i + 1;
                    } else if (page <= 4) {
                      p = i + 1;
                    } else if (page >= data.pages - 3) {
                      p = data.pages - 6 + i;
                    } else {
                      p = page - 3 + i;
                    }
                    return (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                          p === page
                            ? 'bg-[#C8A951] text-black'
                            : 'text-gray-400 hover:text-white border border-[#2d2d2d] hover:border-[#3d3d3d]'
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setPage(p => Math.min(data.pages, p + 1))}
                  disabled={page === data.pages}
                  className="p-2 rounded-lg border border-[#2d2d2d] text-gray-400 disabled:opacity-30 hover:border-[#C8A951] hover:text-[#C8A951] transition-colors disabled:cursor-not-allowed"
                >
                  <ChevronRight size={16} />
                </button>
                <span className="text-xs text-gray-500">
                  Página {page} de {data.pages}
                </span>
              </div>
            )}
          </>
        )}
      </PageWrapper>
      <Footer />
    </>
  );
}
