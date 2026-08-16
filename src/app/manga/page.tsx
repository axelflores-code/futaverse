import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAllCategories } from '@/lib/queries/categories'
import { getAllTags } from '@/lib/queries/tag'
import { MangaCatalog } from '@/components/manga/MangaCatalog'
import { Pagination } from '@/components/ui/Pagination'
import type { Manga } from '@/types/manga'

export const revalidate = 900

const PAGE_SIZE = 24
const POPULAR_LIMIT = 10000

type CatalogOrder =
  | 'recent'
  | 'popular'
  | 'rating'
  | 'oldest'

type PopularPeriod =
  | 'today'
  | 'week'
  | 'month'
  | 'all'

interface PageProps {
  searchParams: Promise<{
    page?: string
    order?: string
    period?: string
    category?: string
    tag?: string
  }>
}

interface PopularRow {
  manga_id: string
  view_count: number
}

interface MangaRelationRow {
  manga_id: string
}

function parsePage(value?: string): number {
  const parsed = Number.parseInt(value ?? '1', 10)

  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1
  }

  return parsed
}

function parseOrder(value?: string): CatalogOrder {
  const validOrders: CatalogOrder[] = [
    'recent',
    'popular',
    'rating',
    'oldest',
  ]

  if (
    value &&
    validOrders.includes(value as CatalogOrder)
  ) {
    return value as CatalogOrder
  }

  return 'recent'
}

function parsePeriod(value?: string): PopularPeriod {
  const validPeriods: PopularPeriod[] = [
    'today',
    'week',
    'month',
    'all',
  ]

  if (
    value &&
    validPeriods.includes(value as PopularPeriod)
  ) {
    return value as PopularPeriod
  }

  return 'today'
}

function mapManga(
  manga: Record<string, unknown>
): Manga {
  return {
    id: manga.id as string,
    slug: manga.slug as string,
    title: manga.title as string,
    alternativeTitles: [],
    description: manga.description as string | null,
    coverUrl: manga.cover_url as string | null,
    status: manga.status as Manga['status'],
    rating: manga.rating as Manga['rating'],
    score: Number(manga.score ?? 0),
    views: BigInt(
      Number(manga.views ?? 0)
    ),
    author: manga.author as string | null,
    artist: null,

    genres: (
      (manga.manga_genres as Array<{
        genres: {
          id: string
          name: string
          slug: string
        }
      }>) ?? []
    )
      .map((item) => item.genres)
      .filter(Boolean),

    createdAt: manga.created_at as string,
    updatedAt: manga.updated_at as string,
  }
}

/*
 * Obtiene los IDs que coinciden con una categoría
 * y/o un tag. Los dos filtros se combinan mediante AND.
 */
async function getFilteredMangaIds(
  categorySlug?: string,
  tagSlug?: string
): Promise<string[] | null> {
  if (!categorySlug && !tagSlug) {
    return null
  }

  const supabase = await createClient()

  let categoryIds: string[] | null = null
  let tagIds: string[] | null = null

  if (categorySlug) {
    const { data: category } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', categorySlug)
      .maybeSingle()

    if (!category) {
      return []
    }

    const { data: relations, error } =
      await supabase
        .from('manga_categories')
        .select('manga_id')
        .eq('category_id', category.id)
        .limit(10000)

    if (error) {
      console.error(
        'Error filtrando categoría:',
        error.message
      )
      return []
    }

    categoryIds = (
      (relations ?? []) as MangaRelationRow[]
    ).map((relation) => relation.manga_id)
  }

  if (tagSlug) {
    const { data: tag } = await supabase
      .from('tags')
      .select('id')
      .eq('slug', tagSlug)
      .maybeSingle()

    if (!tag) {
      return []
    }

    const { data: relations, error } =
      await supabase
        .from('manga_tags')
        .select('manga_id')
        .eq('tag_id', tag.id)
        .limit(10000)

    if (error) {
      console.error(
        'Error filtrando tag:',
        error.message
      )
      return []
    }

    tagIds = (
      (relations ?? []) as MangaRelationRow[]
    ).map((relation) => relation.manga_id)
  }

  if (categoryIds && tagIds) {
    const tagSet = new Set(tagIds)

    return categoryIds.filter((id) =>
      tagSet.has(id)
    )
  }

  return categoryIds ?? tagIds ?? []
}

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const params = await searchParams

  const currentPage = parsePage(params.page)
  const order = parseOrder(params.order)
  const period = parsePeriod(params.period)

  const hasCatalogVariant =
    params.order !== undefined ||
    params.period !== undefined ||
    params.category !== undefined ||
    params.tag !== undefined

  const canonical =
    !hasCatalogVariant && currentPage > 1
      ? `/manga?page=${currentPage}`
      : '/manga'

  let sectionName = 'Catálogo de manga futanari'

  if (order === 'popular') {
    const periodLabels: Record<
      PopularPeriod,
      string
    > = {
      today: 'populares hoy',
      week: 'populares esta semana',
      month: 'populares este mes',
      all: 'más populares',
    }

    sectionName =
      `Mangas ${periodLabels[period]}`
  }

  if (order === 'rating') {
    sectionName = 'Mangas mejor valorados'
  }

  if (order === 'oldest') {
    sectionName = 'Mangas antiguos'
  }

  const pageText =
    currentPage > 1
      ? ` — Página ${currentPage}`
      : ''

  const title =
    `${sectionName} en español${pageText}`

  const description =
    'Explora doujinshis y mangas para adultos traducidos al español. Encuentra publicaciones recientes, populares y mejor valoradas en MangaFuta.'

  return {
    title,
    description,

    alternates: {
      canonical,
    },

    robots: {
      index: !hasCatalogVariant,
      follow: true,

      googleBot: {
        index: !hasCatalogVariant,
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
          alt: 'Catálogo de MangaFuta',
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

export default async function CatalogPage({
  searchParams,
}: PageProps) {
  const params = await searchParams

  const currentPage = parsePage(params.page)
  const order = parseOrder(params.order)
  const period = parsePeriod(params.period)

  const activeCategory =
    params.category?.trim() || undefined

  const activeTag =
    params.tag?.trim() || undefined

  const from =
    (currentPage - 1) * PAGE_SIZE

  const to =
    from + PAGE_SIZE - 1

  const supabase = await createClient()

  const allowedIds =
    await getFilteredMangaIds(
      activeCategory,
      activeTag
    )

  let mangas: Manga[] = []
  let total = 0

  const noFilterResults =
    allowedIds !== null &&
    allowedIds.length === 0

  if (!noFilterResults) {
    /*
     * Popularidad de hoy, semana y mes:
     * se obtiene desde manga_views.
     */
    if (
      order === 'popular' &&
      period !== 'all'
    ) {
      const { data: popularRaw, error } =
        await supabase.rpc(
          'get_popular_mangas',
          {
            p_period: period,
            p_limit: POPULAR_LIMIT,
          }
        )

      if (error) {
        console.error(
          'Error obteniendo mangas populares:',
          error.message
        )
      }

      let popularRows =
        (popularRaw ?? []) as PopularRow[]

      if (allowedIds !== null) {
        const allowedSet =
          new Set(allowedIds)

        popularRows = popularRows.filter(
          (row) =>
            allowedSet.has(row.manga_id)
        )
      }

      total = popularRows.length

      const pageRows =
        popularRows.slice(from, to + 1)

      const pageIds =
        pageRows.map((row) => row.manga_id)

      if (pageIds.length > 0) {
        const { data: mangasRaw, error } =
          await supabase
            .from('mangas')
            .select(`
              *,
              manga_genres (
                genres (
                  id,
                  name,
                  slug
                )
              )
            `)
            .in('id', pageIds)
            .neq('status', 'draft')

        if (error) {
          console.error(
            'Error cargando mangas populares:',
            error.message
          )
        }

        const orderPositions =
          new Map(
            pageIds.map((id, index) => [
              id,
              index,
            ])
          )

        const sorted = (
          (mangasRaw ?? []) as Array<
            Record<string, unknown>
          >
        ).sort((first, second) => {
          const firstPosition =
            orderPositions.get(
              first.id as string
            ) ?? 999999

          const secondPosition =
            orderPositions.get(
              second.id as string
            ) ?? 999999

          return (
            firstPosition -
            secondPosition
          )
        })

        mangas = sorted.map(mapManga)
      }
    } else {
      /*
       * Recientes, antiguos, mejores valorados
       * y populares de todos los tiempos.
       */
      const sortColumn =
        order === 'rating'
          ? 'score'
          : order === 'oldest'
            ? 'created_at'
            : order === 'popular'
              ? 'views'
              : 'updated_at'

      const ascending =
        order === 'oldest'

      let query = supabase
        .from('mangas')
        .select(
          `
            *,
            manga_genres (
              genres (
                id,
                name,
                slug
              )
            )
          `,
          {
            count: 'exact',
          }
        )
        .neq('status', 'draft')

      if (allowedIds !== null) {
        query = query.in(
          'id',
          allowedIds
        )
      }

      query = query
        .order(sortColumn, {
          ascending,
          nullsFirst: false,
        })
        .order('updated_at', {
          ascending: false,
        })
        .range(from, to)

      const {
        data: mangasRaw,
        count,
        error,
      } = await query

      if (error) {
        console.error(
          'Error cargando el catálogo:',
          error.message
        )
      }

      total = count ?? 0

      mangas = (
        (mangasRaw ?? []) as Array<
          Record<string, unknown>
        >
      ).map(mapManga)
    }
  }

  const totalPages =
    Math.ceil(total / PAGE_SIZE)

  if (
    currentPage > 1 &&
    (
      totalPages === 0 ||
      currentPage > totalPages
    )
  ) {
    notFound()
  }

  const [categories, tags] =
    await Promise.all([
      getAllCategories(),
      getAllTags(),
    ])

  const paginationParams: Record<
    string,
    string
  > = {}

  if (order !== 'recent') {
    paginationParams.order = order
  }

  if (order === 'popular') {
    paginationParams.period = period
  }

  if (activeCategory) {
    paginationParams.category =
      activeCategory
  }

  if (activeTag) {
    paginationParams.tag = activeTag
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <header
        style={{
          marginBottom: '22px',
        }}
      >
        <h1
          style={{
            marginBottom: '6px',
            color: '#f0ece8',
            fontSize: '26px',
            fontWeight: 800,
          }}
        >
          Disfruta toda nuestra colección de manga futa
        </h1>

        <p
          style={{
            color:
              'rgba(160,152,144,0.6)',
            fontSize: '13px',
          }}
        >
          Explora {total.toLocaleString()}{' '}
          título{total !== 1 ? 's' : ''} en
          español.
        </p>
      </header>

      <MangaCatalog
        initialMangas={mangas}
        categories={categories}
        tags={tags}
        total={total}
        order={order}
        period={period}
        activeCategory={activeCategory}
        activeTag={activeTag}
      />

      {totalPages > 1 && (
        <div className="mt-10 flex justify-center">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            basePath="/manga"
            searchParams={paginationParams}
          />
        </div>
      )}
    </div>
  )
}