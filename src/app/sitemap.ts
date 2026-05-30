import type { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  const { data: mangas } = await supabase
    .from('mangas')
    .select('slug, updated_at');

  const mangaUrls: MetadataRoute.Sitemap = (mangas ?? []).map((manga) => ({
    url: `https://futaverse.com/manga/${manga.slug}`,
    lastModified: new Date(manga.updated_at),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [
    { url: 'https://futaverse.com', changeFrequency: 'daily', priority: 1 },
    { url: 'https://futaverse.com/manga', changeFrequency: 'daily', priority: 0.9 },
    ...mangaUrls,
  ];
}