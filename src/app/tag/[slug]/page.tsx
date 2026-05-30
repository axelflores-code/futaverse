import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { MangaCard } from '@/components/manga/MangaCard'
import Link from 'next/link'
import type { Manga } from '@/types/manga'

export default async function TagPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  // Buscar el tag
  const { data: tag } = await supabase
    .from('tags')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!tag) notFound()

  // Buscar mangas con este tag
  const { data: mangaTags } = await supabase
    .from('manga_tags')
    .select(`
      mangas (
        id, slug, title, cover_url, status, score, rating,
        description, views, created_at, updated_at, autor,
        manga_genres ( genres ( id, name, slug ) )
      )
    `)
    .eq('tag_id', tag.id)

  const mangas: Manga[] = (mangaTags ?? [])
    .map((mt: Record<string, unknown>) => {
      const m = mt.mangas as Record<string, unknown>
      if (!m) return null
      return {
        id:                m.id as string,
        slug:              m.slug as string,
        title:             m.title as string,
        coverUrl:          m.cover_url as string | null,
        status:            m.status as Manga['status'],
        score:             m.score as number,
        rating:            m.rating as Manga['rating'],
        description:       m.description as string | null,
        views:             m.views as bigint,
        autor:            m.autor as string | null,
        artist:            null,
        alternativeTitles: [],
        genres: ((m.manga_genres as Array<{ genres: { id: string; name: string; slug: string } }>) ?? [])
          .map(mg => mg.genres),
        createdAt:  m.created_at as string,
        updatedAt:  m.updated_at as string,
      }
    })
    .filter(Boolean) as Manga[]

  const NS_LABELS: Record<string, string> = {
    theme:           'Tema',
    trope:           'Tropo',
    setting:         'Ambientación',
    format:          'Formato',
    content_warning: 'Advertencia de contenido',
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="mb-8">
        <Link
          href="/manga"
          className="text-xs text-zinc-600 hover:text-zinc-400 flex items-center gap-1 mb-4 transition-colors"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
          </svg>
          Catálogo
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            {NS_LABELS[tag.namespace] ?? tag.namespace}
          </span>
        </div>

        <h1 className="text-3xl font-bold text-white mb-1">{tag.name}</h1>
        <p className="text-zinc-500 text-sm">
          {mangas.length} manga{mangas.length !== 1 ? 's' : ''} con este tag
        </p>
      </div>

      {/* Grid */}
      {mangas.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-zinc-600">No hay mangas con el tag "{tag.name}" todavía.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {mangas.map((manga, i) => (
            <MangaCard key={manga.id} manga={manga} priority={i < 6} />
          ))}
        </div>
      )}
    </div>
  )
}