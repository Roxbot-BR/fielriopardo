import type { MetadataRoute } from "next";

const SITE_URL = "https://fielriopardo.com.br";

export const dynamic = "force-dynamic";
export const revalidate = 3600;
const API_BASE = (process.env.INTERNAL_API_URL || "http://backend:3001") + "/api";

type NewsItem = {
  id: string;
  publishedAt?: string;
  updatedAt?: string;
};

type CaravanItem = {
  id: string;
  updatedAt?: string;
  createdAt?: string;
};

type PlayerItem = {
  id: string;
  updatedAt?: string;
};

function asDate(value?: string): Date {
  if (!value) return new Date();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

async function getNewsRoutes(): Promise<MetadataRoute.Sitemap> {
  try {
    const res = await fetch(API_BASE + "/news?limit=500", { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const news = (await res.json()) as NewsItem[];
    return news.map((item) => ({
      url: SITE_URL + "/noticias/" + item.id,
      lastModified: asDate(item.updatedAt || item.publishedAt),
      changeFrequency: "hourly",
      priority: 0.8,
    }));
  } catch {
    return [];
  }
}

async function getCaravanRoutes(): Promise<MetadataRoute.Sitemap> {
  try {
    const res = await fetch(API_BASE + "/caravans", { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const caravans = (await res.json()) as CaravanItem[];
    return caravans.map((item) => ({
      url: SITE_URL + "/caravanas/" + item.id,
      lastModified: asDate(item.updatedAt || item.createdAt),
      changeFrequency: "weekly",
      priority: 0.7,
    }));
  } catch {
    return [];
  }
}

async function getPlayerRoutes(): Promise<MetadataRoute.Sitemap> {
  try {
    const res = await fetch(API_BASE + "/players?status=active", { next: { revalidate: 86400 } });
    if (!res.ok) return [];
    const players = (await res.json()) as PlayerItem[];
    return players.map((item) => ({
      url: SITE_URL + "/elenco/" + item.id,
      lastModified: asDate(item.updatedAt),
      changeFrequency: "weekly",
      priority: 0.6,
    }));
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: SITE_URL + "/sobre", lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: SITE_URL + "/jogos", lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: SITE_URL + "/noticias", lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: SITE_URL + "/noticias/historico", lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: SITE_URL + "/elenco", lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: SITE_URL + "/caravanas", lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: SITE_URL + "/caravanas/galeria", lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: SITE_URL + "/uniformes", lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: SITE_URL + "/bolao", lastModified: now, changeFrequency: "hourly", priority: 0.8 },
    { url: SITE_URL + "/bolao/historico", lastModified: now, changeFrequency: "daily", priority: 0.6 },
    { url: SITE_URL + "/bolao/ranking", lastModified: now, changeFrequency: "hourly", priority: 0.7 },
    { url: SITE_URL + "/privacidade", lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: SITE_URL + "/termos", lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  const data = await Promise.all([getNewsRoutes(), getCaravanRoutes(), getPlayerRoutes()]);
  return staticRoutes.concat(data[0], data[1], data[2]);
}
