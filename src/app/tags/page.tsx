import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { unstable_cache } from 'next/cache'
import { createPublicClient } from '@/lib/supabase/public'
import { Pagination } from '@/components/ui/Pagination'
import Link from 'next/link'

export const revalidate = 3600

const PAGE_SIZE = 120

type TagOrder = 'popular' | 'az'

interface PageProps {
  searchParams: Promise<{
    sort?: string
    page?: string
  }>
}

interface TagRow {
  id: string
  name: string
  slug: string
  usage_count: number
}

interface CachedTagsResult {
  tags: TagRow[]
  total: number
}

const getTagsPage = unstable_cache(
  async (
    sort: TagOrder,
    currentPage: number
  ): Promise<CachedTagsResult> => {
    const from =
      (currentPage - 1) * PAGE_SIZE

    const to =
      from + PAGE_SIZE - 1

    const supabase =
      createPublicClient()

    let query = supabase
      .from('tags')
      .select(
        'id, name, slug, usage_count',
        {
          count: 'exact',
        }
      )
      .gte('usage_count', 2)

    if (sort === 'popular') {
      query = query
        .order('usage_count', {
          ascending: false,
        })
        .order('name', {
          ascending: true,
        })
    } else {
      query = query.order('name', {
        ascending: true,
      })
    }

    const {
      data,
      count,
      error,
    } = await query.range(from, to)

    if (error) {
      throw new Error(
        `Error cargando tags: ${error.message}`
      )
    }

    return {
      tags: (data ?? []) as TagRow[],
      total: count ?? 0,
    }
  },
  ['mangafuta-tags-index-v1'],
  {
    revalidate: 3600,
    tags: ['mangafuta-tags'],
  }
)

function parsePage(value?: string): number {
  const parsed = Number.parseInt(value ?? '1', 10)

  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1
  }

  return parsed
}

function parseSort(value?: string): TagOrder {
  return value === 'az' ? 'az' : 'popular'
}

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const params = await searchParams
  const page = parsePage(params.page)
  const sort = parseSort(params.sort)

  const hasVariant =
    params.sort !== undefined ||
    page > 1

  const title =
    sort === 'az'
      ? 'Tags de manga futa de la A a la Z'
      : 'Tags populares de manga futa'

  const description =
    'Explora todos los tags de manga futa en español disponibles en MangaFuta.'

  return {
    title:
      page > 1
        ? `${title} — Página ${page}`
        : title,

    description,

    alternates: {
      canonical: '/tags',
    },

    robots: {
      index: !hasVariant,
      follow: true,

      googleBot: {
        index: !hasVariant,
        follow: true,
        'max-snippet': -1,
      },
    },

    openGraph: {
      type: 'website',
      locale: 'es_ES',
      siteName: 'MangaFuta',
      title,
      description,
      url: '/tags',
      images: [
        {
          url: '/og-image.jpg',
          width: 1200,
          height: 630,
          alt: 'Tags de MangaFuta',
        },
      ],
    },
  }
}

export default async function TagsPage({
  searchParams,
}: PageProps) {
  const params = await searchParams

  const currentPage = parsePage(params.page)
  const sort = parseSort(params.sort)

  const {
  tags,
  total,
} = await getTagsPage(
  sort,
  currentPage
)

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

  const paginationParams: Record<
    string,
    string
  > = {}

  if (sort === 'az') {
    paginationParams.sort = 'az'
  }

  return (
    <main className="tags-page">
      <header className="tags-header">
        <h1>Tags</h1>

        <p>
          Explora {total.toLocaleString()} tags
          de manga futa en español
        </p>
      </header>

      <nav
        aria-label="Ordenar tags"
        className="tags-order"
      >
        <Link
          href="/tags"
          className={
            sort === 'popular'
              ? 'active'
              : ''
          }
        >
          Popular
        </Link>

        <Link
          href="/tags?sort=az"
          className={
            sort === 'az'
              ? 'active'
              : ''
          }
        >
          A–Z
        </Link>
      </nav>

      {tags.length === 0 ? (
        <div className="tags-empty">
          No hay tags disponibles.
        </div>
      ) : (
        <section
          aria-label="Lista de tags"
          className="tags-panel"
        >
          <div className="tags-columns">
            {tags.map((tag) => (
              <Link
                key={tag.id}
                href={`/tag/${tag.slug}`}
                className="tag-row"
              >
                <span className="tag-name">
                  {tag.name}
                </span>

                <span className="tag-count">
                  {tag.usage_count >= 1000
                    ? `${(
                        tag.usage_count / 1000
                      ).toFixed(1)}k`
                    : tag.usage_count}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {totalPages > 1 && (
        <div className="tags-pagination">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            basePath="/tags"
            searchParams={paginationParams}
          />
        </div>
      )}

      <style>{`
        .tags-page {
          width: 100%;
          max-width: 1260px;
          margin: 0 auto;
          padding: 38px 16px 56px;
        }

        .tags-header {
          margin-bottom: 18px;
          text-align: center;
        }

        .tags-header h1 {
          margin-bottom: 5px;
          color: #f5f1ed;
          font-size: 30px;
          font-weight: 900;
          letter-spacing: -0.025em;
        }

        .tags-header p {
          color: rgba(175, 167, 158, 0.62);
          font-size: 13px;
        }

        .tags-order {
          display: flex;
          justify-content: center;
          margin-bottom: 22px;
        }

        .tags-order a {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 44px;
          padding: 9px 16px;
          background: #16161b;
          color: rgba(225, 220, 215, 0.78);
          font-size: 15px;
          font-weight: 700;
          text-decoration: none;
          transition:
            background 150ms ease,
            color 150ms ease;
        }

        .tags-order a:first-child {
          border-radius: 6px 0 0 6px;
        }

        .tags-order a:last-child {
          border-radius: 0 6px 6px 0;
        }

        .tags-order a:hover {
          background: #29282b;
          color: white;
        }

        .tags-order a.active {
          background: #464446;
          color: white;
        }

        .tags-panel {
          padding: 12px;
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 7px;
          background: #1b1b20;
        }

        .tags-columns {
          columns: 6;
          column-gap: 14px;
        }

        .tag-row {
          display: flex;
          align-items: stretch;
          width: 100%;
          min-height: 27px;
          margin-bottom: 3px;
          break-inside: avoid;
          overflow: hidden;
          border-radius: 3px;
          color: white;
          text-decoration: none;
          transition:
            transform 120ms ease,
            filter 120ms ease;
        }

        .tag-row:hover {
          z-index: 2;
          filter: brightness(1.14);
          transform: translateX(2px);
        }

        .tag-name {
          display: flex;
          flex: 1;
          align-items: center;
          min-width: 0;
          padding: 4px 7px;
          overflow: hidden;
          background: #565658;
          color: #fff;
          font-size: 12px;
          line-height: 1.2;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .tag-count {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          min-width: 42px;
          padding: 4px 6px;
          background: #2d2d31;
          color: #f0ece8;
          font-size: 11px;
          font-variant-numeric: tabular-nums;
        }

        .tags-pagination {
          display: flex;
          justify-content: center;
          margin-top: 28px;
        }

        .tags-empty {
          padding: 70px 16px;
          text-align: center;
          color: rgba(175, 167, 158, 0.6);
        }

        @media (max-width: 1100px) {
          .tags-columns {
            columns: 5;
          }
        }

        @media (max-width: 900px) {
          .tags-columns {
            columns: 4;
          }
        }

        @media (max-width: 700px) {
          .tags-columns {
            columns: 3;
          }
        }

        @media (max-width: 480px) {
          .tags-page {
            padding-top: 28px;
          }

          .tags-header h1 {
            font-size: 26px;
          }

          .tags-panel {
            padding: 8px;
          }

          .tags-columns {
            columns: 2;
            column-gap: 8px;
          }

          .tag-name {
            padding: 4px 6px;
            font-size: 11px;
          }

          .tag-count {
            min-width: 34px;
            font-size: 10px;
          }
        }
      `}</style>
    </main>
  )
}