import type { Metadata } from 'next'
import { unstable_cache } from 'next/cache'
import { notFound } from 'next/navigation'
import Link from 'next/link'

import { createPublicClient } from '@/lib/supabase/public'
import { MangaCard } from '@/components/manga/MangaCard'
import { Pagination } from '@/components/ui/Pagination'

import type { Manga } from '@/types/manga'

export const revalidate = 900

const PAGE_SIZE = 24

type SortValue =
  | 'recent'
  | 'oldest'
  | 'popular'
  | 'score'

interface PageProps {
  params: Promise<{
    slug: string
  }>

  searchParams: Promise<{
    page?: string
    sort?: string
  }>
}

interface TagRow {
  id: string
  name: string
  slug: string
  namespace: string
}

interface MangaRow {
  id: string
  slug: string
  title: string
  cover_url: string | null
  status: string
  score: number
  rating: string
  description: string | null
  views: number | string | null
  created_at: string
  updated_at: string
  author: string | null

  manga_genres: Array<{
    genres: {
      id: string
      name: string
      slug: string
    }
  }>

  manga_tags?: Array<{
    tag_id: string
  }>
}

interface TagMangasResult {
  mangasRaw: MangaRow[]
  total: number
}

const NS_LABELS: Record<string, string> = {
  theme: 'Tema',
  trope: 'Tropo',
  setting: 'Ambientación',
  format: 'Formato',
  content_warning:
    'Advertencia de contenido',
}

const SORT_OPTIONS: Array<{
  value: SortValue
  label: string
}> = [
  {
    value: 'recent',
    label: 'Recientes',
  },
  {
    value: 'oldest',
    label: 'Más antiguos',
  },
  {
    value: 'popular',
    label: 'Populares',
  },
  {
    value: 'score',
    label: 'Mejor score',
  },
]

const VALID_SORTS =
  new Set<SortValue>([
    'recent',
    'oldest',
    'popular',
    'score',
  ])

function parsePage(
  value?: string
): number {
  const parsed = Number.parseInt(
    value ?? '1',
    10
  )

  if (
    !Number.isFinite(parsed) ||
    parsed < 1
  ) {
    return 1
  }

  return parsed
}

function parseSort(
  value?: string
): SortValue {
  if (
    value &&
    VALID_SORTS.has(
      value as SortValue
    )
  ) {
    return value as SortValue
  }

  return 'recent'
}

function mapManga(
  manga: MangaRow
): Manga {
  return {
    id: manga.id,
    slug: manga.slug,
    title: manga.title,
    coverUrl: manga.cover_url,

    status:
      manga.status as Manga['status'],

    score: manga.score,

    rating:
      manga.rating as Manga['rating'],

    description:
      manga.description,

    views: BigInt(
      manga.views ?? 0
    ),

    author: manga.author,
    artist: null,
    alternativeTitles: [],

    genres:
      (
        manga.manga_genres ?? []
      )
        .map((item) => item.genres)
        .filter(Boolean),

    createdAt:
      manga.created_at,

    updatedAt:
      manga.updated_at,
  }
}

/*
 * Guarda los datos del tag durante una hora.
 * No utiliza cookies ni sesión.
 */
const getTag = unstable_cache(
  async (
    slug: string
  ): Promise<TagRow | null> => {
    const supabase =
      createPublicClient()

    const {
      data,
      error,
    } = await supabase
      .from('tags')
      .select(
        'id, name, slug, namespace'
      )
      .eq('slug', slug)
      .maybeSingle()

    if (error) {
      throw new Error(
        `Error cargando el tag "${slug}": ${error.message}`
      )
    }

    return (
      data as TagRow | null
    )
  },
  ['mangafuta-tag-v3'],
  {
    revalidate: 3600,
    tags: ['mangafuta-tags'],
  }
)

/*
 * Consulta mangas directamente.
 *
 * Antes:
 * 1. Descargaba hasta 1,000 IDs.
 * 2. Enviaba todos dentro de .in().
 * 3. Generaba una URL enorme.
 *
 * Ahora:
 * mangas -> manga_tags -> tag_id
 *
 * La paginación y el orden se ejecutan
 * dentro de Supabase.
 */
const getMangasByTag =
  unstable_cache(
    async (
      tagId: string,
      sort: SortValue,
      currentPage: number
    ): Promise<TagMangasResult> => {
      const supabase =
        createPublicClient()

      const from =
        (
          currentPage - 1
        ) * PAGE_SIZE

      const to =
        from +
        PAGE_SIZE -
        1

      const orderColumn =
        sort === 'popular'
          ? 'views'
          : sort === 'score'
            ? 'score'
            : sort === 'oldest'
              ? 'created_at'
              : 'updated_at'

      const ascending =
        sort === 'oldest'

      const {
        data,
        count,
        error,
      } = await supabase
        .from('mangas')
        .select(
          `
            id,
            slug,
            title,
            cover_url,
            status,
            score,
            rating,
            description,
            views,
            created_at,
            updated_at,
            author,

            manga_genres (
              genres (
                id,
                name,
                slug
              )
            ),

            manga_tags!inner (
              tag_id
            )
          `,
          {
            count: 'exact',
          }
        )
        .eq(
          'manga_tags.tag_id',
          tagId
        )
        .not(
          'slug',
          'is',
          null
        )
        .order(
          orderColumn,
          {
            ascending,
          }
        )
        .range(from, to)

      if (error) {
        throw new Error(
          `Error cargando mangas del tag: ${error.message}`
        )
      }

      return {
        mangasRaw:
          (
            data ?? []
          ) as unknown as MangaRow[],

        total:
          count ?? 0,
      }
    },
    [
      'mangafuta-tag-mangas-v3',
    ],
    {
      revalidate: 900,
      tags: [
        'mangafuta-tag-mangas',
      ],
    }
  )

export async function generateMetadata({
  params,
  searchParams,
}: PageProps): Promise<Metadata> {
  const {
    slug,
  } = await params

  const {
    page: pageParam,
    sort: sortParam,
  } = await searchParams

  const currentPage =
    parsePage(pageParam)

  const tag =
    await getTag(slug)

  if (!tag) {
    return {
      title:
        'Etiqueta no encontrada',

      robots: {
        index: false,
        follow: false,
      },
    }
  }

  const basePath =
    `/tag/${tag.slug}`

  const canonical =
    currentPage > 1
      ? `${basePath}?page=${currentPage}`
      : basePath

  const pageText =
    currentPage > 1
      ? ` — Página ${currentPage}`
      : ''

  const title =
    `Manga ${tag.name} en español${pageText}`

  const description =
    `Lee mangas con la etiqueta ${tag.name} en español. ` +
    'Explora títulos y capítulos disponibles gratis en MangaFuta.'

  /*
   * Los órdenes alternativos son
   * duplicados del mismo contenido.
   */
  const shouldIndex =
    !sortParam

  return {
    title,
    description,

    alternates: {
      canonical,
    },

    robots: {
      index: shouldIndex,
      follow: true,

      googleBot: {
        index: shouldIndex,
        follow: true,
        'max-image-preview':
          'large',
        'max-snippet': -1,
      },
    },

    openGraph: {
      type: 'website',
      locale: 'es_ES',
      siteName: 'MangaFuta',
      title,
      description,
      url: canonical,

      images: [
        {
          url: '/og-image.jpg',
          width: 1200,
          height: 630,
          alt:
            `Mangas de ${tag.name} en MangaFuta`,
        },
      ],
    },

    twitter: {
      card:
        'summary_large_image',
      title,
      description,
      images: [
        '/og-image.jpg',
      ],
    },
  }
}

export default async function TagPage({
  params,
  searchParams,
}: PageProps) {
  const {
    slug,
  } = await params

  const {
    page: pageParam,
    sort: sortParam,
  } = await searchParams

  const currentPage =
    parsePage(pageParam)

  const sort =
    parseSort(sortParam)

  const tag =
    await getTag(slug)

  if (!tag) {
    notFound()
  }

  const {
    mangasRaw,
    total,
  } = await getMangasByTag(
    tag.id,
    sort,
    currentPage
  )

  const totalPages =
    Math.ceil(
      total / PAGE_SIZE
    )

  /*
   * No dejamos indexar páginas
   * vacías como ocurrió con Futanari.
   */
  if (total === 0) {
    notFound()
  }

  if (
    currentPage > 1 &&
    currentPage > totalPages
  ) {
    notFound()
  }

  const mangas =
    mangasRaw.map(mapManga)

  const paginationParams:
    Record<string, string> = {}

  if (sort !== 'recent') {
    paginationParams.sort =
      sort
  }

  return (
    <main
      className="tag-page"
    >
      <Link
        href="/manga"
        className="tag-back-link"
      >
        <svg
          width="12"
          height="12"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 19l-7-7 7-7"
          />
        </svg>

        Catálogo
      </Link>

      <header className="tag-header">
        <p className="tag-namespace">
          {
            NS_LABELS[
              tag.namespace
            ] ??
            tag.namespace
          }
        </p>

        <h1>
          {tag.name}
        </h1>

        <p className="tag-total">
          {total.toLocaleString()}{' '}
          manga
          {total !== 1
            ? 's'
            : ''}
        </p>
      </header>

      <nav
        aria-label="Ordenar mangas"
        className="tag-sort"
      >
        <span className="tag-sort-label">
          Ordenar:
        </span>

        {SORT_OPTIONS.map(
          (option) => {
            const active =
              sort ===
              option.value

            const href =
              option.value ===
              'recent'
                ? `/tag/${tag.slug}`
                : `/tag/${tag.slug}?sort=${option.value}`

            return (
              <Link
                key={option.value}
                href={href}
                className={[
                  'tag-sort-option',

                  active
                    ? 'active'
                    : '',

                  option.value ===
                  'popular'
                    ? 'popular'
                    : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {option.label}
              </Link>
            )
          }
        )}
      </nav>

      <section
        aria-label={
          `Mangas con el tag ${tag.name}`
        }
        className="tag-page-grid"
      >
        {mangas.map(
          (
            manga,
            index
          ) => (
            <MangaCard
              key={manga.id}
              manga={manga}
              priority={
                index < 6
              }
            />
          )
        )}
      </section>

      {totalPages > 1 && (
        <div className="tag-pagination">
          <Pagination
            currentPage={
              currentPage
            }
            totalPages={
              totalPages
            }
            basePath={
              `/tag/${tag.slug}`
            }
            searchParams={
              paginationParams
            }
          />
        </div>
      )}

      <style>{`
        .tag-page {
          width: 100%;
          max-width: 1280px;
          margin: 0 auto;
          padding: 32px 16px 56px;
        }

        .tag-back-link {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          margin-bottom: 20px;
          color: rgba(150, 142, 134, 0.72);
          font-size: 13px;
          text-decoration: none;
          transition: color 150ms ease;
        }

        .tag-back-link:hover {
          color: #c4956a;
        }

        .tag-header {
          margin-bottom: 24px;
        }

        .tag-namespace {
          margin: 0 0 6px;
          color: #7198df;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .tag-header h1 {
          margin: 0 0 6px;
          color: #f0ece8;
          font-size: 28px;
          font-weight: 800;
          letter-spacing: -0.025em;
        }

        .tag-total {
          margin: 0;
          color: rgba(160, 152, 144, 0.58);
          font-size: 13px;
        }

        .tag-sort {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 24px;
          padding: 12px 16px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.02);
        }

        .tag-sort-label {
          margin-right: 4px;
          color: rgba(150, 142, 134, 0.75);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .tag-sort-option {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 32px;
          padding: 6px 14px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.04);
          color: rgba(190, 182, 174, 0.9);
          font-size: 13px;
          font-weight: 500;
          text-decoration: none;
          transition:
            background 150ms ease,
            border-color 150ms ease,
            color 150ms ease;
        }

        .tag-sort-option:hover {
          border-color: rgba(196, 149, 106, 0.42);
          color: #ffffff;
        }

        .tag-sort-option.active {
          border-color: #c4956a;
          background: #c4956a;
          color: #0c0c12;
          font-weight: 700;
        }

        .tag-sort-option.popular.active {
          border-color: #3d5a9e;
          background: #3d5a9e;
          color: #ffffff;
        }

        .tag-page-grid {
          display: grid;
          grid-template-columns:
            repeat(6, minmax(0, 1fr));
          gap: 10px;
          margin-bottom: 40px;
        }

        .tag-pagination {
          display: flex;
          justify-content: center;
          margin-top: 12px;
        }

        @media (max-width: 1024px) {
          .tag-page-grid {
            grid-template-columns:
              repeat(4, minmax(0, 1fr));
          }
        }

        @media (max-width: 640px) {
          .tag-page {
            padding-top: 24px;
          }

          .tag-header h1 {
            font-size: 25px;
          }

          .tag-sort {
            gap: 7px;
            padding: 12px;
          }

          .tag-sort-label {
            width: 100%;
            margin-bottom: 2px;
          }

          .tag-sort-option {
            padding: 6px 12px;
            font-size: 12px;
          }

          .tag-page-grid {
            grid-template-columns:
              repeat(3, minmax(0, 1fr));
          }
        }

        @media (max-width: 480px) {
          .tag-page-grid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
            gap: 10px;
          }
        }
      `}</style>
    </main>
  )
}