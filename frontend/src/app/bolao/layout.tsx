import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Bolão | Fiel Rio Pardo',
  description: 'Participe do Bolão da Fiel Rio Pardo — aposte nos jogos do Corinthians e dispute com outros torcedores!',
  openGraph: {
    title: 'Bolão | Fiel Rio Pardo',
    description: 'Participe do Bolão da Fiel Rio Pardo e dispute com outros torcedores!',
        siteName: 'Fiel Rio Pardo',
    images: [{ url: 'https://fielriopardo.com.br/og-logo.jpg', width: 600, height: 600 }],
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bolão | Fiel Rio Pardo',
    description: 'Participe do Bolão da Fiel Rio Pardo!',
    images: ['https://fielriopardo.com.br/og-logo.jpg'],
  },
};

export default function BolaoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
