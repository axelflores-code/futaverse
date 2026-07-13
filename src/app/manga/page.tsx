// src/app/manga/page.tsx

import { createClient }    from '@/lib/supabase/server'
import { getAllCategories } from '@/lib/queries/categories'
import { getAllTags }       from '@/lib/queries/tag'
import { MangaCatalog }    from '@/components/manga/MangaCatalog'
import { Pagination }      from '@/components/ui/Pagination'
import Link                from 'next/link'
import type { Manga }      from '@/types/manga'

export const revalidate = 900 // 15 min

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

const PERIOD_LABELS: Record<Period, string> = {
  today: 'Hoy',
  week:  'Esta semana',
  month: 'Este mes',
  all:   'Todo el tiempo',
}

const STATUS_OPTIONS: { value: Status; label: string }[] = [
  { value: '',          label: 'Todos'    },
  { value: 'ongoing',   label: 'En curso' },
  { value: 'completed', label: 'Completo' },
  { value: 'hiatus',    label: 'Pausado'  },
]

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?:   string
    status?: string
    period?: string
    sortBy?: string
  }>
}) {
  const {
    page:   pageParam,
    status  = '',
    period  = 'all',
    sortBy  = 'updatedAt',
  } = await searchParams

  const currentPage = Math.max(1, Number(pageParam ?? 1))
  const from        = (currentPage - 1) * PAGE_SIZE
  const to          = from + PAGE_SIZE - 1
  const supabase    = await createClient()

  let mangas: Manga[] = []
  let total           = 0

  if (period !== 'all' || sortBy === 'popular') {
    // Usar la función RPC para popularidad por período
    const { data: popularIds } = await supabase.rpc('get_popular_mangas', {
      period: period === 'all' ? 'all' : period,
      lim:    200,
    })

    if (popularIds && popularIds.length > 0) {
      const ids = popularIds.map((r: { manga_id: string }) => r.manga_id)

      let query = supabase
        .from('mangas')
        .select('*, manga_genres(genres(id,name,slug))', { count: 'exact' })
        .in('id', ids)

      if (status) query = query.eq('status', status)

      const { data, count } = await query.range(from, to)
      total  = count ?? 0

      // Ordenar por popularidad según el resultado del RPC
      const sorted = (data ?? []).sort((a, b) => {
        const aIdx = ids.indexOf(a.id)
        const bIdx = ids.indexOf(b.id)
        return aIdx - bIdx
      })

      mangas = sorted.map(mapManga)
    }
  } else {
    // Orden normal
    const sortColumn = sortBy === 'score'
      ? 'score'
      : sortBy === 'views'
      ? 'views'
      : sortBy === 'createdAt'
      ? 'created_at'
      : 'updated_at'

    let query = supabase
      .from('mangas')
      .select('*, manga_genres(genres(id,name,slug))', { count: 'exact' })
      .order(sortColumn, { ascending: false })
      .range(from, to)

    if (status) query = query.eq('status', status)

    const { data, count } = await query
    total  = count ?? 0
    mangas = (data ?? []).map(mapManga)
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const [categories, tags] = await Promise.all([getAllCategories(), getAllTags()])

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold" style={{ color: '#f0ece8' }}>
          Catálogo
          <span className="text-sm font-normal ml-2"
            style={{ color: 'rgba(160,152,144,0.6)' }}
          >
            ({total} títulos)
          </span>
        </h1>
      </div>

      {/* Filtro de popularidad por período */}
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-wider mb-2"
          style={{ color: 'rgba(96,88,80,1)' }}
        >
          Popular:
        </p>
        <div className="flex gap-2 flex-wrap">
          {(Object.entries(PERIOD_LABELS) as [Period, string][]).map(([p, label]) => (
            <Link
              key={p}
              href={`/manga?period=${p}&status=${status}&sortBy=${sortBy}`}
              className="px-4 py-1.5 rounded-full text-sm font-medium transition-all"
              style={period === p ? {
                background:  'rgba(196,149,106,0.15)',
                border:      '1px solid #C4956A',
                color:       '#C4956A',
              } : {
                background:  'rgba(255,255,255,0.04)',
                border:      '1px solid rgba(255,255,255,0.08)',
                color:       'rgba(160,152,144,0.8)',
              }}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* Filtro de estado */}
      <div className="flex gap-2 flex-wrap mb-6">
        {STATUS_OPTIONS.map(opt => (
          <Link
            key={opt.value}
            href={`/manga?status=${opt.value}&period=${period}&sortBy=${sortBy}`}
            className="px-4 py-1.5 rounded-full text-sm font-medium transition-all"
            style={status === opt.value ? {
              background:  'rgba(196,149,106,0.15)',
              border:      '1px solid #C4956A',
              color:       '#C4956A',
            } : {
              background:  'rgba(255,255,255,0.04)',
              border:      '1px solid rgba(255,255,255,0.08)',
              color:       'rgba(160,152,144,0.8)',
            }}
          >
            {opt.label}
          </Link>
        ))}
      </div>

      <MangaCatalog
        initialMangas={mangas}
        categories={categories}
        tags={tags}
      />

      {totalPages > 1 && (
        <div className="mt-10 flex justify-center">
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