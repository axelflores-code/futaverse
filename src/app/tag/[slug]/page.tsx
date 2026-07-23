// src/app/tag/[slug]/page.tsx

import { createClient } from '@/lib/supabase/server'
import { notFound }     from 'next/navigation'
import { MangaCard }    from '@/components/manga/MangaCard'
import { Pagination }   from '@/components/ui/Pagination'
import Link             from 'next/link'
import type { Manga }   from '@/types/manga'

interface PageProps {
  params:       Promise<{ slug: string }>
  searchParams: Promise<{ page?: string; sort?: string }>
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

const SORT_OPTIONS = [
  { value: 'recent',   label: 'Recientes'   },
  { value: 'oldest',   label: 'Más antiguos' },
  { value: 'popular',  label: 'Populares'    },
  { value: 'score',    label: 'Mejor score'  },
]

export default async function TagPage({ params, searchParams }: PageProps) {
  const { slug }  = await params
  const { page: pageParam, sort = 'recent' } = await searchParams
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

  // Ordenar según sort
  const orderCol = sort === 'popular' ? 'views'
    : sort === 'score'   ? 'score'
    : sort === 'oldest'  ? 'created_at'
    : 'updated_at'

  const ascending = sort === 'oldest'

  // Obtener IDs de mangas con este tag ordenados
  const { data: mangaTagIds, count } = await supabase
    .from('manga_tags')
    .select('manga_id', { count: 'exact' })
    .eq('tag_id', tag.id)

  const total      = count ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  // Obtener mangas ordenados
  const ids = (mangaTagIds ?? []).map(mt => mt.manga_id)

  let mangas: Manga[] = []

  if (ids.length > 0) {
    const { data: mangasRaw } = await supabase
      .from('mangas')
      .select('*, manga_genres(genres(id, name, slug))')
      .in('id', ids)
      .order(orderCol, { ascending })
      .range(from, to)

    mangas = (mangasRaw ?? []).map((m: MangaRow) => ({
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
  }

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
      <div style={{ marginBottom: '24px' }}>
        <p style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', color: '#3D5A9E', marginBottom: '6px' }}>
          {NS_LABELS[tag.namespace] ?? tag.namespace}
        </p>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#f0ece8', marginBottom: '6px' }}>
          {tag.name}
        </h1>
        <p style={{ fontSize: '13px', color: 'rgba(160,152,144,0.5)' }}>
          {total.toLocaleString()} manga{total !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Filtros de orden */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '24px', padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: 'rgba(96,88,80,1)', marginRight: '4px' }}>
          Ordenar:
        </span>
        {SORT_OPTIONS.map(opt => (
          <Link
            key={opt.value}
            href={`/tag/${slug}?sort=${opt.value}`}
            style={{
              padding:        '6px 14px',
              borderRadius:   '20px',
              fontSize:       '13px',
              fontWeight:     sort === opt.value ? 600 : 400,
              textDecoration: 'none',
              transition:     'all .15s',
              background:     sort === opt.value
                ? opt.value === 'popular' ? '#3D5A9E' : '#C4956A'
                : 'rgba(255,255,255,0.04)',
              border:         `1px solid ${sort === opt.value
                ? opt.value === 'popular' ? '#3D5A9E' : '#C4956A'
                : 'rgba(255,255,255,0.08)'}`,
              color:          sort === opt.value ? '#0c0c12' : 'rgba(175,167,158,1)',
            }}
          >
            {opt.label}
          </Link>
        ))}
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
                searchParams={{ sort }}
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