// src/app/tag/[slug]/page.tsx

import { createClient } from '@/lib/supabase/server'
import { notFound }     from 'next/navigation'
import { MangaCard }    from '@/components/manga/MangaCard'
import { Pagination }   from '@/components/ui/Pagination'
import Link             from 'next/link'
import type { Manga }   from '@/types/manga'

interface PageProps {
  params:      Promise<{ slug: string }>
  searchParams: Promise<{ page?: string }>
}

const PAGE_SIZE = 24

interface MangaRow {
  id: string; slug: string; title: string; cover_url: string | null
  status: string; score: number; rating: string; description: string | null
  views: number; created_at: string; updated_at: string; author: string | null
  manga_genres: Array<{ genres: { id: string; name: string; slug: string } }>
}

const NS_LABELS: Record<string, string> = {
  theme:           'Tema',
  trope:           'Tropo',
  setting:         'Ambientación',
  format:          'Formato',
  content_warning: 'Advertencia de contenido',
}

export default async function TagPage({ params, searchParams }: PageProps) {
  const { slug }  = await params
  const { page: pageParam } = await searchParams
  const currentPage = Math.max(1, Number(pageParam ?? 1))
  const from = (currentPage - 1) * PAGE_SIZE
  const to   = from + PAGE_SIZE - 1

  const supabase = await createClient()

  const { data: tag } = await supabase
    .from('tags')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!tag) notFound()

  // Contar total
  const { count } = await supabase
    .from('manga_tags')
    .select('*', { count: 'exact', head: true })
    .eq('tag_id', tag.id)

  // Obtener mangas paginados
  const { data: mangaTags } = await supabase
    .from('manga_tags')
    .select('mangas(*, manga_genres(genres(id, name, slug)))')
    .eq('tag_id', tag.id)
    .range(from, to)

  const total      = count ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  const mangas: Manga[] = ((mangaTags ?? []) as unknown as Array<{ mangas: MangaRow }>)
    .map(mt => mt.mangas)
    .filter(Boolean)
    .map((m: MangaRow) => ({
      id:                m.id,
      slug:              m.slug,
      title:             m.title,
      coverUrl:          m.cover_url,
      status:            m.status as Manga['status'],
      score:             m.score,
      rating:            m.rating as Manga['rating'],
      description:       m.description,
      views:             BigInt(m.views),
      author:            m.author,
      artist:            null,
      alternativeTitles: [],
      genres:            (m.manga_genres ?? []).map(mg => mg.genres),
      createdAt:         m.created_at,
      updatedAt:         m.updated_at,
    }))

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 16px' }}>

      {/* Volver */}
      <Link
        href="/manga"
        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: 'rgba(96,88,80,1)', textDecoration: 'none', marginBottom: '20px' }}
      >
        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
        </svg>
        Catálogo
      </Link>

      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <p style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', color: '#3D5A9E', marginBottom: '6px' }}>
          {NS_LABELS[tag.namespace] ?? tag.namespace}
        </p>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#f0ece8', marginBottom: '6px' }}>
          {tag.name}
        </h1>
        <p style={{ fontSize: '13px', color: 'rgba(160,152,144,0.6)' }}>
          {total} manga{total !== 1 ? 's' : ''} con este tag
        </p>
      </div>

      {/* Grid */}
      {mangas.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(160,152,144,0.4)', fontSize: '14px' }}>
          No hay mangas con el tag "{tag.name}" todavía.
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px', marginBottom: '40px' }} className="tag-page-grid">
            {mangas.map((manga, i) => (
              <MangaCard key={manga.id} manga={manga} priority={i < 6} />
            ))}
          </div>

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                basePath={`/tag/${slug}`}
                searchParams={{}}
              />
            </div>
          )}
        </>
      )}

      <style>{`
        @media (max-width: 1024px) { .tag-page-grid { grid-template-columns: repeat(4, 1fr) !important; } }
        @media (max-width: 640px)  { .tag-page-grid { grid-template-columns: repeat(3, 1fr) !important; } }
        @media (max-width: 480px)  { .tag-page-grid { grid-template-columns: repeat(2, 1fr) !important; } }
      `}</style>
    </div>
  )
}