import type { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  const { data: mangas } = await supabase
    .from('mangas')
    .select('slug, updated_at');

  const { data: tags } = await supabase
    .from('tags')
    .select('slug');

  const { data: genres } = await supabase
    .from('genres')
    .select('slug');

  const mangaUrls: MetadataRoute.Sitemap = (mangas ?? []).map((manga) => ({
    url: `https://mangafuta.com/manga/${manga.slug}`,
    lastModified: new Date(manga.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  const tagUrls: MetadataRoute.Sitemap = (tags ?? []).map((tag) => ({
    url: `https://mangafuta.com/tag/${tag.slug}`,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  const genreUrls: MetadataRoute.Sitemap = (genres ?? []).map((genre) => ({
    url: `https://mangafuta.com/genre/${genre.slug}`,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  return [
    {
      url: 'https://mangafuta.com',
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: 'https://mangafuta.com/manga',
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: 'https://mangafuta.com/search',
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    ...mangaUrls,
    ...tagUrls,
    ...genreUrls,
  ];
}