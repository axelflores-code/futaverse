
import { createClient } from '@/lib/supabase/server';
import type { Manga, PaginatedResponse, MangaSearchParams } from '@/types/manga';

export async function getMangaBySlug(slug: string): Promise<Manga | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('mangas')
    .select(`
      *,
      manga_genres (
        genres ( id, name, slug )
      )
    `)
    .eq('slug', slug)
    .single();

  if (error || !data) return null;

  return mapMangaRow(data);
}

export async function getMangas(
  params: MangaSearchParams = {}
): Promise<PaginatedResponse<Manga>> {
  const supabase = await createClient();
  const {
    q,
    genres,
    status,
    sortBy = 'updated_at',
    order = 'desc',
    page = 1,
    pageSize = 24,
  } = params;

  let query = supabase
    .from('mangas')
    .select('*, manga_genres(genres(id, name, slug))', { count: 'exact' });

  if (q) query = query.ilike('title', `%${q}%`);
  if (status) query = query.eq('status', status);

  query = query
    .order(sortBy, { ascending: order === 'asc' })
    .range((page - 1) * pageSize, page * pageSize - 1);

  const { data, error, count } = await query;

  if (error) throw new Error(error.message);

  return {
    data: (data ?? []).map(mapMangaRow),
    total: count ?? 0,
    page,
    pageSize,
  };
}

export async function getLatestUpdated(limit = 12): Promise<Manga[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('mangas')
    .select('*, manga_genres(genres(id, name, slug))')
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);

  return (data ?? []).map(mapMangaRow);
}

// Mapper: snake_case DB → camelCase TS
function mapMangaRow(row: Record<string, unknown>): Manga {
  return {
    id: row.id as string,
    slug: row.slug as string,
    title: row.title as string,
    alternativeTitles: (row.alternative_titles as string[]) ?? [],
    description: row.description as string | null,
    coverUrl: row.cover_url as string | null,
    status: row.status as Manga['status'],
    rating: row.rating as Manga['rating'],
    score: row.score as number,
    views: row.views as bigint,
    author: row.author as string | null,
    artist: row.artist as string | null,
    genres: ((row.manga_genres as Array<{ genres: { id: string; name: string; slug: string } }>) ?? [])
      .map((mg) => mg.genres),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}