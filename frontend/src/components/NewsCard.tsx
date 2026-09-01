'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import type { NewsItem } from '@/types';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';

interface NewsCardProps {
  news: NewsItem;
}

const categoryLabel: Record<string, string> = {
  news: 'Notícias',
  match_preview: 'Próximos Jogos',
  retrospect: 'Retrospecto',
  trivia: 'Curiosidades',
  transfer: 'Transferências',
  NOTICIAS: 'Notícias',
  PROXIMOS_JOGOS: 'Próximos Jogos',
  RETROSPECTO: 'Retrospecto',
  CURIOSIDADES: 'Curiosidades',
};

const categoryVariant: Record<string, 'gold' | 'red' | 'blue' | 'gray'> = {
  news: 'blue',
  match_preview: 'gold',
  retrospect: 'gold',
  trivia: 'gray',
  transfer: 'red',
};

// URL real = tem path específico (não é só homepage)
function isRealArticleUrl(url?: string | null): boolean {
  try { return new URL(url as string).pathname.length > 1; } catch { return false; }
}

function ShareButtons({ news }: { news: NewsItem }) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'shared'>('idle');
  const [showFallback, setShowFallback] = useState(false);

  const shareUrl = isRealArticleUrl(news.sourceUrl)
    ? news.sourceUrl!
    : `https://fielriopardo.com.br/noticias/${news.id}`;

  const shareTitle = `🦅 ${news.title}`;
  const shareText = `${news.title} — Fiel Rio Pardo`;

  const handleShare = async () => {
    if (typeof navigator === 'undefined' || !navigator.share) {
      setShowFallback(prev => !prev);
      return;
    }
    // Tenta compartilhar com imagem (Web Share API Level 2)
    if (news.imageUrl && navigator.canShare) {
      try {
        const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(news.imageUrl)}`;
        const res = await fetch(proxyUrl);
        if (res.ok) {
          const blob = await res.blob();
          const ext = blob.type.includes('png') ? 'png' : 'jpg';
          const file = new File([blob], `noticia.${ext}`, { type: blob.type });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], title: shareTitle, text: shareText, url: shareUrl });
            setStatus('shared');
            setTimeout(() => setStatus('idle'), 2000);
            return;
          }
        }
      } catch (e) {
        if ((e as Error).name === 'AbortError') return;
        // imagem falhou — tenta sem imagem
      }
    }
    // Compartilha só URL (WhatsApp/iMessage mostram preview via OG tags)
    try {
      await navigator.share({ title: shareTitle, text: shareText, url: shareUrl });
      setStatus('shared');
      setTimeout(() => setStatus('idle'), 2000);
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setShowFallback(prev => !prev);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setStatus('copied');
      setTimeout(() => { setStatus('idle'); setShowFallback(false); }, 2000);
    } catch { /* ignore */ }
  };

  const urlEnc = encodeURIComponent(shareUrl);
  const textEnc = encodeURIComponent(shareTitle);
  const whatsapp = `https://wa.me/?text=${textEnc}%20${urlEnc}`;
  const facebook = `https://www.facebook.com/sharer/sharer.php?u=${urlEnc}`;
  const twitter = `https://twitter.com/intent/tweet?text=${textEnc}&url=${urlEnc}`;

  return (
    <div className="mt-3 pt-3 border-t border-[#2d2d2d]">
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">Compartilhar:</span>
        {/* Botão principal — Web Share API no mobile, toggle no desktop */}
        <button
          onClick={handleShare}
          title="Compartilhar"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#C8A951]/10 hover:bg-[#C8A951]/20 text-[#C8A951] transition-colors border border-[#C8A951]/30"
        >
          {status === 'shared' ? (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Compartilhado!
            </>
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
              Compartilhar
            </>
          )}
        </button>
      </div>

      {/* Fallback para desktop: botões sociais */}
      {showFallback && (
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <a href={whatsapp} target="_blank" rel="noopener noreferrer" title="WhatsApp"
            className="w-7 h-7 rounded-full flex items-center justify-center bg-[#25D366]/10 hover:bg-[#25D366]/25 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#25D366">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </a>
          <a href={facebook} target="_blank" rel="noopener noreferrer" title="Facebook"
            className="w-7 h-7 rounded-full flex items-center justify-center bg-[#1877F2]/10 hover:bg-[#1877F2]/25 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#1877F2">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </a>
          <a href={twitter} target="_blank" rel="noopener noreferrer" title="X (Twitter)"
            className="w-7 h-7 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/15 transition-colors">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="white">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </a>
          <button onClick={copyLink} title="Copiar link"
            className="w-7 h-7 rounded-full flex items-center justify-center bg-gray-700/40 hover:bg-gray-700/70 transition-colors">
            {status === 'copied' ? (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#C8A951" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            ) : (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
              </svg>
            )}
          </button>
          {status === 'copied' && <span className="text-xs text-[#C8A951]">Link copiado!</span>}
        </div>
      )}
    </div>
  );
}

export function NewsCard({ news }: NewsCardProps) {
  const hasImage = !!(news.imageUrl);
  
  return (
    <Card
      variant="default"
      className="group overflow-hidden hover:border-[#C8A951] hover:shadow-[0_0_20px_rgba(200,169,81,0.15)] transition-all duration-300 flex flex-col"
    >
      {/* Imagem */}
      <div className="relative h-44 overflow-hidden bg-[#1a1a1a] flex-shrink-0">
        {hasImage ? (
          <Image
            src={news.imageUrl!}
            alt={news.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            unoptimized
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          /* Placeholder temático */
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#111] to-[#2d2d2d]">
            <img src="/logo.jpeg" alt="Fiel Rio Pardo" className="w-24 h-24 object-contain opacity-60" />
          </div>
        )}
        {/* Categoria badge sobre a imagem */}
        <div className="absolute top-2 left-2">
          <Badge variant={categoryVariant[news.category] ?? 'gray'}>
            {categoryLabel[news.category] ?? news.category}
          </Badge>
        </div>
      </div>

      <CardContent className="p-4 flex flex-col flex-1">
        <div className="flex items-center justify-end mb-2">
          <span className="text-xs text-gray-500">{formatDate(news.publishedAt)}</span>
        </div>
        <h3 className="font-bold text-white text-sm leading-snug mb-2 line-clamp-2 group-hover:text-[#C8A951] transition-colors flex-1">
          {news.title}
        </h3>
        <p className="text-xs text-gray-400 leading-relaxed line-clamp-3 mb-1">
          {news.summary}
        </p>
        {(() => {
          const href = isRealArticleUrl(news.sourceUrl) ? news.sourceUrl! : `/noticias/${news.id}`;
          const ext = isRealArticleUrl(news.sourceUrl);
          return (
            <a href={href} target={ext ? "_blank" : "_self"}
              rel={ext ? "noopener noreferrer" : undefined}
              className="mt-1 inline-block text-xs text-[#C8A951] hover:underline">
              Ler mais &rarr;
            </a>
          );
        })()}
        <ShareButtons news={news} />
      </CardContent>
    </Card>
  );
}
