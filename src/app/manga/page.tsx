import type { Metadata } from 'next'
import { unstable_cache } from 'next/cache'
import { notFound } from 'next/navigation'
import { createPublicClient } from '@/lib/supabase/public'
import { getAllCategories } from '@/lib/queries/categories'
import { getAllTags } from '@/lib/queries/tag'
import { MangaCatalog } from '@/components/manga/MangaCatalog'
import { Pagination } from '@/components/ui/Pagination'
import type { Manga } from '@/types/manga'

export const revalidate = 900

const PAGE_SIZE = 24
const DATABASE_BATCH_SIZE = 1000
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

interface RawMangaRow extends Record<string, unknown> {
  id: string
  slug: string
  title: string
  description: string | null
  cover_url: string | null
  status: string
  rating: string
  score: number | null
  views: number | string | null
  author: string | null
  created_at: string
  updated_at: string
  manga_genres?: Array<{
    genres: {
      id: string
      name: string
      slug: string
    } | null
  }>
}

interface CatalogResult {
  rows: RawMangaRow[]
  total: number
}

const MANGA_SELECT = `
  id,
  slug,
  title,
  description,
  cover_url,
  status,
  rating,
  score,
  views,
  author,
  created_at,
  updated_at,
  manga_genres (
    genres (
      id,
      name,
      slug
    )
  )
`

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

function mapManga(manga: RawMangaRow): Manga {
  return {
    id: manga.id,
    slug: manga.slug,
    title: manga.title,
    alternativeTitles: [],
    description: manga.description,
    coverUrl: manga.cover_url,
    status: manga.status as Manga['status'],
    rating: manga.rating as Manga['rating'],
    score: Number(manga.score ?? 0),
    views: BigInt(
      Math.max(
        0,
        Math.trunc(Number(manga.views ?? 0))
      )
    ),
    author: manga.author,
    artist: null,

    genres: (manga.manga_genres ?? [])
      .map((item) => item.genres)
      .filter(
        (
          genre
        ): genre is {
          id: string
          name: string
          slug: string
        } => Boolean(genre)
      ),

    createdAt: manga.created_at,
    updatedAt: manga.updated_at,
  }
}

/*
 * Devuelve todos los mangas publicados que pueden
 * participar en el ranking de popularidad.
 *
 * La consulta se pagina para no depender del límite
 * de 1000 filas de Supabase.
 */
async function getCandidateMangaIds(
  categoryId?: string,
  tagId?: string
): Promise<Set<string>> {
  const supabase = createPublicClient()

  const ids = new Set<string>()
  let offset = 0

  while (true) {
    let select = 'id'

    if (categoryId) {
      select += `,
        manga_categories!inner (
          category_id
        )
      `
    }

    if (tagId) {
      select += `,
        manga_tags!inner (
          tag_id
        )
      `
    }

    let query = supabase
      .from('mangas')
      .select(select)
      .neq('status', 'draft')

    if (categoryId) {
      query = query.eq(
        'manga_categories.category_id',
        categoryId
      )
    }

    if (tagId) {
      query = query.eq(
        'manga_tags.tag_id',
        tagId
      )
    }

    const { data, error } = await query
      .order('id', { ascending: true })
      .range(
        offset,
        offset + DATABASE_BATCH_SIZE - 1
      )

    if (error) {
      throw new Error(
        `Error obteniendo mangas permitidos: ${error.message}`
      )
    }

    const rows = (data ?? []) as unknown as Array<{
  id: string
}>

    rows.forEach((row) => {
      ids.add(row.id)
    })

    if (rows.length < DATABASE_BATCH_SIZE) {
      break
    }

    offset += DATABASE_BATCH_SIZE
  }

  return ids
}

/*
 * Toda la consulta del catálogo queda cacheada durante
 * 15 minutos. Los argumentos forman parte de la clave.
 */
const getCatalogPage = unstable_cache(
  async (
    currentPage: number,
    order: CatalogOrder,
    period: PopularPeriod,
    categorySlug: string,
    tagSlug: string
  ): Promise<CatalogResult> => {
    const supabase = createPublicClient()

    const categoryFilter =
      categorySlug || undefined

    const tagFilter =
      tagSlug || undefined

    let categoryId: string | undefined
    let tagId: string | undefined

    /*
     * Resolvemos los slugs una sola vez.
     */
    if (categoryFilter) {
      const {
        data: category,
        error,
      } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', categoryFilter)
        .maybeSingle()

      if (error) {
        throw new Error(
          `Error buscando categoría: ${error.message}`
        )
      }

      if (!category) {
        return {
          rows: [],
          total: 0,
        }
      }

      categoryId = category.id
    }

    if (tagFilter) {
      const {
        data: tag,
        error,
      } = await supabase
        .from('tags')
        .select('id')
        .eq('slug', tagFilter)
        .maybeSingle()

      if (error) {
        throw new Error(
          `Error buscando tag: ${error.message}`
        )
      }

      if (!tag) {
        return {
          rows: [],
          total: 0,
        }
      }

      tagId = tag.id
    }

    const from =
      (currentPage - 1) * PAGE_SIZE

    const to =
      from + PAGE_SIZE - 1

    /*
     * Popularidad por periodo.
     *
     * El RPC devuelve el ranking y luego solamente
     * consultamos los 24 mangas de la página actual.
     */
    if (
      order === 'popular' &&
      period !== 'all'
    ) {
      const candidateIds =
        await getCandidateMangaIds(
          categoryId,
          tagId
        )

      if (candidateIds.size === 0) {
        return {
          rows: [],
          total: 0,
        }
      }

      const {
        data: popularRaw,
        error: popularError,
      } = await supabase.rpc(
        'get_popular_mangas',
        {
          p_period: period,
          p_limit: POPULAR_LIMIT,
        }
      )

      if (popularError) {
        throw new Error(
          `Error obteniendo mangas populares: ${popularError.message}`
        )
      }

      const seenIds = new Set<string>()

      const popularRows = (
        (popularRaw ?? []) as PopularRow[]
      ).filter((row) => {
        const mangaId = String(row.manga_id)

        if (
          !candidateIds.has(mangaId) ||
          seenIds.has(mangaId)
        ) {
          return false
        }

        seenIds.add(mangaId)
        return true
      })

      const total = popularRows.length

      const pageIds = popularRows
        .slice(from, to + 1)
        .map((row) => String(row.manga_id))

      if (pageIds.length === 0) {
        return {
          rows: [],
          total,
        }
      }

      const {
        data: mangasRaw,
        error: mangasError,
      } = await supabase
        .from('mangas')
        .select(MANGA_SELECT)
        .in('id', pageIds)
        .neq('status', 'draft')

      if (mangasError) {
        throw new Error(
          `Error cargando mangas populares: ${mangasError.message}`
        )
      }

      /*
       * Supabase no conserva el orden del array usado
       * en .in(), por eso restauramos el ranking.
       */
      const positions = new Map(
        pageIds.map((id, index) => [
          id,
          index,
        ])
      )

      const rows = (
  (mangasRaw ?? []) as unknown as RawMangaRow[]
).sort((first, second) => {
        const firstPosition =
          positions.get(first.id) ??
          Number.MAX_SAFE_INTEGER

        const secondPosition =
          positions.get(second.id) ??
          Number.MAX_SAFE_INTEGER

        return firstPosition - secondPosition
      })

      return {
        rows,
        total,
      }
    }

    /*
     * Recientes, antiguos, mejor valorados y
     * populares de todos los tiempos.
     *
     * Los filtros se realizan mediante relaciones
     * internas. Ya no descargamos miles de IDs ni
     * construimos una URL gigante con .in().
     */
    let select = MANGA_SELECT

    if (categoryId) {
      select += `,
        manga_categories!inner (
          category_id
        )
      `
    }

    if (tagId) {
      select += `,
        manga_tags!inner (
          tag_id
        )
      `
    }

    let query = supabase
      .from('mangas')
      .select(select, {
        count: 'exact',
      })
      .neq('status', 'draft')

    if (categoryId) {
      query = query.eq(
        'manga_categories.category_id',
        categoryId
      )
    }

    if (tagId) {
      query = query.eq(
        'manga_tags.tag_id',
        tagId
      )
    }

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

    query = query.order(sortColumn, {
      ascending,
      nullsFirst: false,
    })

    /*
     * Desempate estable para evitar que un manga
     * cambie de página cuando dos valores coinciden.
     */
    if (sortColumn !== 'updated_at') {
      query = query.order('updated_at', {
        ascending: false,
        nullsFirst: false,
      })
    }

    query = query.order('id', {
      ascending: true,
    })

    const {
      data: mangasRaw,
      count,
      error,
    } = await query.range(from, to)

    if (error) {
      throw new Error(
        `Error cargando el catálogo: ${error.message}`
      )
    }

    return {
      rows:
  (mangasRaw ?? []) as unknown as RawMangaRow[],
      total: count ?? 0,
    }
  },
  ['manga-catalog-v2'],
  {
    revalidate: 900,
    tags: ['manga-catalog'],
  }
)

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const params = await searchParams

  const currentPage =
    parsePage(params.page)

  const order =
    parseOrder(params.order)

  const period =
    parsePeriod(params.period)

  /*
   * Los filtros y órdenes alternativos son páginas
   * de navegación. Google puede seguir sus enlaces,
   * pero no necesita indexarlas.
   */
  const hasCatalogVariant =
    params.order !== undefined ||
    params.period !== undefined ||
    params.category !== undefined ||
    params.tag !== undefined

  const canonical =
    !hasCatalogVariant && currentPage > 1
      ? `/manga?page=${currentPage}`
      : '/manga'

  let sectionName =
    'Catálogo de manga futa'

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
    sectionName =
      'Mangas mejor valorados'
  }

  if (order === 'oldest') {
    sectionName =
      'Mangas antiguos'
  }

  const pageText =
    currentPage > 1
      ? ` — Página ${currentPage}`
      : ''

  const title =
    `${sectionName} en español${pageText}`

  const description =
    'Explora mangas y doujinshis futa para adultos traducidos al español. Encuentra publicaciones recientes, populares y mejor valoradas en MangaFuta.'

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

  const currentPage =
    parsePage(params.page)

  const order =
    parseOrder(params.order)

  const period =
    parsePeriod(params.period)

  const activeCategory =
    params.category?.trim() || undefined

  const activeTag =
    params.tag?.trim() || undefined

  const {
    rows,
    total,
  } = await getCatalogPage(
    currentPage,
    order,
    period,
    activeCategory ?? '',
    activeTag ?? ''
  )

  /*
   * BigInt no debe guardarse dentro del caché de
   * Next.js. La conversión se realiza después.
   */
  const mangas =
    rows.map(mapManga)

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
    paginationParams.tag =
      activeTag
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
          Explora nuestra colección de manga futa
        </h1>

        <p
          style={{
            color:
              'rgba(160,152,144,0.6)',
            fontSize: '13px',
          }}
        >
          Explora {total.toLocaleString('es-ES')}{' '}
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