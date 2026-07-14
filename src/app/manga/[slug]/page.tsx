import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ChapterList } from '@/components/manga/ChapterList'
import { MangaViewTracker } from '@/components/manga/MangaViewTracker'
import { JsonLd } from '@/components/seo/JsonLd'
import { formatNumber } from '@/lib/utils'
import Image from 'next/image'
import Link from 'next/link'
import { MangaScore }     from '@/components/manga/MangaScore'
import { MangaPageGallery } from '@/components/manga/MangaPageGallery'
import { FavoriteButton } from '@/components/manga/FavoriteButton'

interface PageProps {
  params: Promise<{ slug: string }>
}

interface TagItem      { id: string; name: string; slug: string; namespace: string }
interface GenreItem    { id: string; name: string; slug: string }
interface CategoryItem { id: string; name: string; slug: string; color_hex: string | null }
interface ChapterItem  {
  id: string; manga_id: string; number: number
  title: string | null; pages: string[]; views: number; created_at: string
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const supabase  = await createClient()
  const { data: manga } = await supabase
    .from('mangas')
    .select('title, description, cover_url')
    .eq('slug', slug)
    .single()
  if (!manga) return { title: 'Manga no encontrado' }
  return {
    title:       manga.title,
    description: manga.description ?? `Lee ${manga.title} en MangaFuta.`,
    openGraph: {
      title:       manga.title,
      description: manga.description ?? '',
      images:      manga.cover_url ? [{ url: manga.cover_url }] : [],
    },
  }
}

export default async function MangaDetailPage({ params }: PageProps) {
  const { slug } = await params
  const supabase  = await createClient()

  const { data: manga } = await supabase
    .from('mangas')
    .select(`
      *,
      manga_genres     ( genres      ( id, name, slug ) ),
      manga_tags       ( tags        ( id, name, slug, namespace ) ),
      manga_categories ( categories  ( id, name, slug, color_hex ) )
    `)
    .eq('slug', slug)
    .single()

  if (!manga) notFound()

  const { data: chaptersRaw } = await supabase
    .from('chapters')
    .select('*')
    .eq('manga_id', manga.id)
    .order('number', { ascending: false })

  const genres: GenreItem[] = ((manga.manga_genres ?? []) as Array<{ genres: GenreItem }>)
    .map(mg => mg.genres).filter(Boolean)

  const tags: TagItem[] = ((manga.manga_tags ?? []) as Array<{ tags: TagItem }>)
    .map(mt => mt.tags).filter(Boolean)

  const categories: CategoryItem[] = ((manga.manga_categories ?? []) as Array<{ categories: CategoryItem }>)
    .map(mc => mc.categories).filter(Boolean)

  const chapters = (chaptersRaw ?? []) as ChapterItem[]

  const tagsByNs = tags.reduce((acc: Record<string, TagItem[]>, tag: TagItem) => {
    if (!acc[tag.namespace]) acc[tag.namespace] = []
    acc[tag.namespace].push(tag)
    return acc
  }, {} as Record<string, TagItem[]>)

  const STATUS_LABEL: Record<string, string> = {
    ongoing: 'En curso', completed: 'Completo', hiatus: 'Pausado',
  }
  const STATUS_COLOR: Record<string, string> = {
    ongoing:   'bg-green-500/10 text-green-400',
    completed: 'bg-blue-500/10 text-blue-400',
    hiatus:    'bg-yellow-500/10 text-yellow-400',
  }
  const NS_LABELS: Record<string, string> = {
    theme:           'Temas',
    trope:           'Tropos',
    setting:         'Ambientación',
    format:          'Formato',
    content_warning: '⚠ Advertencias',
  }

  return (
    <>
    <MangaViewTracker mangaId={manga.id} />
      <JsonLd
        type="Book"
        data={{ name: manga.title, description: manga.description, image: manga.cover_url }}
      />

      <div className="max-w-7xl mx-auto px-4 py-8">

        <Link href="/manga" className="text-xs text-zinc-600 hover:text-zinc-400 flex items-center gap-1 mb-6 transition-colors w-fit">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
          </svg>
          Volver al catálogo
        </Link>

        <div className="flex flex-col md:flex-row gap-8 mb-10">

          {/* Portada */}
          <div className="flex-shrink-0">
            <div className="w-48 md:w-56 aspect-[2/3] bg-[#1a1a1a] rounded-xl overflow-hidden shadow-2xl">
              {manga.cover_url ? (
                <Image
                  src={manga.cover_url}
                  alt={manga.title}
                  width={224}
                  height={336}
                  className="w-full h-full object-cover"
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-700 text-sm">
                  Sin portada
                </div>
              )}
            </div>
          </div>
          

          {/* Info */}
          <div className="flex-1 min-w-0">

            {/* Categorías */}
            {categories.length > 0 && (
              <div className="flex gap-2 flex-wrap mb-3">
                {categories.map((cat: CategoryItem) => (
                  <span
                    key={cat.id}
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={cat.color_hex
                      ? { background: cat.color_hex + '22', color: cat.color_hex, border: `1px solid ${cat.color_hex}44` }
                      : { background: '#ffffff11', color: '#aaa' }
                    }
                  >
                    {cat.name}
                  </span>
                ))}
              </div>
            )}

            <h1 className="text-3xl font-bold text-white mb-2 leading-tight">
              {manga.title}
            </h1>

            {manga.autor && (
              <p className="text-sm text-zinc-400 mb-3">
                por <span className="text-white">{manga.autor}</span>
              </p>
            )}

            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLOR[manga.status] ?? ''}`}>
                {STATUS_LABEL[manga.status] ?? manga.status}
              </span>
              {manga.score > 0 && (
                <span className="text-xs text-yellow-400 flex items-center gap-1">
                  ★ <span className="font-semibold">{manga.score.toFixed(1)}</span>
                </span>
              )}
              <span className="text-xs text-zinc-600">
                {formatNumber(manga.views)} vistas
              </span>
            </div>

            {manga.description && (
              <p className="text-sm text-zinc-400 leading-relaxed mb-5 max-w-2xl">
                {manga.description}
              </p>
            )}

            

            {/* Tags por namespace */}
            {Object.entries(tagsByNs).map(([ns, nsTags]: [string, TagItem[]]) => (
              <div key={ns} className="mb-4">
                <p className="text-xs font-semibold text-zinc-600 uppercase tracking-wider mb-2">
                  {NS_LABELS[ns] ?? ns}
                </p>
                <div className="flex flex-wrap gap-2">
                  {nsTags.map((tag: TagItem) => (
                    <Link
                      key={tag.id}
                      href={`/tag/${tag.slug}`}
                      className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                        ns === 'content_warning'
                          ? 'border-yellow-500/30 text-yellow-600 hover:text-yellow-400 hover:border-yellow-500/50'
                          : 'border-white/10 text-zinc-400 hover:text-white hover:border-white/20'
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

                {/* Puntuación */}
<div className="py-5 border-y border-white/5 my-5">
  <MangaScore
    mangaId={manga.id}
    currentScore={manga.score}
  />
</div>

        {/* Capítulos */}
        <section>
          <h2 className="text-xl font-bold text-white mb-4">
            Capítulos
            <span className="text-sm font-normal text-zinc-600 ml-2">
              ({chapters.length})
            </span>
          </h2>
          <ChapterList
            chapters={chapters.map((c: ChapterItem) => ({
              id:        c.id,
              mangaId:   c.manga_id,
              number:    c.number,
              title:     c.title,
              pages:     c.pages,
              views:     BigInt(c.views),
              createdAt: c.created_at,
            }))}
            mangaSlug={slug}
          />
        </section>

        {/* Botón de favoritos */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLOR[manga.status] ?? ''}`}>
    {STATUS_LABEL[manga.status] ?? manga.status}
  </span>
  {manga.score > 0 && (
    <span className="text-xs text-yellow-400 flex items-center gap-1">
      ★ <span className="font-semibold">{manga.score.toFixed(1)}</span>
    </span>
  )}
  <span className="text-xs text-zinc-600">
    {formatNumber(manga.views)} vistas
  </span>
</div>

{/* Botón favorito */}
<div className="mb-5">
  <FavoriteButton mangaId={manga.id} />
</div>

{/* Galería de páginas */}
<MangaPageGallery
  chapters={chapters.map((c: ChapterItem) => ({
    id:        c.id,
    mangaId:   c.manga_id,
    number:    c.number,
    title:     c.title,
    pages:     c.pages,
    views:     BigInt(c.views),
    createdAt: c.created_at,
  }))}
  mangaSlug={slug}
/>
        
      </div>
    </>
  )
}