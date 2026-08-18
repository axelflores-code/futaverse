import type {
  Metadata,
} from 'next'

import {
  unstable_cache,
} from 'next/cache'

import Link from 'next/link'

import {
  createPublicClient,
} from '@/lib/supabase/public'

import {
  MangaHeroCarousel,
} from '@/components/manga/MangaHeroCarousel'

import {
  MangaRowScroll,
} from '@/components/manga/MangaRowScroll'

import {
  MangaCard,
} from '@/components/manga/MangaCard'

import type {
  Manga,
} from '@/types/manga'

export const revalidate = 900

export const metadata:
  Metadata = {
    title: {
      absolute:
        'MangaFuta — Manga Futanari en Español | Lee Gratis',
    },

    description:
      'Lee manga futa y futanari traducido al español. Explora cientos de doujinshis, mangas y contenido para adultos gratis en MangaFuta.',

    keywords: [
      'manga futa',
      'manga futanari español',
      'manga futa en español',
      'futanari manga latino',
      'manga dickgirl español',
      'hentai español gratis',
      'manga futa online',
      'leer manga futanari',
      'doujinshi futanari',
      'futanari en español',
    ],

    alternates: {
      canonical:
        'https://mangafuta.com',
    },

    openGraph: {
      title:
        'Manga Futa y Futanari en Español | MangaFuta',

      description:
        'Lee manga futa y futanari traducido al español completamente gratis.',

      url:
        'https://mangafuta.com',

      siteName:
        'MangaFuta',

      locale:
        'es_ES',

      type:
        'website',

      images: [
        {
          url:
            '/og-image.jpg',

          width:
            1200,

          height:
            630,

          alt:
            'MangaFuta — Manga futa en español',
        },
      ],
    },

    twitter: {
      card:
        'summary_large_image',

      title:
        'Manga Futa en Español | MangaFuta',

      description:
        'Lee manga futa y futanari traducido al español completamente gratis.',

      images: [
        '/og-image.jpg',
      ],
    },

    robots: {
      index:
        true,

      follow:
        true,

      googleBot: {
        index:
          true,

        follow:
          true,

        'max-image-preview':
          'large',

        'max-snippet':
          -1,
      },
    },
  }

interface GenreRow {
  id: string
  name: string
  slug: string
}

interface MangaRow {
  id: string
  slug: string
  title: string
  description:
    string | null
  cover_url:
    string | null
  status: string
  rating: string
  score:
    number | null
  views:
    number | string | null
  author:
    string | null
  created_at: string
  updated_at: string

  manga_genres: Array<{
    genres:
      GenreRow
  }>

  manga_tags?: Array<{
    tag_id: string
  }>
}

interface TagRow {
  id: string
  name: string
  slug: string
  namespace: string
  usage_count: number
}

interface TagSectionRaw {
  tag: TagRow
  mangasRaw:
    MangaRow[]
}

interface HomeData {
  heroRaw:
    MangaRow[]

  popularRaw:
    MangaRow[]

  topRatedRaw:
    MangaRow[]

  latestRaw:
    MangaRow[]

  topTags:
    TagRow[]

  tagSectionsRaw:
    TagSectionRaw[]
}

const FEATURED_TAG_SLUGS = [
  'dickgirl-on-female',
  'sole-dickgirl',
  'dickgirl-on-male',
] as const

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

function mapManga(
  manga: MangaRow
): Manga {
  return {
    id:
      manga.id,

    slug:
      manga.slug,

    title:
      manga.title,

    alternativeTitles:
      [],

    description:
      manga.description,

    coverUrl:
      manga.cover_url,

    status:
      manga.status as
        Manga['status'],

    rating:
      manga.rating as
        Manga['rating'],

    score:
      Number(
        manga.score ?? 0
      ),

    views:
      BigInt(
        Number(
          manga.views ?? 0
        )
      ),

    author:
      manga.author,

    artist:
      null,

    genres:
      (
        manga.manga_genres ??
        []
      )
        .map(
          (relation) =>
            relation.genres
        )
        .filter(Boolean),

    createdAt:
      manga.created_at,

    updatedAt:
      manga.updated_at,
  }
}

const getHomeData =
  unstable_cache(
    async (): Promise<
      HomeData
    > => {
      const supabase =
        createPublicClient()

      const [
        heroResult,
        popularResult,
        topRatedResult,
        latestResult,
        topTagsResult,
        featuredTagsResult,
      ] = await Promise.all([
        /*
         * Seis mangas recientes para
         * el carrusel principal.
         */
        supabase
          .from('mangas')
          .select(
            MANGA_SELECT
          )
          .neq(
            'status',
            'draft'
          )
          .order(
            'updated_at',
            {
              ascending:
                false,
            }
          )
          .limit(6),

        /*
         * Popularidad histórica.
         * Antes se llamaba "hoy"
         * aunque usaba views totales.
         */
        supabase
          .from('mangas')
          .select(
            MANGA_SELECT
          )
          .neq(
            'status',
            'draft'
          )
          .order(
            'views',
            {
              ascending:
                false,
              nullsFirst:
                false,
            }
          )
          .limit(12),

        /*
         * Obras mejor valoradas para darles
         * una entrada directa desde la portada.
         */
        supabase
          .from('mangas')
          .select(
            MANGA_SELECT
          )
          .neq(
            'status',
            'draft'
          )
          .gt(
            'score',
            0
          )
          .order(
            'score',
            {
              ascending:
                false,
              nullsFirst:
                false,
            }
          )
          .order(
            'views',
            {
              ascending:
                false,
              nullsFirst:
                false,
            }
          )
          .limit(12),

        /*
         * Últimas actualizaciones.
         */
        supabase
          .from('mangas')
          .select(
            MANGA_SELECT
          )
          .neq(
            'status',
            'draft'
          )
          .order(
            'updated_at',
            {
              ascending:
                false,
            }
          )
          .limit(28),

        /*
         * Tags populares visibles
         * en la parte inferior.
         */
        supabase
          .from('tags')
          .select(`
            id,
            name,
            slug,
            namespace,
            usage_count
          `)
          .gte(
            'usage_count',
            2
          )
          .order(
            'usage_count',
            {
              ascending:
                false,
            }
          )
          .limit(10),

        /*
         * Tags utilizados como
         * secciones destacadas.
         */
        supabase
          .from('tags')
          .select(`
            id,
            name,
            slug,
            namespace,
            usage_count
          `)
          .in(
            'slug',
            [
              ...FEATURED_TAG_SLUGS,
            ]
          ),
      ])

      if (
        heroResult.error
      ) {
        throw new Error(
          `Error cargando hero: ${heroResult.error.message}`
        )
      }

      if (
        popularResult.error
      ) {
        throw new Error(
          `Error cargando populares: ${popularResult.error.message}`
        )
      }

      if (
        topRatedResult.error
      ) {
        throw new Error(
          `Error cargando mejor valorados: ${topRatedResult.error.message}`
        )
      }

      if (
        latestResult.error
      ) {
        throw new Error(
          `Error cargando recientes: ${latestResult.error.message}`
        )
      }

      if (
        topTagsResult.error
      ) {
        throw new Error(
          `Error cargando tags populares: ${topTagsResult.error.message}`
        )
      }

      if (
        featuredTagsResult.error
      ) {
        throw new Error(
          `Error cargando tags destacados: ${featuredTagsResult.error.message}`
        )
      }

      const featuredTags =
        (
          featuredTagsResult.data ??
          []
        ) as TagRow[]

      const tagsBySlug =
        new Map(
          featuredTags.map(
            (tag) => [
              tag.slug,
              tag,
            ]
          )
        )

      /*
       * Conservamos el orden definido
       * en FEATURED_TAG_SLUGS.
       */
      const orderedFeaturedTags =
        FEATURED_TAG_SLUGS
          .map(
            (slug) =>
              tagsBySlug.get(
                slug
              )
          )
          .filter(
            (
              tag
            ): tag is TagRow =>
              Boolean(tag)
          )

      const tagSectionsRaw =
        await Promise.all(
          orderedFeaturedTags.map(
            async (
              tag
            ): Promise<
              TagSectionRaw
            > => {
              /*
               * Consulta directa mediante
               * manga_tags. No descargamos
               * listas enormes de IDs.
               */
              const {
                data,
                error,
              } = await supabase
                .from('mangas')
                .select(`
                  ${MANGA_SELECT},

                  manga_tags!inner (
                    tag_id
                  )
                `)
                .eq(
                  'manga_tags.tag_id',
                  tag.id
                )
                .neq(
                  'status',
                  'draft'
                )
                .order(
                  'updated_at',
                  {
                    ascending:
                      false,
                  }
                )
                .limit(7)

              if (error) {
                console.error(
                  `Error cargando sección ${tag.slug}:`,
                  error.message
                )

                return {
                  tag,
                  mangasRaw:
                    [],
                }
              }

              return {
                tag,

                mangasRaw:
                  (
                    data ?? []
                  ) as unknown as
                    MangaRow[],
              }
            }
          )
        )

      return {
        heroRaw:
          (
            heroResult.data ??
            []
          ) as unknown as
            MangaRow[],

        popularRaw:
          (
            popularResult.data ??
            []
          ) as unknown as
            MangaRow[],

        topRatedRaw:
          (
            topRatedResult.data ??
            []
          ) as unknown as
            MangaRow[],

        latestRaw:
          (
            latestResult.data ??
            []
          ) as unknown as
            MangaRow[],

        topTags:
          (
            topTagsResult.data ??
            []
          ) as TagRow[],

        tagSectionsRaw,
      }
    },
    [
      'mangafuta-home-v3',
    ],
    {
      revalidate:
        900,

      tags: [
        'mangafuta-home',
        'mangafuta-mangas',
        'mangafuta-tags',
      ],
    }
  )

export default async function HomePage() {
  const {
    heroRaw,
    popularRaw,
    topRatedRaw,
    latestRaw,
    topTags,
    tagSectionsRaw,
  } = await getHomeData()

  const heroMangas =
    heroRaw.map(mapManga)

  const popularMangas =
    popularRaw.map(mapManga)

  const topRatedMangas =
    topRatedRaw.map(mapManga)

  const latestMangas =
    latestRaw.map(mapManga)

  const tagSections =
    tagSectionsRaw.map(
      ({
        tag,
        mangasRaw,
      }) => ({
        tag,

        mangas:
          mangasRaw.map(
            mapManga
          ),
      })
    )

  return (
    <div>
      <MangaHeroCarousel
        mangas={heroMangas}
      />

      <section className="home-introduction">
        <h1>
          Manga futa en español
        </h1>

        <p>
          Bienvenido a MangaFuta,
          una plataforma de manga
          futanari traducido al español
          para Latinoamérica. Explora
          manga futa, doujinshis y
          contenido para adultos
          disponible gratuitamente.
        </p>

        <nav
          aria-label="Explorar MangaFuta"
          className="home-primary-links"
        >
          <Link href="/manga">
            Ver catálogo
          </Link>
          <Link href="/manga?order=rating">
            Mejor valorados
          </Link>
          <Link href="/tags">
            Explorar tags
          </Link>
        </nav>
      </section>

      <div className="home-content">
        <MangaRowScroll
          mangas={
            popularMangas
          }
          title="Más populares"
          href="/manga?order=popular&period=all"
        />

        {topRatedMangas.length > 0 && (
          <MangaRowScroll
            mangas={topRatedMangas}
            title="Mejor valorados"
            href="/manga?order=rating"
          />
        )}

        <section className="home-section">
          <header className="home-section-header">
            <h2>
              <span
                aria-hidden="true"
                className="home-accent primary"
              />

              Últimas actualizaciones
            </h2>

            <Link
              href="/manga"
              className="home-view-all primary"
            >
              Ver todo →
            </Link>
          </header>

          <div className="latest-grid">
            {latestMangas.map(
              (
                manga,
                index
              ) => (
                <MangaCard
                  key={
                    manga.id
                  }
                  manga={
                    manga
                  }
                  priority={
                    index < 7
                  }
                />
              )
            )}
          </div>
        </section>

        {tagSections.map(
          ({
            tag,
            mangas,
          }) => {
            if (
              mangas.length === 0
            ) {
              return null
            }

            return (
              <section
                key={tag.id}
                className="home-section"
              >
                <header className="home-section-header">
                  <h2>
                    <span
                      aria-hidden="true"
                      className="home-accent secondary"
                    />

                    {tag.name}

                    <span className="home-tag-count">
                      {tag.usage_count.toLocaleString()}{' '}
                      obras
                    </span>
                  </h2>

                  <Link
                    href={
                      `/tag/${tag.slug}`
                    }
                    className="home-view-all secondary"
                  >
                    Ver todo →
                  </Link>
                </header>

                <div className="tag-grid">
                  {mangas.map(
                    (manga) => (
                      <MangaCard
                        key={
                          manga.id
                        }
                        manga={
                          manga
                        }
                        priority={
                          false
                        }
                      />
                    )
                  )}
                </div>
              </section>
            )
          }
        )}

        <section className="home-section">
          <header className="home-section-header">
            <h2>
              <span
                aria-hidden="true"
                className="home-accent primary"
              />

              Tags populares
            </h2>

            <Link
              href="/tags"
              className="home-view-all primary"
            >
              Ver todos →
            </Link>
          </header>

          <div className="popular-tags">
            {topTags.map(
              (tag) => (
                <Link
                  key={
                    tag.id
                  }
                  href={
                    `/tag/${tag.slug}`
                  }
                  className="popular-tag"
                >
                  <span>
                    {tag.name}
                  </span>

                  <span className="popular-tag-count">
                    {tag.usage_count.toLocaleString()}
                  </span>
                </Link>
              )
            )}
          </div>
        </section>
      </div>

      <style>{`
        .home-introduction {
          width: 100%;
          max-width: 1280px;
          margin: 0 auto;
          padding: 24px 16px 0;
        }

        .home-introduction h1 {
          margin: 0 0 8px;
          color: #f0ece8;
          font-size: 24px;
          font-weight: 800;
          letter-spacing: -0.02em;
        }

        .home-introduction p {
          max-width: 780px;
          margin: 0;
          color:
            rgba(170, 162, 154, 0.62);
          font-size: 13px;
          line-height: 1.65;
        }

        .home-primary-links {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 16px;
        }

        .home-primary-links a {
          display: inline-flex;
          align-items: center;
          min-height: 38px;
          padding: 8px 14px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.04);
          color: rgba(225, 218, 210, 0.9);
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
          transition: border-color 150ms ease, color 150ms ease;
        }

        .home-primary-links a:hover {
          border-color: rgba(196, 149, 106, 0.45);
          color: #ffffff;
        }

        .home-content {
          width: 100%;
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 16px;
        }

        .home-section {
          margin-bottom: 48px;
        }

        .home-section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 16px;
        }

        .home-section-header h2 {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
          margin: 0;
          color: #f0ece8;
          font-size: 18px;
          font-weight: 700;
        }

        .home-accent {
          display: inline-block;
          flex: 0 0 auto;
          width: 3px;
          height: 20px;
          border-radius: 2px;
        }

        .home-accent.primary {
          background: #c4956a;
        }

        .home-accent.secondary {
          background: #3d5a9e;
        }

        .home-view-all {
          flex: 0 0 auto;
          font-size: 13px;
          text-decoration: none;
        }

        .home-view-all.primary {
          color: #c4956a;
        }

        .home-view-all.secondary {
          color: #7198df;
        }

        .home-tag-count {
          padding: 2px 8px;
          border:
            1px solid
            rgba(61, 90, 158, 0.25);
          border-radius: 20px;
          background:
            rgba(61, 90, 158, 0.12);
          color: #7198df;
          font-size: 11px;
          font-weight: 500;
          white-space: nowrap;
        }

        .latest-grid {
          display: grid;
          grid-template-columns:
            repeat(7, minmax(0, 1fr));
          gap: 10px;
        }

        .tag-grid {
          display: grid;
          grid-template-columns:
            repeat(6, minmax(0, 1fr));
          gap: 10px;
        }

        .popular-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .popular-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          min-height: 36px;
          padding: 8px 16px;
          border:
            1px solid
            rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          background:
            rgba(255, 255, 255, 0.04);
          color:
            rgba(210, 202, 194, 0.9);
          font-size: 13px;
          font-weight: 500;
          text-decoration: none;
          transition:
            border-color 150ms ease,
            background 150ms ease,
            color 150ms ease;
        }

        .popular-tag:hover {
          border-color:
            rgba(196, 149, 106, 0.35);
          background:
            rgba(196, 149, 106, 0.08);
          color: #ffffff;
        }

        .popular-tag-count {
          padding: 1px 6px;
          border-radius: 10px;
          background:
            rgba(196, 149, 106, 0.12);
          color: #c4956a;
          font-size: 11px;
        }

        @media (max-width: 1024px) {
          .latest-grid,
          .tag-grid {
            grid-template-columns:
              repeat(4, minmax(0, 1fr));
          }
        }

        @media (max-width: 640px) {
          .latest-grid,
          .tag-grid {
            grid-template-columns:
              repeat(3, minmax(0, 1fr));
          }

          .home-section-header {
            align-items: flex-start;
          }

          .home-section-header h2 {
            font-size: 16px;
          }

          .home-tag-count {
            display: none;
          }
        }

        @media (max-width: 480px) {
          .latest-grid,
          .tag-grid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }

          .home-introduction h1 {
            font-size: 22px;
          }

          .popular-tag {
            padding: 7px 12px;
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  )
}
