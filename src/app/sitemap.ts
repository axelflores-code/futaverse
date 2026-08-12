import type { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

const BASE_URL = 'https://mangafuta.com'
const BATCH_SIZE = 1000
const MIN_TAG_MANGAS = 2

interface MangaRow {
  slug: string
  updated_at: string | null
}

interface TagRow {
  slug: string
  manga_tags: Array<{
    manga_id: string
  }>
}

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient()

  async function getAllMangas(): Promise<MangaRow[]> {
    const results: MangaRow[] = []
    let offset = 0

    while (true) {
      const { data, error } = await supabase
        .from('mangas')
        .select('slug, updated_at')
        .not('slug', 'is', null)
        .order('slug', { ascending: true })
        .range(offset, offset + BATCH_SIZE - 1)

      if (error) {
        console.error(
          'Error obteniendo mangas para sitemap:',
          error
        )
        break
      }

      const rows = (data ?? []) as MangaRow[]

      results.push(...rows)

      if (rows.length < BATCH_SIZE) {
        break
      }

      offset += BATCH_SIZE
    }

    return results
  }

  async function getValidTags(): Promise<TagRow[]> {
    const results: TagRow[] = []
    let offset = 0

    while (true) {
      const { data, error } = await supabase
        .from('tags')
        .select(`
          slug,
          manga_tags!inner (
            manga_id
          )
        `)
        .not('slug', 'is', null)
        .order('slug', { ascending: true })
        .range(offset, offset + BATCH_SIZE - 1)

      if (error) {
        console.error(
          'Error obteniendo tags para sitemap:',
          error
        )
        break
      }

      const rows = (data ?? []) as TagRow[]

      results.push(
        ...rows.filter(
          (tag) =>
            (tag.manga_tags?.length ?? 0) >=
            MIN_TAG_MANGAS
        )
      )

      if (rows.length < BATCH_SIZE) {
        break
      }

      offset += BATCH_SIZE
    }

    return results
  }

  const [mangas, tags] = await Promise.all([
    getAllMangas(),
    getValidTags(),
  ])

  const mangaUrls: MetadataRoute.Sitemap = mangas.map(
    (manga) => ({
      url: `${BASE_URL}/manga/${manga.slug}`,

      ...(manga.updated_at
        ? {
            lastModified: new Date(manga.updated_at),
          }
        : {}),
    })
  )

  const tagUrls: MetadataRoute.Sitemap = tags.map(
    (tag) => ({
      url: `${BASE_URL}/tag/${tag.slug}`,
    })
  )

  return [
    {
      url: BASE_URL,
    },
    {
      url: `${BASE_URL}/manga`,
    },
    ...mangaUrls,
    ...tagUrls,
  ]
}