import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Elenco | Fiel Rio Pardo',
  description: 'Elenco completo do Corinthians — jogadores, comissão técnica e informações.',
  openGraph: {
    title: 'Elenco | Fiel Rio Pardo',
    description: 'Elenco completo do Corinthians — jogadores e comissão técnica.',
    url: 'https://fielriopardo.com.br/elenco',
    siteName: 'Fiel Rio Pardo',
    images: [{ url: 'https://fielriopardo.com.br/og-image.jpg', width: 1200, height: 630 }],
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Elenco | Fiel Rio Pardo',
    description: 'Elenco completo do Corinthians.',
    images: ['https://fielriopardo.com.br/og-image.jpg'],
  },
};

export default function ElencoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
