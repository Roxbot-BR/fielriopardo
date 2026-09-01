import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Notícias | Fiel Rio Pardo',
  description: 'Últimas notícias do Corinthians pela Torcida Organizada Fiel Rio Pardo — São José do Rio Pardo - SP.',
  openGraph: {
    title: 'Notícias | Fiel Rio Pardo',
    description: 'Últimas notícias do Corinthians pela Torcida Organizada Fiel Rio Pardo.',
    url: 'https://fielriopardo.com.br/noticias',
    siteName: 'Fiel Rio Pardo',
    images: [{ url: 'https://fielriopardo.com.br/og-image.jpg', width: 1200, height: 630 }],
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Notícias | Fiel Rio Pardo',
    description: 'Últimas notícias do Corinthians pela Torcida Organizada Fiel Rio Pardo.',
    images: ['https://fielriopardo.com.br/og-image.jpg'],
  },
};

export default function NoticiasLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
