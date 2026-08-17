import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { unstable_cache } from 'next/cache'
import { notFound } from 'next/navigation'
import { ChapterList } from '@/components/manga/ChapterList'
import { FavoriteButton } from '@/components/manga/FavoriteButton'
import { MangaPageGallery } from '@/components/manga/MangaPageGallery'
import { MangaRelated } from '@/components/manga/MangaRelated'
import { MangaScore } from '@/components/manga/MangaScore'
import { MangaViewTracker } from '@/components/manga/MangaViewTracker'
import { JsonLd } from '@/components/seo/JsonLd'
import { createPublicClient } from '@/lib/supabase/public'
import { formatNumber } from '@/lib/utils'

export const revalidate = 900

interface PageProps {
  params: Promise<{ slug: string }>
}

interface TagItem {
  id: string
  name: string
  slug: string
  namespace: string
}

interface GenreItem {
  id: string
  name: string
  slug: string
}

interface CategoryItem {
  id: string
  name: string
  slug: string
  color_hex: string | null
}

interface ChapterItem {
  id: string
  manga_id: string
  number: number
  title: string | null
  pages: string[] | null
  views: number | string | null
  created_at: string
}

interface MangaRow extends Record<string, unknown> {
  id: string
  slug: string
  title: string
  description: string | null
  cover_url: string | null
  score: number | string | null
  views: number | string | null
  author: string | null
  created_at: string | null
  updated_at: string | null
  manga_genres?: Array<{ genres: GenreItem | null }>
  manga_tags?: Array<{ tags: TagItem | null }>
  manga_categories?: Array<{ categories: CategoryItem | null }>
}

interface MangaPageData {
  manga: MangaRow
  chapters: ChapterItem[]
}

const SITE_URL = 'https://mangafuta.com'

const MANGA_SELECT = `
  id,
  slug,
  title,
  description,
  cover_url,
  score,
  views,
  author,
  created_at,
  updated_at,
  manga_genres (
    genres (id, name, slug)
  ),
  manga_tags (
    tags (id, name, slug, namespace)
  ),
  manga_categories (
    categories (id, name, slug, color_hex)
  )
`

const CHAPTER_SELECT = `
  id,
  manga_id,
  number,
  title,
  pages,
  views,
  created_at
`

const NS_LABELS: Record<string, string> = {
  theme: 'Temas',
  trope: 'Tropos',
  setting: 'Ambientación',
  format: 'Formato',
  content_warning: '⚠ Advertencias',
}

function safeNumber(value: unknown): number {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function safeBigInt(value: unknown): bigint {
  return BigInt(Math.max(0, Math.trunc(safeNumber(value))))
}

function cleanDescription(description: string | null, title: string): string {
  const fallback = `Lee ${title} en español en MangaFuta.`
  const text = description?.trim() || fallback
  return text.length > 160 ? `${text.slice(0, 157).trimEnd()}…` : text
}

const getMangaPageData = unstable_cache(
  async (slug: string): Promise<MangaPageData | null> => {
    const supabase = createPublicClient()

    const { data: mangaRaw, error: mangaError } = await supabase
      .from('mangas')
      .select(MANGA_SELECT)
      .eq('slug', slug)
      .neq('status', 'draft')
      .maybeSingle()

    if (mangaError) {
      throw new Error(`Error cargando el manga: ${mangaError.message}`)
    }

    if (!mangaRaw) return null

    const manga = mangaRaw as unknown as MangaRow

    const { data: chaptersRaw, error: chaptersError } = await supabase
      .from('chapters')
      .select(CHAPTER_SELECT)
      .eq('manga_id', manga.id)
      .order('number', { ascending: false })

    if (chaptersError) {
      throw new Error(`Error cargando capítulos: ${chaptersError.message}`)
    }

    return {
      manga,
      chapters: (chaptersRaw ?? []) as unknown as ChapterItem[],
    }
  },
  ['mangafuta-manga-detail-v3'],
  {
    revalidate: 900,
    tags: ['mangafuta-mangas'],
  }
)

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const result = await getMangaPageData(slug)

  if (!result) {
    return {
      title: 'Manga no encontrado',
      robots: { index: false, follow: false },
    }
  }

  const { manga } = result
  const canonical = `${SITE_URL}/manga/${manga.slug}`
  const description = cleanDescription(manga.description, manga.title)
  const images = manga.cover_url
    ? [{ url: manga.cover_url, alt: manga.title }]
    : []

  return {
    title: manga.title,
    description,
    alternates: { canonical },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      title: manga.title,
      description,
      type: 'book',
      url: canonical,
      siteName: 'MangaFuta',
      locale: 'es_ES',
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title: manga.title,
      description,
      images: manga.cover_url ? [manga.cover_url] : [],
    },
  }
}

export default async function MangaDetailPage({ params }: PageProps) {
  const { slug } = await params
  const result = await getMangaPageData(slug)

  if (!result) notFound()

  const { manga, chapters } = result

  const genres = (manga.manga_genres ?? [])
    .map((relation) => relation.genres)
    .filter((genre): genre is GenreItem => Boolean(genre))

  const tags = (manga.manga_tags ?? [])
    .map((relation) => relation.tags)
    .filter((tag): tag is TagItem => Boolean(tag))

  const categories = (manga.manga_categories ?? [])
    .map((relation) => relation.categories)
    .filter((category): category is CategoryItem => Boolean(category))

  const tagsByNamespace = tags.reduce<Record<string, TagItem[]>>(
    (groups, tag) => {
      ;(groups[tag.namespace] ??= []).push(tag)
      return groups
    },
    {}
  )

  const mappedChapters = chapters.map((chapter) => ({
    id: chapter.id,
    mangaId: chapter.manga_id,
    number: safeNumber(chapter.number),
    title: chapter.title,
    pages: chapter.pages ?? [],
    views: safeBigInt(chapter.views),
    createdAt: chapter.created_at,
  }))

  const score = safeNumber(manga.score)
  const canonical = `${SITE_URL}/manga/${manga.slug}`

  return (
    <>
      <MangaViewTracker mangaId={manga.id} />

      <JsonLd
        type="Book"
        data={{
          '@id': `${canonical}#book`,
          url: canonical,
          name: manga.title,
          description: manga.description ?? `Lee ${manga.title} en español en MangaFuta.`,
          image: manga.cover_url ? [manga.cover_url] : undefined,
          inLanguage: 'es',
          contentRating: '18+',
          isFamilyFriendly: false,
          author: manga.author
            ? { '@type': 'Person', name: manga.author }
            : undefined,
          genre: genres.map((genre) => genre.name),
          datePublished: manga.created_at ?? undefined,
          dateModified: manga.updated_at ?? undefined,
          publisher: {
            '@type': 'Organization',
            name: 'MangaFuta',
            url: SITE_URL,
          },
        }}
      />

      <div className="mx-auto max-w-7xl px-4 py-8">
        <Link
          href="/manga"
          className="mb-6 flex w-fit items-center gap-1 text-sm text-zinc-500 transition-colors hover:text-zinc-300"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Volver al catálogo
        </Link>

        <div className="mb-10 flex flex-col gap-8 md:flex-row">
          <div className="flex-shrink-0">
            <div className="aspect-[2/3] w-48 overflow-hidden rounded-xl bg-[#1a1a1a] shadow-2xl md:w-56">
              {manga.cover_url ? (
                <Image
                  src={manga.cover_url}
                  alt={`Portada de ${manga.title}`}
                  width={224}
                  height={336}
                  sizes="(max-width: 768px) 192px, 224px"
                  className="h-full w-full object-cover"
                  priority
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm text-zinc-700">
                  Sin portada
                </div>
              )}
            </div>
          </div>

          <div className="min-w-0 flex-1">
            {categories.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {categories.map((category) => (
                  <span
                    key={category.id}
                    className="rounded-full px-2.5 py-1 text-sm font-medium"
                    style={
                      category.color_hex
                        ? {
                            background: `${category.color_hex}22`,
                            color: category.color_hex,
                            border: `1px solid ${category.color_hex}44`,
                          }
                        : { background: '#ffffff11', color: '#aaa' }
                    }
                  >
                    {category.name}
                  </span>
                ))}
              </div>
            )}

            <h1 className="mb-2 text-3xl font-bold leading-tight text-white md:text-4xl">
              {manga.title}
            </h1>

            {manga.author && (
              <p className="mb-3 text-base text-zinc-400">
                por <span className="text-white">{manga.author}</span>
              </p>
            )}

            <div className="mb-5 flex flex-wrap items-center gap-4">
              {score > 0 && (
                <span className="flex items-center gap-1 text-sm text-yellow-400">
                  ★ <span className="font-semibold">{score.toFixed(1)}</span>
                </span>
              )}
              <span className="text-sm text-zinc-500">
                {formatNumber(safeBigInt(manga.views))} vistas
              </span>
            </div>

            {manga.description && (
              <p className="mb-6 max-w-2xl text-base leading-7 text-zinc-400">
                {manga.description}
              </p>
            )}

            {Object.entries(tagsByNamespace).map(([namespace, namespaceTags]) => (
              <div key={namespace} className="mb-4">
                <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-500">
                  {NS_LABELS[namespace] ?? namespace}
                </p>
                <div className="flex flex-wrap gap-2">
                  {namespaceTags.map((tag) => (
                    <Link
                      key={tag.id}
                      href={`/tag/${tag.slug}`}
                      className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                        namespace === 'content_warning'
                          ? 'border-yellow-500/30 text-yellow-600 hover:border-yellow-500/50 hover:text-yellow-400'
                          : 'border-white/10 text-zinc-400 hover:border-white/20 hover:text-white'
                      }`}
                    >
                      {tag.name}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="my-5 border-y border-white/5 py-5">
          <MangaScore mangaId={manga.id} currentScore={score} />
        </div>

        <div className="mb-5">
          <FavoriteButton mangaId={manga.id} />
        </div>

        <section>
          <h2 className="mb-4 text-xl font-bold text-white">
            Capítulos
            <span className="ml-2 text-sm font-normal text-zinc-500">
              ({mappedChapters.length})
            </span>
          </h2>
          <ChapterList chapters={mappedChapters} mangaSlug={manga.slug} />
        </section>

        <MangaPageGallery chapters={mappedChapters} mangaSlug={manga.slug} />

        <MangaRelated mangaId={manga.id} mangaSlug={manga.slug} />
      </div>
    </>
  )
}