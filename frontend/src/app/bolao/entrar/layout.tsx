import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Entrar no Bolão | Fiel Rio Pardo',
  description: 'Faça login ou cadastre-se no Bolão da Fiel Rio Pardo e aposte nos jogos do Corinthians!',
  openGraph: {
    title: 'Entrar no Bolão | Fiel Rio Pardo',
    description: 'Faça login ou cadastre-se no Bolão da Fiel Rio Pardo e aposte nos jogos do Corinthians!',
    url: 'https://fielriopardo.com.br/bolao/entrar',
    siteName: 'Fiel Rio Pardo',
    images: [{ url: 'https://fielriopardo.com.br/og-bolao.jpg', width: 1600, height: 485, alt: 'Bolão Fiel Rio Pardo' }],
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Entrar no Bolão | Fiel Rio Pardo',
    description: 'Faça login ou cadastre-se no Bolão da Fiel Rio Pardo!',
    images: ['https://fielriopardo.com.br/og-bolao.jpg'],
  },
};

export default function BolaoEntrarLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
