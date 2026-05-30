import { createClient } from '@/lib/supabase/server'
import type { Chapter } from '@/types/manga'

export async function getChaptersByManga(mangaSlug: string): Promise<Chapter[]> {
  const supabase = await createClient()

  const { data: manga } = await supabase
    .from('mangas')
    .select('id')
    .eq('slug', mangaSlug)
    .single()

  if (!manga) return []

  const { data } = await supabase
    .from('chapters')
    .select('*')
    .eq('manga_id', manga.id)
    .order('number', { ascending: false })

  return (data ?? []).map(mapChapter)
}

export async function getChapterWithAdjacentNav(
  mangaSlug: string,
  chapterNumber: number
) {
  const supabase = await createClient()

  const { data: manga } = await supabase
    .from('mangas')
    .select('id, slug, title')
    .eq('slug', mangaSlug)
    .single()

  if (!manga) return null

  const { data: chapter } = await supabase
    .from('chapters')
    .select('*')
    .eq('manga_id', manga.id)
    .eq('number', chapterNumber)
    .single()

  if (!chapter) return null

  const [prevResult, nextResult] = await Promise.all([
    supabase
      .from('chapters')
      .select('id, number, manga_id')
      .eq('manga_id', manga.id)
      .lt('number', chapterNumber)
      .order('number', { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from('chapters')
      .select('id, number, manga_id')
      .eq('manga_id', manga.id)
      .gt('number', chapterNumber)
      .order('number', { ascending: true })
      .limit(1)
      .single(),
  ])

  return {
    chapter: mapChapter(chapter),
    manga: { id: manga.id, slug: manga.slug, title: manga.title },
    prev: prevResult.data ? {
      id: prevResult.data.id,
      number: prevResult.data.number,
      mangaId: prevResult.data.manga_id
    } : null,
    next: nextResult.data ? {
      id: nextResult.data.id,
      number: nextResult.data.number,
      mangaId: nextResult.data.manga_id
    } : null,
  }
}

function mapChapter(row: Record<string, unknown>): Chapter {
  return {
    id:        row.id as string,
    mangaId:   row.manga_id as string,
    number:    row.number as number,
    title:     row.title as string | null,
    pages:     row.pages as string[],
    views:     row.views as bigint,
    createdAt: row.created_at as string,
  }
}