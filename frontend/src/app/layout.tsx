import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/contexts/AuthContext';
import PwaRegister from '@/components/PwaRegister';
import PwaDetector from '@/components/PwaDetector';
import PwaInstallBanner from '@/components/PwaInstallBanner';
import NotificationBanner from '@/components/NotificationBanner';
import PwaTracker from '@/components/PwaTracker';
import SecurityGuard from '@/components/SecurityGuard';
import './globals.css';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  title: 'Fiel Rio Pardo | Torcida Organizada Corinthians',
  description:
    'Torcida Organizada Fiel Rio Pardo — Corinthians em São José do Rio Pardo - SP. Bolão, notícias, jogos e muito mais!',
  keywords: ['Corinthians', 'Torcida', 'Rio Pardo', 'Bolão', 'Futebol'],
  authors: [{ name: 'Fiel Rio Pardo' }],
  icons: {
    icon: [
      { url: "/favicon.ico",       sizes: "any",     type: "image/x-icon" },
      { url: "/favicon-16x16.png", sizes: "16x16",   type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32",   type: "image/png" },
      { url: "/icon-192x192.png",  sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png",  sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: "/favicon.ico",
  },
  manifest: "/manifest.json",
  openGraph: {
    title: 'Fiel Rio Pardo | Torcida Organizada Corinthians',
    description: 'Torcida Organizada Fiel Rio Pardo — São José do Rio Pardo - SP',
    url: 'https://fielriopardo.com.br',
    siteName: 'Fiel Rio Pardo',
    images: [{ url: 'https://fielriopardo.com.br/og-image.jpg', width: 1200, height: 630, alt: 'Fiel Rio Pardo' }],
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fiel Rio Pardo | Torcida Organizada Corinthians',
    description: 'Torcida Organizada Fiel Rio Pardo — São José do Rio Pardo - SP',
    images: ['https://fielriopardo.com.br/og-image.jpg'],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: dark)',  color: '#000000' },
    { media: '(prefers-color-scheme: light)', color: '#C8A951' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={inter.className}>
      <body className="bg-transparent text-white antialiased">
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined') {
                if ('serviceWorker' in navigator) {
                  navigator.serviceWorker.getRegistrations().then(function(regs) {
                    for (var r of regs) { r.unregister(); }
                  }).catch(function(){});
                }
                if ('caches' in window) {
                  caches.keys().then(function(names) {
                    for (var n of names) { caches.delete(n); }
                  }).catch(function(){});
                }
              }
            `,
          }}
        />
        {/* Fixed background image layer */}
        <div
          aria-hidden="true"
          style={{
            position: 'fixed', inset: 0, zIndex: -2,
            backgroundImage: "url('/images/fundo.jpg')",
            backgroundSize: 'cover', backgroundPosition: 'center',
            transform: 'translateZ(0)',
            willChange: 'transform',
            backfaceVisibility: 'hidden',
            pointerEvents: 'none',
          }}
        />
        {/* Semi-transparent dark overlay */}
        <div
          aria-hidden="true"
          style={{
            position: 'fixed', inset: 0, zIndex: -1, background: 'rgba(0,0,0,0.30)',
            transform: 'translateZ(0)',
            willChange: 'transform',
            backfaceVisibility: 'hidden',
            pointerEvents: 'none',
          }}
        />
        <AuthProvider>
          <PwaRegister />
          <PwaDetector />
          <PwaInstallBanner />
          <NotificationBanner />
          <PwaTracker />
          <SecurityGuard />
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#1a1a1a',
                color: '#ffffff',
                border: '1px solid #C8A951',
              },
              success: {
                iconTheme: { primary: '#C8A951', secondary: '#000000' },
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
