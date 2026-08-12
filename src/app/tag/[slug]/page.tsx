import type { Metadata } from 'next'
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { MangaCard } from '@/components/manga/MangaCard'
import { Pagination } from '@/components/ui/Pagination'
import Link from 'next/link'
import type { Manga } from '@/types/manga'

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{
    page?: string
    sort?: string
  }>
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
  views: number
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
}

interface MangaTagRow {
  manga_id: string
}

const PAGE_SIZE = 24

const NS_LABELS: Record<string, string> = {
  theme: 'Tema',
  trope: 'Tropo',
  setting: 'Ambientación',
  format: 'Formato',
  content_warning: 'Advertencia de contenido',
}

const SORT_OPTIONS = [
  { value: 'recent', label: 'Recientes' },
  { value: 'oldest', label: 'Más antiguos' },
  { value: 'popular', label: 'Populares' },
  { value: 'score', label: 'Mejor score' },
]

const VALID_SORTS = new Set([
  'recent',
  'oldest',
  'popular',
  'score',
])

const getTag = cache(async (slug: string) => {
  const supabase = await createClient()

  const { data: tag } = await supabase
    .from('tags')
    .select('id, name, slug, namespace')
    .eq('slug', slug)
    .maybeSingle()

  return tag
})

export async function generateMetadata({
  params,
  searchParams,
}: PageProps): Promise<Metadata> {
  const { slug } = await params
  const {
    page: pageParam,
    sort: sortParam,
  } = await searchParams

  const parsedPage = Number.parseInt(pageParam ?? '1', 10)

  const currentPage =
    Number.isFinite(parsedPage) && parsedPage > 0
      ? parsedPage
      : 1

  const tag = await getTag(slug)

  if (!tag) {
    return {
      title: 'Etiqueta no encontrada',
      robots: {
        index: false,
        follow: false,
      },
    }
  }

  const basePath = `/tag/${tag.slug}`

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
    `Explora títulos y capítulos disponibles gratis en MangaFuta.`

  /*
   * Las variantes con ?sort=popular, ?sort=score, etc.
   * son páginas duplicadas. Google puede seguir sus enlaces,
   * pero no debe indexarlas individualmente.
   */
  const shouldIndex = !sortParam

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
        'max-image-preview': 'large',
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
          alt: `Mangas de ${tag.name} en MangaFuta`,
        },
      ],
    },

    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/og-image.jpg'],
    },
  }
}

export default async function TagPage({
  params,
  searchParams,
}: PageProps) {
  const { slug } = await params

  const {
    page: pageParam,
    sort: sortParam,
  } = await searchParams

  const parsedPage = Number.parseInt(pageParam ?? '1', 10)

  const currentPage =
    Number.isFinite(parsedPage) && parsedPage > 0
      ? parsedPage
      : 1

  const sort =
    sortParam && VALID_SORTS.has(sortParam)
      ? sortParam
      : 'recent'

  const from = (currentPage - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const supabase = await createClient()
  const tag = await getTag(slug)

  if (!tag) {
    notFound()
  }

  const orderCol =
    sort === 'popular'
      ? 'views'
      : sort === 'score'
        ? 'score'
        : sort === 'oldest'
          ? 'created_at'
          : 'updated_at'

  const ascending = sort === 'oldest'

  const {
    data: mangaTagIds,
    count,
  } = await supabase
    .from('manga_tags')
    .select('manga_id', { count: 'exact' })
    .eq('tag_id', tag.id)

  const total = count ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  if (
    currentPage > 1 &&
    (totalPages === 0 || currentPage > totalPages)
  ) {
    notFound()
  }

  const ids = (
    (mangaTagIds ?? []) as MangaTagRow[]
  ).map((item) => item.manga_id)

  let mangas: Manga[] = []

  if (ids.length > 0) {
    const { data: mangasRaw } = await supabase
      .from('mangas')
      .select(
        '*, manga_genres(genres(id, name, slug))'
      )
      .in('id', ids)
      .order(orderCol, { ascending })
      .range(from, to)

    mangas = (
      (mangasRaw ?? []) as MangaRow[]
    ).map((manga) => ({
      id: manga.id,
      slug: manga.slug,
      title: manga.title,
      coverUrl: manga.cover_url,
      status: manga.status as Manga['status'],
      score: manga.score,
      rating: manga.rating as Manga['rating'],
      description: manga.description,
      views: BigInt(manga.views),
      author: manga.author,
      artist: null,
      alternativeTitles: [],
      genres: (manga.manga_genres ?? []).map(
        (item) => item.genres
      ),
      createdAt: manga.created_at,
      updatedAt: manga.updated_at,
    }))
  }

  return (
    <div
      style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '32px 16px',
      }}
    >
      <Link
        href="/manga"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '13px',
          color: 'rgba(96,88,80,1)',
          textDecoration: 'none',
          marginBottom: '20px',
        }}
      >
        <svg
          width="12"
          height="12"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 19l-7-7 7-7"
          />
        </svg>

        Catálogo
      </Link>

      <div style={{ marginBottom: '24px' }}>
        <p
          style={{
            fontSize: '11px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '.08em',
            color: '#3D5A9E',
            marginBottom: '6px',
          }}
        >
          {NS_LABELS[tag.namespace] ?? tag.namespace}
        </p>

        <h1
          style={{
            fontSize: '28px',
            fontWeight: 800,
            color: '#f0ece8',
            marginBottom: '6px',
          }}
        >
          {tag.name}
        </h1>

        <p
          style={{
            fontSize: '13px',
            color: 'rgba(160,152,144,0.5)',
          }}
        >
          {total.toLocaleString()} manga
          {total !== 1 ? 's' : ''}
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap',
          marginBottom: '24px',
          padding: '12px 16px',
          background: 'rgba(255,255,255,0.02)',
          borderRadius: '10px',
          border: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <span
          style={{
            fontSize: '11px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '.06em',
            color: 'rgba(96,88,80,1)',
            marginRight: '4px',
          }}
        >
          Ordenar:
        </span>

        {SORT_OPTIONS.map((option) => (
          <Link
            key={option.value}
            href={`/tag/${slug}?sort=${option.value}`}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight:
                sort === option.value ? 600 : 400,
              textDecoration: 'none',
              transition: 'all .15s',

              background:
                sort === option.value
                  ? option.value === 'popular'
                    ? '#3D5A9E'
                    : '#C4956A'
                  : 'rgba(255,255,255,0.04)',

              border: `1px solid ${
                sort === option.value
                  ? option.value === 'popular'
                    ? '#3D5A9E'
                    : '#C4956A'
                  : 'rgba(255,255,255,0.08)'
              }`,

              color:
                sort === option.value
                  ? '#0c0c12'
                  : 'rgba(175,167,158,1)',
            }}
          >
            {option.label}
          </Link>
        ))}
      </div>

      {mangas.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 0',
            color: 'rgba(160,152,144,0.4)',
            fontSize: '14px',
          }}
        >
          No hay mangas con el tag &quot;{tag.name}&quot;
          todavía.
        </div>
      ) : (
        <>
          <div
            className="tag-page-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(6, 1fr)',
              gap: '10px',
              marginBottom: '40px',
            }}
          >
            {mangas.map((manga, index) => (
              <MangaCard
                key={manga.id}
                manga={manga}
                priority={index < 6}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                basePath={`/tag/${slug}`}
                searchParams={{ sort }}
              />
            </div>
          )}
        </>
      )}

      <style>{`
        @media (max-width: 1024px) {
          .tag-page-grid {
            grid-template-columns: repeat(4, 1fr) !important;
          }
        }

        @media (max-width: 640px) {
          .tag-page-grid {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }

        @media (max-width: 480px) {
          .tag-page-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>
    </div>
  )
}