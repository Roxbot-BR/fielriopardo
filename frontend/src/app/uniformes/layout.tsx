import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Uniformes | Fiel Rio Pardo',
  description: 'Galeria de uniformes oficiais do Corinthians — kits titular, reserva e terceiro uniforme.',
  openGraph: {
    title: 'Uniformes | Fiel Rio Pardo',
    description: 'Galeria de uniformes oficiais do Corinthians — kits titular, reserva e terceiro uniforme.',
    url: 'https://fielriopardo.com.br/uniformes',
    siteName: 'Fiel Rio Pardo',
    images: [{ url: 'https://fielriopardo.com.br/og-image.jpg', width: 1200, height: 630 }],
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Uniformes | Fiel Rio Pardo',
    description: 'Galeria de uniformes oficiais do Corinthians.',
    images: ['https://fielriopardo.com.br/og-image.jpg'],
  },
};

export default function UniformesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
