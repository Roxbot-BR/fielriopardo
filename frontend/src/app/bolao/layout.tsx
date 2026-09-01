import type { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL('https://fielriopardo.com.br'),
  title: 'Bolão | Fiel Rio Pardo',
  description: 'Participe do Bolão da Fiel Rio Pardo — aposte nos jogos do Corinthians e dispute com outros torcedores!',
  openGraph: {
    title: 'Bolão | Fiel Rio Pardo',
    description: 'Participe do Bolão da Fiel Rio Pardo e dispute com outros torcedores!',
    url: 'https://fielriopardo.com.br/bolao',
    siteName: 'Fiel Rio Pardo',
    images: [
      {
        url: 'https://fielriopardo.com.br/og-logo.jpg',
        secureUrl: 'https://fielriopardo.com.br/og-logo.jpg',
        width: 600,
        height: 600,
        type: 'image/jpeg',
        alt: 'Fiel Rio Pardo',
      },
    ],
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Bolão | Fiel Rio Pardo',
    description: 'Participe do Bolão da Fiel Rio Pardo!',
    images: ['https://fielriopardo.com.br/og-logo.jpg'],
  },
};

export default function BolaoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
