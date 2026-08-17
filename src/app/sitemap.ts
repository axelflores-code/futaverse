import type {
  MetadataRoute,
} from 'next'

import {
  createPublicClient,
} from '@/lib/supabase/public'

const BASE_URL =
  'https://mangafuta.com'

const BATCH_SIZE = 1000
const MIN_TAG_MANGAS = 2

export const revalidate = 3600

interface MangaRow {
  slug: string
  updated_at: string | null
}

interface TagRow {
  slug: string
  usage_count:
    | number
    | string
    | null
}

function getValidDate(
  value: string | null
): Date | undefined {
  if (!value) {
    return undefined
  }

  const date = new Date(value)

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return undefined
  }

  return date
}

async function getAllMangas():
  Promise<MangaRow[]> {
  const supabase =
    createPublicClient()

  const results:
    MangaRow[] = []

  let offset = 0

  while (true) {
    const {
      data,
      error,
    } = await supabase
      .from('mangas')
      .select(`
        slug,
        updated_at
      `)
      .neq('status', 'draft')
      .not('slug', 'is', null)
      .neq('slug', '')
      .order(
        'slug',
        {
          ascending: true,
        }
      )
      .range(
        offset,
        offset +
          BATCH_SIZE -
          1
      )

    if (error) {
      /*
       * No generamos un sitemap incompleto.
       * Next.js conservará la versión anterior
       * si la regeneración falla.
       */
      throw new Error(
        `Error obteniendo mangas para sitemap: ${error.message}`
      )
    }

    const rows =
      (
        data ?? []
      ) as unknown as
        MangaRow[]

    results.push(...rows)

    if (
      rows.length <
      BATCH_SIZE
    ) {
      break
    }

    offset +=
      BATCH_SIZE
  }

  return results
}

async function getValidTags():
  Promise<TagRow[]> {
  const supabase =
    createPublicClient()

  const results:
    TagRow[] = []

  let offset = 0

  while (true) {
    const {
      data,
      error,
    } = await supabase
      .from('tags')
      .select(`
        slug,
        usage_count
      `)
      .gte(
        'usage_count',
        MIN_TAG_MANGAS
      )
      .not('slug', 'is', null)
      .neq('slug', '')
      .order(
        'slug',
        {
          ascending: true,
        }
      )
      .range(
        offset,
        offset +
          BATCH_SIZE -
          1
      )

    if (error) {
      throw new Error(
        `Error obteniendo tags para sitemap: ${error.message}`
      )
    }

    const rows =
      (
        data ?? []
      ) as unknown as
        TagRow[]

    results.push(...rows)

    if (
      rows.length <
      BATCH_SIZE
    ) {
      break
    }

    offset +=
      BATCH_SIZE
  }

  return results
}

export default async function sitemap():
  Promise<MetadataRoute.Sitemap> {
  const [
    mangasRaw,
    tagsRaw,
  ] = await Promise.all([
    getAllMangas(),
    getValidTags(),
  ])

  /*
   * Protección adicional contra registros
   * duplicados en la base de datos.
   */
  const mangas =
    Array.from(
      new Map(
        mangasRaw.map(
          (manga) => [
            manga.slug,
            manga,
          ]
        )
      ).values()
    )

  const tags =
    Array.from(
      new Map(
        tagsRaw.map(
          (tag) => [
            tag.slug,
            tag,
          ]
        )
      ).values()
    )

  const mangaUrls:
    MetadataRoute.Sitemap =
      mangas.map(
        (manga) => {
          const lastModified =
            getValidDate(
              manga.updated_at
            )

          return {
            url:
              `${BASE_URL}/manga/${manga.slug}`,

            ...(lastModified
              ? {
                  lastModified,
                }
              : {}),

            changeFrequency:
              'weekly' as const,

            priority:
              0.8,
          }
        }
      )

  const tagUrls:
    MetadataRoute.Sitemap =
      tags.map(
        (tag) => ({
          url:
            `${BASE_URL}/tag/${tag.slug}`,

          changeFrequency:
            'weekly' as const,

          priority:
            0.6,
        })
      )

  return [
    {
      url: BASE_URL,
      changeFrequency:
        'daily',
      priority: 1,
    },
    {
      url:
        `${BASE_URL}/manga`,
      changeFrequency:
        'daily',
      priority: 0.9,
    },
    {
      url:
        `${BASE_URL}/tags`,
      changeFrequency:
        'weekly',
      priority: 0.7,
    },
    ...mangaUrls,
    ...tagUrls,
  ]
}