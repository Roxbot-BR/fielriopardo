'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { Spinner } from '@/components/ui/Spinner';
import api from '@/lib/api';
import type { NewsItem } from '@/types';
import { ArrowLeft, ExternalLink, Calendar } from 'lucide-react';

const CATEGORY_LABEL: Record<string, string> = {
  news: '⚽ Notícias',
  match_preview: '📅 Próximos Jogos',
  retrospect: '📊 Retrospecto',
  transfer: '🔄 Transferências',
  trivia: '💡 Curiosidades',
};

function formatDate(dateStr: string) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
}

export default function NoticiaDetailClient() {
  const params = useParams();
  const id = params?.id as string;
  const [news, setNews] = useState<NewsItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.get<NewsItem>(`/news/${id}`)
      .then(({ data }) => { setNews(data); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <>
      <Header />
      <PageWrapper>
        <div className="max-w-3xl mx-auto px-4 py-8">
          <Link href="/noticias" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6 transition-colors">
            <ArrowLeft size={16} /> Voltar para Notícias
          </Link>

          {loading && (
            <div className="flex justify-center py-20"><Spinner /></div>
          )}

          {notFound && !loading && (
            <div className="text-center py-20 text-gray-400">
              <p className="text-2xl mb-2">😕</p>
              <p>Notícia não encontrada.</p>
            </div>
          )}

          {news && !loading && (
            <article className="space-y-6">
              {/* Category badge */}
              <div className="flex items-center gap-3">
                <span className="text-xs bg-[#1a1a2e] border border-white/10 text-gray-300 px-3 py-1 rounded-full">
                  {CATEGORY_LABEL[news.category] ?? news.category}
                </span>
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <Calendar size={12} />
                  {formatDate(news.publishedAt)}
                </span>
              </div>

              {/* Title */}
              <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight">
                {news.title}
              </h1>

              {/* Image */}
              {news.imageUrl && (
                <div className="w-full rounded-xl overflow-hidden aspect-video bg-white/5">
                  <img
                    src={news.imageUrl}
                    alt={news.title}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
              )}

              {/* Summary */}
              {news.summary && (
                <p className="text-lg text-gray-300 leading-relaxed border-l-4 border-[#00b4d8] pl-4">
                  {news.summary}
                </p>
              )}

              {/* Content */}
              {news.content && news.content !== news.summary && (
                <div className="prose prose-invert max-w-none text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {news.content}
                </div>
              )}

              {/* External link */}
              {news.sourceUrl && !news.sourceUrl.startsWith('match-preview::') && !news.sourceUrl.startsWith('match-retrospect::') && news.sourceUrl !== 'https://www.meutimao.com.br/' && news.sourceUrl !== 'https://www.meutimao.com.br' && (
                <a
                  href={news.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-[#00b4d8] hover:underline"
                >
                  <ExternalLink size={14} /> Ver fonte original
                </a>
              )}
            </article>
          )}
        </div>
      </PageWrapper>
      <Footer />
    </>
  );
}
