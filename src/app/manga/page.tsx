// src/app/manga/page.tsx

import { createClient } from '@/lib/supabase/server'
import { MangaCatalog } from '@/components/manga/MangaCatalog'
import { Pagination } from '@/components/ui/Pagination'
import { getAllCategories } from '@/lib/queries/categories'
import { getAllTags } from '@/lib/queries/tag'
import type { Manga } from '@/types/manga'

export const revalidate = 1800

const PAGE_SIZE = 24

function mapManga(m: Record<string, unknown>): Manga {
  return {
    id:                m.id as string,
    slug:              m.slug as string,
    title:             m.title as string,
    alternativeTitles: [],
    description:       m.description as string | null,
    coverUrl:          m.cover_url as string | null,
    status:            m.status as Manga['status'],
    rating:            m.rating as Manga['rating'],
    score:             m.score as number,
    views:             BigInt(m.views as number),
    author:            m.author as string | null,
    artist:            null,
    genres:            ((m.manga_genres as Array<{ genres: { id: string; name: string; slug: string } }>) ?? [])
                         .map(mg => mg.genres).filter(Boolean),
    createdAt:         m.created_at as string,
    updatedAt:         m.updated_at as string,
  }
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; sortBy?: string }>
}) {
  const { page: pageParam, status, sortBy = 'updatedAt' } = await searchParams
  const page    = Math.max(1, Number(pageParam ?? 1))
  const from    = (page - 1) * PAGE_SIZE
  const to      = from + PAGE_SIZE - 1

  const supabase = await createClient()

  const sortColumn = sortBy === 'updatedAt' ? 'updated_at'
    : sortBy === 'createdAt' ? 'created_at'
    : sortBy === 'score'     ? 'score'
    : sortBy === 'views'     ? 'views'
    : 'updated_at'

  let query = supabase
    .from('mangas')
    .select('*, manga_genres(genres(id,name,slug))', { count: 'exact' })
    .order(sortColumn, { ascending: false })
    .range(from, to)

  if (status) query = query.eq('status', status)

  const [{ data: mangasRaw, count }, categories, tags] = await Promise.all([
    query,
    getAllCategories(),
    getAllTags(),
  ])

  const mangas  = (mangasRaw ?? []).map(mapManga)
  const total   = count ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: '#f0ece8' }}>
          Catálogo
          <span className="text-sm font-normal ml-2" style={{ color: 'rgba(160,152,144,0.6)' }}>
            ({total} títulos)
          </span>
        </h1>
      </div>

      <MangaCatalog
        initialMangas={mangas}
        categories={categories}
        tags={tags}
      />

      {totalPages > 1 && (
        <div className="mt-10 flex justify-center">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            basePath="/manga"
            searchParams={{ status, sortBy }}
          />
        </div>
      )}
    </div>
  )
}