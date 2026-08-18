import {
  unstable_cache,
} from 'next/cache'

import Image from 'next/image'
import Link from 'next/link'

import {
  createPublicClient,
} from '@/lib/supabase/public'

interface MangaRelatedProps {
  mangaId: string
  mangaSlug: string
}

interface GenreRow {
  id: string
  name: string
  slug: string
}

interface TagRow {
  id: string
  name: string
  slug: string
  namespace: string
  usage_count: number | string | null
}

interface MangaRow {
  id: string
  slug: string
  title: string
  cover_url: string | null
  status: string
  score: number | null
  rating: string
  description: string | null
  views: number | string | null
  created_at: string
  updated_at: string
  author: string | null

  manga_genres: Array<{
    genres: GenreRow
  }>
}

interface RelatedResult {
  mangas: MangaRow[]

  sharedCounts:
    Record<string, number>

  commonTags: TagRow[]
}

const getRelatedMangas =
  unstable_cache(
    async (
      mangaId: string
    ): Promise<RelatedResult> => {
      const supabase =
        createPublicClient()

      /*
       * Tags del manga actual.
       */
      const {
        data: currentTagsRaw,
        error: currentTagsError,
      } = await supabase
        .from('manga_tags')
        .select(`
          tag_id,
          tags (
            id,
            name,
            slug,
            namespace,
            usage_count
          )
        `)
        .eq(
          'manga_id',
          mangaId
        )

      if (currentTagsError) {
        throw new Error(
          `Error cargando tags para relacionados: ${currentTagsError.message}`
        )
      }

      const currentTags = (
        currentTagsRaw ?? []
      ) as unknown as Array<{
        tag_id: string
        tags: TagRow | null
      }>

      if (
        !currentTags ||
        currentTags.length === 0
      ) {
        return {
          mangas: [],
          sharedCounts: {},
          commonTags: [],
        }
      }

      const commonTags = currentTags
        .map((relation) => relation.tags)
        .filter((tag): tag is TagRow => Boolean(tag))
        .filter((tag) => tag.namespace !== 'content_warning')
        .sort(
          (first, second) =>
            Number(second.usage_count ?? 0) -
            Number(first.usage_count ?? 0)
        )

      const tagIds =
        currentTags.map(
          (relation) =>
            relation.tag_id
        )

      /*
       * Buscamos mangas que compartan
       * cualquiera de esos tags.
       */
      const {
        data: relatedRelations,
        error: relationsError,
      } = await supabase
        .from('manga_tags')
        .select('manga_id')
        .in(
          'tag_id',
          tagIds
        )
        .neq(
          'manga_id',
          mangaId
        )
        .limit(5000)

      if (relationsError) {
        throw new Error(
          `Error buscando mangas relacionados: ${relationsError.message}`
        )
      }

      if (
        !relatedRelations ||
        relatedRelations.length === 0
      ) {
        return {
          mangas: [],
          sharedCounts: {},
          commonTags,
        }
      }

      /*
       * Número de tags compartidos
       * por cada manga.
       */
      const sharedCounts:
        Record<string, number> = {}

      for (
        const relation of
        relatedRelations
      ) {
        const relatedId =
          relation.manga_id

        sharedCounts[relatedId] =
          (
            sharedCounts[
              relatedId
            ] ?? 0
          ) + 1
      }

      const topIds =
        Object.entries(
          sharedCounts
        )
          .sort(
            (first, second) =>
              second[1] -
              first[1]
          )
          .slice(0, 24)
          .map(
            ([relatedId]) =>
              relatedId
          )

      if (
        topIds.length === 0
      ) {
        return {
          mangas: [],
          sharedCounts: {},
          commonTags,
        }
      }

      /*
       * Esta lista siempre contiene
       * como máximo 24 IDs, por lo
       * que .in() es seguro aquí.
       */
      const {
        data: mangasRaw,
        error: mangasError,
      } = await supabase
        .from('mangas')
        .select(`
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
          )
        `)
        .in(
          'id',
          topIds
        )
        .neq(
          'status',
          'draft'
        )

      if (mangasError) {
        throw new Error(
          `Error cargando mangas relacionados: ${mangasError.message}`
        )
      }

      const unordered =
        (
          mangasRaw ?? []
        ) as unknown as
          MangaRow[]

      /*
       * Supabase no conserva el orden
       * del array enviado a .in().
       */
      const mangas = unordered
        .sort((first, second) => {
          const sharedDifference =
            (sharedCounts[second.id] ?? 0) -
            (sharedCounts[first.id] ?? 0)

          if (sharedDifference !== 0) {
            return sharedDifference
          }

          const scoreDifference =
            Number(second.score ?? 0) -
            Number(first.score ?? 0)

          if (scoreDifference !== 0) {
            return scoreDifference
          }

          return Number(second.views ?? 0) - Number(first.views ?? 0)
        })
        .slice(0, 6)

      return {
        mangas,
        sharedCounts,
        commonTags,
      }
    },
    [
      'mangafuta-related-v2',
    ],
    {
      revalidate: 3600,
      tags: [
        'mangafuta-related',
      ],
    }
  )

export async function MangaRelated({
  mangaId,
}: MangaRelatedProps) {
  let result: RelatedResult

  try {
    result = await getRelatedMangas(mangaId)
  } catch (error) {
    console.error(
      'No se pudieron cargar los mangas relacionados:',
      error
    )

    return null
  }

  const {
    mangas,
    sharedCounts,
    commonTags,
  } = result

  if (mangas.length === 0) {
    return null
  }

  return (
    <section className="related-section">
      <header className="related-header">
        <h2>
          <span
            aria-hidden="true"
            className="related-accent"
          />

          Mangas relacionados
        </h2>

        <Link href="/manga" className="related-view-all">
          Ver catálogo →
        </Link>
      </header>

      <div className="related-grid">
        {mangas.map((manga) => {
          const genres =
            (
              manga.manga_genres ??
              []
            )
              .map(
                (relation) =>
                  relation.genres
              )
              .filter(Boolean)

          const sharedCount =
            sharedCounts[
              manga.id
            ] ?? 0

          return (
            <Link
              key={manga.id}
              href={
                `/manga/${manga.slug}`
              }
              className="related-card"
            >
              <div className="related-cover">
                {manga.cover_url ? (
                  <Image
                    src={
                      manga.cover_url
                    }
                    alt={
                      manga.title
                    }
                    fill
                    sizes="
                      (max-width: 480px) 50vw,
                      (max-width: 640px) 33vw,
                      (max-width: 1024px) 25vw,
                      16vw
                    "
                    style={{
                      objectFit:
                        'cover',
                    }}
                  />
                ) : (
                  <div className="related-placeholder">
                    <svg
                      width="24"
                      height="24"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                  </div>
                )}

                {Number(
                  manga.score ?? 0
                ) > 0 && (
                  <span className="related-score">
                    ★{' '}
                    {Number(
                      manga.score
                    ).toFixed(1)}
                  </span>
                )}

                <span className="related-shared">
                  {sharedCount}{' '}
                  en común
                </span>
              </div>

              <div className="related-info">
                <p className="related-title">
                  {manga.title}
                </p>

                {genres.length > 0 && (
                  <p className="related-genres">
                    {genres
                      .slice(0, 2)
                      .map(
                        (genre) =>
                          genre.name
                      )
                      .join(' · ')}
                  </p>
                )}
              </div>
            </Link>
          )
        })}
      </div>

      {commonTags.length > 0 && (
        <nav className="related-links" aria-label="Explorar tags relacionados">
          <span>Continúa explorando:</span>

          {commonTags.slice(0, 4).map((tag) => (
            <Link key={tag.id} href={`/tag/${tag.slug}`}>
              {tag.name}
            </Link>
          ))}
        </nav>
      )}

      <style>{`
        .related-section {
          margin-top: 48px;
          padding-top: 32px;
          border-top:
            1px solid
            rgba(255, 255, 255, 0.06);
        }

        .related-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .related-header h2 {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 0;
          color: #f0ece8;
          font-size: 16px;
          font-weight: 700;
        }

        .related-view-all {
          color: #7198df;
          font-size: 13px;
          text-decoration: none;
        }

        .related-view-all:hover {
          color: #a8c2f0;
        }

        .related-accent {
          display: inline-block;
          width: 3px;
          height: 18px;
          border-radius: 2px;
          background: #3d5a9e;
        }

        .related-grid {
          display: grid;
          grid-template-columns:
            repeat(6, minmax(0, 1fr));
          gap: 10px;
        }

        .related-card {
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border:
            1px solid
            rgba(255, 255, 255, 0.06);
          border-radius: 10px;
          background: #111118;
          text-decoration: none;
          transition:
            opacity 200ms ease,
            transform 200ms ease,
            border-color 200ms ease;
        }

        .related-grid:hover
        .related-card {
          opacity: 0.72;
        }

        .related-grid
        .related-card:hover {
          opacity: 1;
          border-color:
            rgba(196, 149, 106, 0.25);
          transform: translateY(-3px);
        }

        .related-cover {
          position: relative;
          overflow: hidden;
          aspect-ratio: 2 / 3;
          background: #18181f;
        }

        .related-placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          color:
            rgba(255, 255, 255, 0.1);
        }

        .related-score,
        .related-shared {
          position: absolute;
          z-index: 2;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 9px;
          font-weight: 700;
        }

        .related-score {
          right: 5px;
          bottom: 5px;
          background:
            rgba(10, 10, 15, 0.88);
          color: #c4956a;
        }

        .related-shared {
          top: 6px;
          right: 6px;
          background:
            rgba(61, 90, 158, 0.9);
          color: #ffffff;
        }

        .related-info {
          padding: 8px 10px;
        }

        .related-title {
          display: -webkit-box;
          overflow: hidden;
          margin: 0;
          color: #f0ece8;
          font-size: 11px;
          font-weight: 600;
          line-height: 1.4;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 2;
        }

        .related-genres {
          overflow: hidden;
          margin: 3px 0 0;
          color:
            rgba(196, 149, 106, 0.65);
          font-size: 10px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .related-links {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
          margin-top: 18px;
          color: rgba(170, 162, 154, 0.72);
          font-size: 13px;
        }

        .related-links a {
          padding: 5px 10px;
          border: 1px solid rgba(61, 90, 158, 0.25);
          border-radius: 999px;
          background: rgba(61, 90, 158, 0.1);
          color: #7198df;
          text-decoration: none;
          transition: border-color 150ms ease, color 150ms ease;
        }

        .related-links a:hover {
          border-color: rgba(113, 152, 223, 0.5);
          color: #ffffff;
        }

        @media (max-width: 1024px) {
          .related-grid {
            grid-template-columns:
              repeat(4, minmax(0, 1fr));
          }
        }

        @media (max-width: 640px) {
          .related-grid {
            grid-template-columns:
              repeat(3, minmax(0, 1fr));
          }
        }

        @media (max-width: 480px) {
          .related-grid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }
        }
      `}</style>
    </section>
  )
}
