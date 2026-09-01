import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Bolão | Fiel Rio Pardo',
  description: 'Participe do Bolão da Fiel Rio Pardo — aposte nos jogos do Corinthians e dispute com outros torcedores!',
  openGraph: {
    title: 'Bolão | Fiel Rio Pardo',
    description: 'Participe do Bolão da Fiel Rio Pardo e dispute com outros torcedores!',
    url: 'https://fielriopardo.com.br/bolao',
    siteName: 'Fiel Rio Pardo',
    images: [{ url: 'https://fielriopardo.com.br/og-image.jpg', width: 1200, height: 630 }],
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bolão | Fiel Rio Pardo',
    description: 'Participe do Bolão da Fiel Rio Pardo!',
    images: ['https://fielriopardo.com.br/og-image.jpg'],
  },
};

export default function BolaoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
