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

type Status = 'ongoing' | 'completed' | 'hiatus' | ''
type Sort   = 'recent' | 'oldest' | 'popular' | 'score'

const STATUS_OPTIONS: { value: Status; label: string }[] = [
  { value: '',          label: 'Todos'    },
  { value: 'ongoing',   label: 'En curso' },
  { value: 'completed', label: 'Completo' },
  { value: 'hiatus',    label: 'Pausado'  },
]

const SORT_OPTIONS: { value: Sort; label: string }[] = [
  { value: 'recent',  label: 'Recientes'    },
  { value: 'oldest',  label: 'Más antiguos' },
  { value: 'popular', label: 'Populares'    },
  { value: 'score',   label: 'Mejor score'  },
]

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; sort?: string }>
}) {
  const { page: pageParam, status = '', sort = 'recent' } = await searchParams
  const currentPage = Math.max(1, Number(pageParam ?? 1))
  const from        = (currentPage - 1) * PAGE_SIZE
  const to          = from + PAGE_SIZE - 1
  const supabase    = await createClient()

  const orderCol = sort === 'popular' ? 'views'
    : sort === 'score'  ? 'score'
    : sort === 'oldest' ? 'created_at'
    : 'updated_at'

  const ascending = sort === 'oldest'

  let query = supabase
    .from('mangas')
    .select('*, manga_genres(genres(id,name,slug))', { count: 'exact' })
    .order(orderCol, { ascending })
    .range(from, to)

  if (status) query = query.eq('status', status)

  const [{ data: mangasRaw, count }, categories, tags] = await Promise.all([
    query,
    getAllCategories(),
    getAllTags(),
  ])

  const mangas     = (mangasRaw ?? []).map(mapManga)
  const total      = count ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 16px' }}>

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#f0ece8', display: 'flex', alignItems: 'baseline', gap: '10px' }}>
          Catálogo
          <span style={{ fontSize: '14px', fontWeight: 400, color: 'rgba(160,152,144,0.5)' }}>
            ({total.toLocaleString()} títulos)
          </span>
        </h1>
      </div>

      {/* Panel de filtros */}
      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '14px', padding: '16px 20px', marginBottom: '28px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

        {/* Ordenar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: 'rgba(96,88,80,1)', minWidth: '60px' }}>
            Ordenar
          </span>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {SORT_OPTIONS.map(opt => (
              <Link
                key={opt.value}
                href={`/manga?sort=${opt.value}&status=${status}`}
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
                    : 'rgba(255,255,255,0.07)'}`,
                  color:          sort === opt.value ? '#0c0c12' : 'rgba(175,167,158,1)',
                }}
              >
                {opt.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Separador */}
        <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

        {/* Estado */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: 'rgba(96,88,80,1)', minWidth: '60px' }}>
            Estado
          </span>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {STATUS_OPTIONS.map(opt => (
              <Link
                key={opt.value}
                href={`/manga?status=${opt.value}&sort=${sort}`}
                style={{
                  padding:        '6px 14px',
                  borderRadius:   '20px',
                  fontSize:       '13px',
                  fontWeight:     status === opt.value ? 600 : 400,
                  textDecoration: 'none',
                  transition:     'all .15s',
                  background:     status === opt.value ? '#C4956A' : 'rgba(255,255,255,0.04)',
                  border:         `1px solid ${status === opt.value ? '#C4956A' : 'rgba(255,255,255,0.07)'}`,
                  color:          status === opt.value ? '#0c0c12' : 'rgba(175,167,158,1)',
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
            searchParams={{ status, sort }}
          />
        </div>
      )}
    </div>
  )
}