import type { Metadata } from 'next';
import NoticiaDetailClient from './NoticiaDetailClient';

const API_SERVER = 'http://backend:3001/api';

interface NewsArticle {
  id: string;
  title: string;
  summary?: string;
  imageUrl?: string;
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;

  try {
    const res = await fetch(`${API_SERVER}/news/${id}`, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error('not found');
    const news: NewsArticle = await res.json();

    const image = news.imageUrl || 'https://fielriopardo.com.br/og-image.jpg';
    const description = news.summary || 'Leia mais em Fiel Rio Pardo — Torcida Organizada Corinthians';

    return {
      title: `${news.title} | Fiel Rio Pardo`,
      description,
      openGraph: {
        title: news.title,
        description,
        url: `https://fielriopardo.com.br/noticias/${id}`,
        siteName: 'Fiel Rio Pardo',
        images: [{ url: image, width: 1200, height: 630, alt: news.title }],
        type: 'article',
        locale: 'pt_BR',
      },
      twitter: {
        card: 'summary_large_image',
        title: news.title,
        description,
        images: [image],
      },
    };
  } catch {
    return {
      title: 'Notícia | Fiel Rio Pardo',
      openGraph: {
        title: 'Notícia | Fiel Rio Pardo',
        images: [{ url: 'https://fielriopardo.com.br/og-image.jpg' }],
      },
    };
  }
}

export default function Page() {
  return <NoticiaDetailClient />;
}
