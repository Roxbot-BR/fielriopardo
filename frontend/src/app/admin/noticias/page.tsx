'use client';

import React, { useEffect, useState } from 'react';
import { Trash2, CheckCircle, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import type { NewsItem } from '@/types';
import api from '@/lib/api';
import toast from 'react-hot-toast';

const CATEGORY_LABELS: Record<string, string> = {
  news: 'Notícia',
  match_preview: 'Pré-Jogo',
  match_result: 'Resultado',
  transfer: 'Transferência',
  curiosity: 'Curiosidade',
  NOTICIAS: 'Notícias',
  PROXIMOS_JOGOS: 'Próximos Jogos',
  RETROSPECTO: 'Retrospecto',
  CURIOSIDADES: 'Curiosidades',
};

export default function AdminNoticiasPage() {
  const [news, setNews] = useState<(NewsItem & { isApproved?: boolean })[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all');

  const load = async () => {
    setLoading(true);
    try {
      const pending = filter === 'pending' ? '?pending=true' : '';
      const { data } = await api.get<NewsItem[]>(`/admin/news${pending}`);
      setNews(data);
    } catch {
      toast.error('Erro ao carregar notícias');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filter]);

  const approve = async (id: string) => {
    try {
      await api.patch(`/admin/news/${id}/approve`);
      toast.success('Notícia aprovada! ✅');
      load();
    } catch {
      toast.error('Erro ao aprovar.');
    }
  };

  const remove = async (id: string, title: string) => {
    if (!confirm(`Excluir "${title.slice(0, 60)}..."?`)) return;
    try {
      await api.delete(`/admin/news/${id}`);
      toast.success('Notícia excluída.');
      setNews(prev => prev.filter(n => n.id !== id));
    } catch {
      toast.error('Erro ao excluir.');
    }
  };

  const filteredNews = filter === 'approved'
    ? news.filter((n: any) => n.isApproved)
    : news;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-white">Gerenciar Notícias</h1>
        <span className="text-gray-400 text-sm">{filteredNews.length} notícia(s)</span>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {([['all', 'Todas'], ['pending', 'Pendentes'], ['approved', 'Aprovadas']] as const).map(([val, label]) => (
          <button
            key={val}
            onClick={() => setFilter(val)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === val
                ? 'bg-[#C8A951] text-black'
                : 'bg-[#1a1a1a] text-gray-400 hover:text-white border border-[#2d2d2d]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : filteredNews.length === 0 ? (
        <p className="text-center text-gray-500 py-16">
          {filter === 'pending' ? 'Nenhuma notícia pendente de aprovação.' : 'Nenhuma notícia encontrada.'}
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredNews.map((item) => (
            <div key={item.id} className="rounded-xl border border-[#2d2d2d] bg-[#1a1a1a] p-4 hover:border-[#3d3d3d] transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Badge variant="gray">{CATEGORY_LABELS[item.category] ?? item.category}</Badge>
                    {item.isApproved
                      ? <Badge variant="gold">✓ Aprovada</Badge>
                      : <Badge variant="red">Pendente</Badge>
                    }
                    {item.publishedAt && (
                      <span className="text-xs text-gray-500">
                        {new Date(item.publishedAt).toLocaleDateString('pt-BR', {
                          day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-white mb-1 line-clamp-2">{item.title}</h3>
                  {item.summary && (
                    <p className="text-sm text-gray-400 line-clamp-2">{item.summary}</p>
                  )}
                  {item.sourceUrl && item.sourceUrl.startsWith('http') && (
                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#C8A951] hover:underline flex items-center gap-1 mt-1 w-fit"
                    >
                      <ExternalLink size={10} /> Ver fonte
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {!item.isApproved && (
                    <button
                      onClick={() => approve(item.id)}
                      title="Aprovar"
                      className="p-2 text-[#C8A951] hover:bg-[#C8A951]/10 rounded-lg transition-colors"
                    >
                      <CheckCircle size={18} />
                    </button>
                  )}
                  <button
                    onClick={() => remove(item.id, item.title)}
                    title="Excluir"
                    className="p-2 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
