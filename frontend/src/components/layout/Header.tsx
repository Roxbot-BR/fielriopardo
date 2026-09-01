'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronDown, LogOut, User, Trophy, Settings, LayoutDashboard, Share2 } from 'lucide-react';

// WhatsApp SVG icon (not in lucide-react)
function WhatsAppIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
    </svg>
  );
}
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar } from '@/components/ui/Avatar';
import { NotificationBell } from '@/components/ui/NotificationBell';
import { Button, buttonVariants } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/', label: 'Início' },
  { href: '/noticias', label: 'Notícias' },
  { href: '/jogos', label: 'Jogos' },
  { href: '/caravanas', label: 'Caravanas' },
  { href: '/elenco', label: 'Elenco' },
  { href: '/uniformes', label: 'Uniformes' },
  { href: '/sobre', label: 'Sobre' },
  { href: '/bolao', label: 'Bolão' },
  { href: '/bolao/ranking', label: '🏆 Ranking' },
];

const APP_SHARE_TEXT =
  '🖤🤍 Conheça o App da *Fiel Rio Pardo*!\n' +
  'Bolão de palpites, jogos, notícias e muito mais.\n' +
  '📲 Abra o link no Chrome e instale na tela inicial:\n' +
  '👉 https://fielriopardo.com.br';

const WHATSAPP_SHARE_URL =
  'https://wa.me/?text=' +
  encodeURIComponent(APP_SHARE_TEXT);

export function Header() {
  const pathname = usePathname() || '';
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  // Detect navigator.share support only after mount, never during render/SSR,
  // to avoid hydration mismatches (React error #418).
  useEffect(() => {
    setCanNativeShare(typeof navigator !== 'undefined' && !!navigator.share);
  }, []);

  const handleShareApp = () => {
    if (canNativeShare && navigator.share) {
      navigator.share({
        title: 'App Fiel Rio Pardo',
        text: '🖤🤍 Conheça o App da Fiel Rio Pardo! Bolão de palpites, jogos e notícias. Abra o link no Chrome e instale na tela inicial:',
        url: 'https://fielriopardo.com.br',
      }).catch(() => {});
    } else {
      window.open(WHATSAPP_SHARE_URL, '_blank');
    }
  };

  const isAdmin = user?.roles?.includes('ADMIN') || user?.roles?.includes('MASTER');
const isMasterRole = user?.roles?.includes('MASTER');
  // isMasterRole defined above

  const links = [
    ...navLinks,
    ...(isAdmin ? [{ href: '/admin', label: 'Admin' }] : []),
    ...(isMasterRole ? [{ href: '/master', label: 'Master' }] : []),
  ];

  return (
    <>
    <header className="fixed top-0 left-0 right-0 z-50 bg-black border-b-2 border-[#C8A951]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <Image src="/logo.jpeg" alt="Fiel Rio Pardo" width={44} height={44} className="rounded-full ring-2 ring-[#C8A951] object-cover" />
            <div>
              <span className="text-[#C8A951] font-black text-lg leading-none block">FIEL</span>
              <span className="text-white font-bold text-xs tracking-wider">RIO PARDO</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  pathname === link.href || pathname.startsWith(link.href + '/')
                    ? 'text-[#C8A951] bg-[#C8A951]/10'
                    : 'text-gray-300 hover:text-white hover:bg-[#1a1a1a]'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            {/* Share App */}
            <button
              onClick={handleShareApp}
              title="Compartilhar o App"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-gray-100 text-[#111] text-xs font-semibold transition-colors border border-[#C8A951]"
            >
              <Share2 size={15} className="text-[#C8A951]" />
              <span>Compartilhar App</span>
            </button>
            <NotificationBell />
            {isAuthenticated && user ? (
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-[#1a1a1a] transition-colors">
                    <Avatar src={user.avatarUrl} name={user.nick} size="sm" />
                    <span className="text-sm font-medium text-white">{user.nick}</span>
                    <ChevronDown size={14} className="text-gray-400" />
                  </button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    className="z-50 min-w-48 rounded-lg border border-[#2d2d2d] bg-[#1a1a1a] p-1 shadow-xl"
                    sideOffset={5}
                    align="end"
                  >
                    <DropdownMenu.Item
                      onSelect={() => router.push('/bolao/perfil')}
                      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-white hover:bg-[#2d2d2d] hover:text-[#C8A951] cursor-pointer"
                    >
                      <User size={14} /> Meu Perfil
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                      onSelect={() => router.push('/bolao/ranking')}
                      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-white hover:bg-[#2d2d2d] hover:text-[#C8A951] cursor-pointer"
                    >
                      <Trophy size={14} /> Ranking
                    </DropdownMenu.Item>
                    {(isAdmin || isMasterRole) && (
                      <>
                        <DropdownMenu.Separator className="my-1 h-px bg-[#2d2d2d]" />
                        <DropdownMenu.Item
                          onSelect={() => router.push(isMasterRole ? '/master' : '/admin')}
                          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-[#C8A951] hover:bg-[#C8A951]/10 cursor-pointer"
                        >
                          <LayoutDashboard size={14} /> {isMasterRole ? 'Painel Master' : 'Painel Admin'}
                        </DropdownMenu.Item>
                        <DropdownMenu.Item
                          onSelect={() => router.push(isMasterRole ? '/master/settings' : '/admin/bolao')}
                          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-[#C8A951] hover:bg-[#C8A951]/10 cursor-pointer"
                        >
                          <Settings size={14} /> Configurações do Sistema
                        </DropdownMenu.Item>
                      </>
                    )}
                    <DropdownMenu.Separator className="my-1 h-px bg-[#2d2d2d]" />
                    <DropdownMenu.Item
                      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-red-400 hover:bg-red-900/20 cursor-pointer"
                      onSelect={logout}
                    >
                      <LogOut size={14} /> Sair
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            ) : (
              <Link href="/bolao/entrar" className={buttonVariants({ size: 'sm' })}>Entrar no Bolão</Link>
            )}
          </div>

          {/* Mobile: Bell + Hamburger */}
          <div className="md:hidden flex items-center gap-1">
            <NotificationBell />
            <button
              className="p-2 text-white hover:text-[#C8A951]"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menu"
            >
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden bg-[#0d0d0d] border-t border-[#2d2d2d] overflow-hidden"
          >
            <div className="px-4 py-3 flex flex-col gap-1">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    pathname === link.href
                      ? 'text-[#C8A951] bg-[#C8A951]/10'
                      : 'text-gray-300 hover:text-white'
                  )}
                >
                  {link.label}
                </Link>
              ))}
              <div className="mt-2 pt-2 border-t border-[#2d2d2d]">
                {isAuthenticated && user ? (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 px-3 py-2">
                      <Avatar src={user.avatarUrl} name={user.nick} size="sm" />
                      <span className="text-sm text-white font-medium">{user.nick}</span>
                    </div>
                    {(isAdmin || isMasterRole) && (
                      <>
                        <Link href={isMasterRole ? '/master' : '/admin'}
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-[#C8A951] hover:bg-[#C8A951]/10 rounded-md">
                          <LayoutDashboard size={14} /> {isMasterRole ? 'Painel Master' : 'Painel Admin'}
                        </Link>
                        <Link href={isMasterRole ? '/master/settings' : '/admin/bolao'}
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-[#C8A951] hover:bg-[#C8A951]/10 rounded-md">
                          <Settings size={14} /> Configurações do Sistema
                        </Link>
                      </>
                    )}
                    <button
                      onClick={() => { logout(); setMobileOpen(false); }}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-900/20 rounded-md"
                    >
                      <LogOut size={14} /> Sair
                    </button>
                    <button
                      onClick={() => { handleShareApp(); setMobileOpen(false); }}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-[#25D366] hover:bg-[#25D366]/10 rounded-md font-semibold"
                    >
                      <Share2 size={14} /> Compartilhar App
                    </button>
                  </div>
                ) : (
                  <>
                    <Link href="/bolao/entrar" onClick={() => setMobileOpen(false)} className={buttonVariants({ size: "sm", className: "w-full" })}>Entrar no Bolão</Link>
                    <button
                      onClick={() => { handleShareApp(); setMobileOpen(false); }}
                      className="flex items-center justify-center gap-2 mt-2 px-3 py-2 text-sm text-[#25D366] hover:bg-[#25D366]/10 rounded-md font-semibold border border-[#25D366]/30 w-full"
                    >
                      <Share2 size={14} /> Compartilhar App
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
    <div className="h-16" aria-hidden="true" />
    </>
  );
}
