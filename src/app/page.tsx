import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { MangaHeroCarousel } from '@/components/manga/MangaHeroCarousel'
import { MangaRowScroll }    from '@/components/manga/MangaRowScroll'
import { MangaGrid }         from '@/components/manga/MangaGrid'
import { Skeleton }          from '@/components/ui/Skeleton'
import type { Manga } from '@/types/manga'

export const revalidate = 3600

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
    autor:            m.author as string | null,
    artist:            null,
    genres:            ((m.manga_genres as Array<{ genres: { id: string; name: string; slug: string } }>) ?? [])
                         .map(mg => mg.genres).filter(Boolean),
    createdAt:         m.created_at as string,
    updatedAt:         m.updated_at as string,
  }
}

export default async function HomePage() {
  const supabase = await createClient()

  // Hero — mangas con mejor score
  const { data: heroRaw } = await supabase
    .from('mangas')
    .select('*, manga_genres(genres(id,name,slug))')
    .order('score', { ascending: false })
    .limit(6)

  // Popular — más vistos
  const { data: popularRaw } = await supabase
    .from('mangas')
    .select('*, manga_genres(genres(id,name,slug))')
    .order('views', { ascending: false })
    .limit(12)

  // Últimas actualizaciones
  const { data: latestRaw } = await supabase
    .from('mangas')
    .select('*, manga_genres(genres(id,name,slug))')
    .order('updated_at', { ascending: false })
    .limit(12)

  const heroMangas    = (heroRaw    ?? []).map(mapManga)
  const popularMangas = (popularRaw ?? []).map(mapManga)
  const latestMangas  = (latestRaw  ?? []).map(mapManga)

return (
    <div>
      {/* Hero full width — fuera del contenedor */}
      <MangaHeroCarousel mangas={heroMangas} />

      <div className="max-w-7xl mx-auto px-4">
        {/* Popular hoy */}
        <MangaRowScroll
          mangas={popularMangas}
          title="Popular hoy"
          href="/manga"
        />

        {/* Últimas actualizaciones */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2"
              style={{ color: '#f0ece8' }}
            >
              <span className="w-1 h-5 rounded-full gradient-bg inline-block"/>
              Últimas actualizaciones
            </h2>
            <a href="/manga"
              className="text-xs"
              style={{ color: '#C4956A' }}
            >
              Ver todo →
            </a>
          </div>

          <Suspense fallback={
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[2/3] rounded-xl" />
              ))}
            </div>
          }>
            <MangaGrid mangas={latestMangas} />
          </Suspense>
        </section>
      </div>
    </div>
  )
}