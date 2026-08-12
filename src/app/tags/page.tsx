import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export const revalidate = 3600

interface PageProps {
  searchParams: Promise<{
    sort?: string
    ns?: string
  }>
}

interface TagRow {
  id: string
  name: string
  slug: string
  namespace: string
  usage_count: number
}

const NS_CONFIG: Record<
  string,
  {
    label: string
    emoji: string
    color: string
  }
> = {
  theme: {
    label: 'Temas',
    emoji: '🎭',
    color: '#C4956A',
  },
  trope: {
    label: 'Tropos',
    emoji: '✨',
    color: '#4A6FBF',
  },
  setting: {
    label: 'Ambientación',
    emoji: '🌍',
    color: '#1D9E75',
  },
  format: {
    label: 'Formato',
    emoji: '📐',
    color: '#7F77DD',
  },
  content_warning: {
    label: 'Advertencias',
    emoji: '⚠️',
    color: '#E8424A',
  },
}

const VALID_SORTS = [
  'az',
  'za',
  'popular',
]

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const params = await searchParams

  const hasFilters =
    params.sort !== undefined ||
    params.ns !== undefined

  const title =
    'Tags de manga futanari en español'

  const description =
    'Explora los temas, formatos, tropos y etiquetas de los doujinshis disponibles en MangaFuta.'

  return {
    title,
    description,

    alternates: {
      canonical: '/tags',
    },

    robots: {
      index: !hasFilters,
      follow: true,

      googleBot: {
        index: !hasFilters,
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

    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/og-image.jpg'],
    },
  }
}

export default async function TagsPage({
  searchParams,
}: PageProps) {
  const params = await searchParams

  const sort = VALID_SORTS.includes(
    params.sort ?? ''
  )
    ? params.sort!
    : 'az'

  const nsFilter =
    params.ns && NS_CONFIG[params.ns]
      ? params.ns
      : undefined

  const supabase = await createClient()

  const [
    { data: tagsRaw, error: tagsError },
    { count: totalMangas },
  ] = await Promise.all([
    supabase
      .from('tags')
      .select(
        'id, name, slug, namespace, usage_count'
      )
      /*
       * Evitamos enlazar páginas demasiado débiles
       * con cero o un solo manga.
       */
      .gte('usage_count', 2),

    supabase
      .from('mangas')
      .select('id', {
        count: 'exact',
        head: true,
      })
      .neq('status', 'draft'),
  ])

  if (tagsError) {
    console.error(
      'Error cargando tags:',
      tagsError.message
    )
  }

  const tags =
    (tagsRaw ?? []) as TagRow[]

  const filteredTags = nsFilter
    ? tags.filter(
        (tag) =>
          tag.namespace === nsFilter
      )
    : tags

  const sortedTags = [...filteredTags].sort(
    (first, second) => {
      if (sort === 'za') {
        return second.name.localeCompare(
          first.name,
          'es'
        )
      }

      if (sort === 'popular') {
        return (
          second.usage_count -
          first.usage_count
        )
      }

      return first.name.localeCompare(
        second.name,
        'es'
      )
    }
  )

  const grouped = Object.keys(
    NS_CONFIG
  ).reduce(
    (
      accumulator,
      namespace
    ) => {
      accumulator[namespace] =
        sortedTags.filter(
          (tag) =>
            tag.namespace === namespace
        )

      return accumulator
    },
    {} as Record<string, TagRow[]>
  )

  const namespaceCounts = Object.keys(
    NS_CONFIG
  ).reduce(
    (
      accumulator,
      namespace
    ) => {
      accumulator[namespace] =
        tags.filter(
          (tag) =>
            tag.namespace === namespace
        ).length

      return accumulator
    },
    {} as Record<string, number>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <header className="mb-10">
        <h1
          className="text-3xl font-black mb-2"
          style={{ color: '#f0ece8' }}
        >
          Explorar tags de manga
        </h1>

        <p
          className="text-sm"
          style={{
            color:
              'rgba(160,152,144,1)',
          }}
        >
          {tags.length} tags disponibles ·{' '}
          {(totalMangas ?? 0).toLocaleString()}{' '}
          doujinshis en la plataforma
        </p>
      </header>

      {/* Tipos de tags */}
      <nav
        aria-label="Tipos de tags"
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-8"
      >
        {Object.entries(NS_CONFIG).map(
          ([namespace, config]) => {
            const active =
              nsFilter === namespace

            return (
              <Link
                key={namespace}
                href={
                  active
                    ? '/tags'
                    : `/tags?ns=${namespace}&sort=${sort}`
                }
                className="flex flex-col gap-1 p-4 rounded-xl border transition-all"
                style={{
                  background: active
                    ? `${config.color}15`
                    : 'rgba(255,255,255,0.03)',

                  borderColor: active
                    ? `${config.color}40`
                    : 'rgba(255,255,255,0.06)',
                }}
              >
                <span
                  className="text-xl"
                  aria-hidden="true"
                >
                  {config.emoji}
                </span>

                <span
                  className="text-xs font-semibold"
                  style={{
                    color: active
                      ? config.color
                      : '#f0ece8',
                  }}
                >
                  {config.label}
                </span>

                <span
                  className="text-xs"
                  style={{
                    color:
                      'rgba(96,88,80,1)',
                  }}
                >
                  {namespaceCounts[namespace] ??
                    0}{' '}
                  tags
                </span>
              </Link>
            )
          }
        )}
      </nav>

      {/* Ordenamiento */}
      <nav
        aria-label="Ordenar tags"
        className="flex items-center gap-2 mb-8 flex-wrap"
      >
        <span
          className="text-xs font-semibold uppercase tracking-wider"
          style={{
            color:
              'rgba(96,88,80,1)',
          }}
        >
          Ordenar:
        </span>

        {[
          {
            value: 'az',
            label: 'A → Z',
          },
          {
            value: 'za',
            label: 'Z → A',
          },
          {
            value: 'popular',
            label: 'Populares',
          },
        ].map((option) => (
          <Link
            key={option.value}
            href={
              option.value === 'az' &&
              !nsFilter
                ? '/tags'
                : `/tags?sort=${option.value}${
                    nsFilter
                      ? `&ns=${nsFilter}`
                      : ''
                  }`
            }
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background:
                sort === option.value
                  ? 'rgba(196,149,106,0.15)'
                  : 'rgba(255,255,255,0.04)',

              border: `1px solid ${
                sort === option.value
                  ? 'rgba(196,149,106,0.40)'
                  : 'rgba(255,255,255,0.06)'
              }`,

              color:
                sort === option.value
                  ? '#C4956A'
                  : 'rgba(160,152,144,1)',
            }}
          >
            {option.label}
          </Link>
        ))}

        {nsFilter && (
          <Link
            href="/tags"
            className="ml-auto text-xs px-3 py-1.5 rounded-lg transition-all"
            style={{
              background:
                'rgba(232,66,74,0.10)',

              border:
                '1px solid rgba(232,66,74,0.25)',

              color: '#E8424A',
            }}
          >
            ✕ Quitar filtro
          </Link>
        )}
      </nav>

      {nsFilter ? (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <span
              className="text-xl"
              aria-hidden="true"
            >
              {NS_CONFIG[nsFilter].emoji}
            </span>

            <h2
              className="text-lg font-bold"
              style={{ color: '#f0ece8' }}
            >
              {NS_CONFIG[nsFilter].label}
            </h2>

            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{
                background:
                  'rgba(255,255,255,0.06)',

                color:
                  'rgba(160,152,144,1)',
              }}
            >
              {sortedTags.length} tags
            </span>
          </div>

          <TagCloud
            tags={sortedTags}
            color={
              NS_CONFIG[nsFilter].color
            }
          />
        </section>
      ) : (
        <div className="flex flex-col gap-10">
          {Object.entries(NS_CONFIG).map(
            ([namespace, config]) => {
              const namespaceTags =
                grouped[namespace] ?? []

              if (
                namespaceTags.length === 0
              ) {
                return null
              }

              return (
                <section key={namespace}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xl"
                        aria-hidden="true"
                      >
                        {config.emoji}
                      </span>

                      <h2
                        className="text-base font-bold"
                        style={{
                          color: '#f0ece8',
                        }}
                      >
                        {config.label}
                      </h2>

                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          background:
                            'rgba(255,255,255,0.06)',

                          color:
                            'rgba(160,152,144,1)',
                        }}
                      >
                        {namespaceTags.length}
                      </span>
                    </div>

                    <Link
                      href={`/tags?ns=${namespace}`}
                      className="text-xs transition-colors"
                      style={{
                        color: config.color,
                      }}
                    >
                      Ver todos →
                    </Link>
                  </div>

                  <TagCloud
                    tags={namespaceTags}
                    color={config.color}
                  />
                </section>
              )
            }
          )}
        </div>
      )}
    </div>
  )
}

function TagCloud({
  tags,
  color,
}: {
  tags: TagRow[]
  color: string
}) {
  if (tags.length === 0) {
    return (
      <p
        style={{
          color:
            'rgba(160,152,144,0.5)',
          fontSize: '13px',
        }}
      >
        No hay tags disponibles en esta sección.
      </p>
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <Link
          key={tag.id}
          href={`/tag/${tag.slug}`}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:scale-105"
          style={{
            background: `${color}12`,
            border: `1px solid ${color}25`,
            color:
              'rgba(200,192,184,1)',
          }}
        >
          {tag.name}

          <span
            className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
            style={{
              background: `${color}25`,
              color,
            }}
          >
            {tag.usage_count}
          </span>
        </Link>
      ))}
    </div>
  )
}