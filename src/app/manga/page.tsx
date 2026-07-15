// src/app/manga/page.tsx

import { createClient }    from '@/lib/supabase/server'
import { getAllCategories } from '@/lib/queries/categories'
import { getAllTags }       from '@/lib/queries/tag'
import { MangaCatalog }    from '@/components/manga/MangaCatalog'
import { Pagination }      from '@/components/ui/Pagination'
import Link                from 'next/link'
import type { Manga }      from '@/types/manga'

export const revalidate = 900

const PAGE_SIZE = 24

type Period = 'today' | 'week' | 'month' | 'all'
type Status = 'ongoing' | 'completed' | 'hiatus' | ''

function mapManga(m: Record<string, unknown>): Manga {
  return {
    id:                m.id          as string,
    slug:              m.slug        as string,
    title:             m.title       as string,
    alternativeTitles: [],
    description:       m.description as string | null,
    coverUrl:          m.cover_url   as string | null,
    status:            m.status      as Manga['status'],
    rating:            m.rating      as Manga['rating'],
    score:             m.score       as number,
    views:             BigInt(m.views as number),
    author:            m.author      as string | null,
    artist:            null,
    genres: ((m.manga_genres as Array<{ genres: { id: string; name: string; slug: string } }>) ?? [])
              .map(mg => mg.genres).filter(Boolean),
    createdAt:  m.created_at  as string,
    updatedAt:  m.updated_at  as string,
  }
}

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: 'today', label: 'Hoy'           },
  { value: 'week',  label: 'Esta semana'   },
  { value: 'month', label: 'Este mes'      },
  { value: 'all',   label: 'Todo el tiempo'},
]

const STATUS_OPTIONS: { value: Status; label: string }[] = [
  { value: '',          label: 'Todos'    },
  { value: 'ongoing',   label: 'En curso' },
  { value: 'completed', label: 'Completo' },
  { value: 'hiatus',    label: 'Pausado'  },
]

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; period?: string; sortBy?: string }>
}) {
  const { page: pageParam, status = '', period = 'all', sortBy = 'updatedAt' } = await searchParams
  const currentPage = Math.max(1, Number(pageParam ?? 1))
  const from        = (currentPage - 1) * PAGE_SIZE
  const to          = from + PAGE_SIZE - 1
  const supabase    = await createClient()

  let mangas: Manga[] = []
  let total           = 0

  if (period !== 'all') {
    const { data: popularIds } = await supabase.rpc('get_popular_mangas', { period, lim: 200 })
    if (popularIds && popularIds.length > 0) {
      const ids = popularIds.map((r: { manga_id: string }) => r.manga_id)
      let query = supabase.from('mangas').select('*, manga_genres(genres(id,name,slug))', { count: 'exact' }).in('id', ids)
      if (status) query = query.eq('status', status)
      const { data, count } = await query.range(from, to)
      total  = count ?? 0
      const sorted = (data ?? []).sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id))
      mangas = sorted.map(mapManga)
    }
  } else {
    const sortColumn = sortBy === 'score' ? 'score' : sortBy === 'views' ? 'views' : sortBy === 'createdAt' ? 'created_at' : 'updated_at'
    let query = supabase.from('mangas').select('*, manga_genres(genres(id,name,slug))', { count: 'exact' }).order(sortColumn, { ascending: false }).range(from, to)
    if (status) query = query.eq('status', status)
    const { data, count } = await query
    total  = count ?? 0
    mangas = (data ?? []).map(mapManga)
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const [categories, tags] = await Promise.all([getAllCategories(), getAllTags()])

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 16px' }}>

      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#f0ece8', display: 'flex', alignItems: 'baseline', gap: '10px' }}>
          Catálogo
          <span style={{ fontSize: '14px', fontWeight: 400, color: 'rgba(160,152,144,0.5)' }}>
            ({total} títulos)
          </span>
        </h1>
      </div>

      {/* Filtros centrados */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginBottom: '32px', padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)' }}>

        {/* Popular por período */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '100%' }}>
          <p style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', color: 'rgba(96,88,80,1)' }}>
            Popular
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {PERIOD_OPTIONS.map(opt => (
              <Link
                key={opt.value}
                href={`/manga?period=${opt.value}&status=${status}`}
                style={{
                  padding:      '7px 18px',
                  borderRadius: '20px',
                  fontSize:     '13px',
                  fontWeight:   period === opt.value ? 600 : 400,
                  textDecoration: 'none',
                  transition:   'all .15s',
                  background:   period === opt.value ? '#3D5A9E' : 'rgba(255,255,255,0.04)',
                  border:       `1px solid ${period === opt.value ? '#3D5A9E' : 'rgba(255,255,255,0.08)'}`,
                  color:        period === opt.value ? '#fff' : 'rgba(175,167,158,1)',
                }}
              >
                {opt.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Separador */}
        <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.05)' }} />

        {/* Estado */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '100%' }}>
          <p style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', color: 'rgba(96,88,80,1)' }}>
            Estado
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {STATUS_OPTIONS.map(opt => (
              <Link
                key={opt.value}
                href={`/manga?status=${opt.value}&period=${period}`}
                style={{
                  padding:      '7px 18px',
                  borderRadius: '20px',
                  fontSize:     '13px',
                  fontWeight:   status === opt.value ? 600 : 400,
                  textDecoration: 'none',
                  transition:   'all .15s',
                  background:   status === opt.value ? '#C4956A' : 'rgba(255,255,255,0.04)',
                  border:       `1px solid ${status === opt.value ? '#C4956A' : 'rgba(255,255,255,0.08)'}`,
                  color:        status === opt.value ? '#0c0c12' : 'rgba(175,167,158,1)',
                }}
              >
                {opt.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <MangaCatalog
        initialMangas={mangas}
        categories={categories}
        tags={tags}
      />

      {/* Paginación */}
      {totalPages > 1 && (
        <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'center' }}>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            basePath="/manga"
            searchParams={{ status, period, sortBy }}
          />
        </div>
      )}
    </div>
  )
}