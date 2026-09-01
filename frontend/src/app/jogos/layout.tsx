import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Jogos | Fiel Rio Pardo',
  description: 'Calendário de jogos, resultados e classificação do Corinthians em 2026. Brasileirão, Copa do Brasil, Libertadores e mais.',
  openGraph: {
    title: 'Jogos | Fiel Rio Pardo',
    description: 'Calendário de jogos e classificação do Corinthians em 2026.',
    url: 'https://fielriopardo.com.br/jogos',
    siteName: 'Fiel Rio Pardo',
    images: [{ url: 'https://fielriopardo.com.br/og-image.jpg', width: 1200, height: 630 }],
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Jogos | Fiel Rio Pardo',
    description: 'Calendário de jogos e classificação do Corinthians em 2026.',
    images: ['https://fielriopardo.com.br/og-image.jpg'],
  },
};

export default function JogosLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
