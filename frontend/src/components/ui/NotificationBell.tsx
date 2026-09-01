'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { Bell, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

interface NotifItem {
  id: string;
  title: string;
  body: string;
  url: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return 'agora';
  if (diff < 3600) return `${Math.floor(diff / 60)} min atrás`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d atrás`;
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

const TYPE_ICON: Record<string, string> = {
  match_result: '⚽',
  bolao_open:   '🎯',
  birthday:     '🎂',
  reminder_2h:  '⏰',
  reminder_1h:  '⏰',
  reminder_30m: '⏰',
  reminder_5m:  '⏰',
  general:      '🔔',
};

export function NotificationBell() {
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotifItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [dropStyle, setDropStyle] = useState<React.CSSProperties>({});
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const fetchHistory = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const { data } = await api.get<{ items: NotifItem[]; unread: number }>('/notifications/history');
      setItems(data.items);
      setUnread(data.unread);
    } catch { /* silent */ }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchHistory();
    const id = setInterval(fetchHistory, 60_000);
    return () => clearInterval(id);
  }, [fetchHistory]);

  // Listen for service worker push events → instant refresh
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
    const handler = (event: MessageEvent) => {
      if (event.data?.type === 'NEW_NOTIFICATION') fetchHistory();
    };
    navigator.serviceWorker.addEventListener('message', handler);
    return () => navigator.serviceWorker.removeEventListener('message', handler);
  }, [fetchHistory]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropRef.current && !dropRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const toggleOpen = async () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const vw = window.innerWidth;
      const isMobile = vw < 768;
      if (isMobile) {
        setDropStyle({ position: 'fixed', top: rect.bottom + 8, left: 8, right: 8, width: 'auto', zIndex: 9999 });
      } else {
        const w = 340;
        const left = Math.max(8, rect.right - w);
        setDropStyle({ position: 'fixed', top: rect.bottom + 8, left, width: w, zIndex: 9999 });
      }
      if (unread > 0) {
        try { await api.post('/notifications/read-all'); setUnread(0); setItems(p => p.map(i => ({ ...i, isRead: true }))); } catch { /* */ }
      }
    }
    setOpen(v => !v);
  };

  if (!isAuthenticated) return null;

  const dropdown = open && mounted ? createPortal(
    <div ref={dropRef} style={dropStyle} className="max-h-[480px] bg-[#111] border border-[#2d2d2d] rounded-xl shadow-2xl flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2d2d2d] flex-shrink-0">
        <h3 className="text-sm font-bold text-white">Notificações</h3>
        <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-white"><X size={14} /></button>
      </div>
      <div className="overflow-y-auto flex-1">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
            <Bell size={28} className="text-gray-600 mb-2" />
            <p className="text-gray-500 text-sm">Nenhuma notificação ainda</p>
          </div>
        ) : items.map(item => (
          <Link key={item.id} href={item.url || '/'} onClick={() => setOpen(false)}
            className={cn('flex gap-3 px-4 py-3 hover:bg-[#1a1a1a] transition-colors border-b border-[#1a1a1a] last:border-b-0', !item.isRead && 'bg-[#C8A951]/5')}>
            <span className="text-lg flex-shrink-0 mt-0.5">{TYPE_ICON[item.type] ?? '🔔'}</span>
            <div className="flex-1 min-w-0">
              <p className={cn('text-sm font-semibold break-words', !item.isRead ? 'text-white' : 'text-gray-300')}>{item.title}</p>
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-3 break-words">{item.body}</p>
              <p className="text-[10px] text-gray-600 mt-1">{timeAgo(item.createdAt)}</p>
            </div>
            {!item.isRead && <span className="w-2 h-2 bg-[#C8A951] rounded-full flex-shrink-0 mt-2" />}
          </Link>
        ))}
      </div>
      {items.length > 0 && (
        <div className="px-4 py-2 border-t border-[#2d2d2d] flex-shrink-0">
          <p className="text-[10px] text-gray-600 text-center">Últimas {items.length} notificações</p>
        </div>
      )}
    </div>,
    document.body
  ) : null;

  return (
    <div className="relative">
      <button ref={btnRef} onClick={toggleOpen} title="Notificações"
        className={cn('relative flex items-center justify-center w-9 h-9 rounded-lg transition-colors',
          open ? 'bg-[#1a1a1a] text-[#C8A951]' : 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]')}>
        {/* Pulsing ring when unread */}
        {unread > 0 && !open && (
          <span className="absolute inset-0 rounded-lg bg-[#C8A951]/20 animate-ping-slow pointer-events-none" />
        )}
        <Bell
          size={18}
          className={unread > 0 && !open ? 'animate-bell-ring text-[#C8A951]' : ''}
        />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      {dropdown}
    </div>
  );
}
