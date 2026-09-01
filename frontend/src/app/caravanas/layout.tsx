import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Caravanas | Fiel Rio Pardo',
  description: 'Caravanas da Torcida Organizada Fiel Rio Pardo — viagens para os jogos do Corinthians.',
  openGraph: {
    title: 'Caravanas | Fiel Rio Pardo',
    description: 'Caravanas da Torcida Organizada Fiel Rio Pardo para os jogos do Corinthians.',
    url: 'https://fielriopardo.com.br/caravanas',
    siteName: 'Fiel Rio Pardo',
    images: [{ url: 'https://fielriopardo.com.br/og-image.jpg', width: 1200, height: 630 }],
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Caravanas | Fiel Rio Pardo',
    description: 'Caravanas da Torcida Organizada Fiel Rio Pardo.',
    images: ['https://fielriopardo.com.br/og-image.jpg'],
  },
};

export default function CaravanasLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
