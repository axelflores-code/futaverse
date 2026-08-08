import { createClient } from '@/lib/supabase/server'
import Image            from 'next/image'
import Link             from 'next/link'
import type { Manga }   from '@/types/manga'

interface MangaRelatedProps {
  mangaId:   string
  mangaSlug: string
}

interface MangaRow {
  id: string; slug: string; title: string; cover_url: string | null
  status: string; score: number; rating: string; description: string | null
  views: number; created_at: string; updated_at: string; author: string | null
  manga_genres: Array<{ genres: { id: string; name: string; slug: string } }>
}

export async function MangaRelated({ mangaId, mangaSlug }: MangaRelatedProps) {
  const supabase = await createClient()

  // 1. Obtener tags del manga actual
  const { data: currentTags } = await supabase
    .from('manga_tags')
    .select('tag_id')
    .eq('manga_id', mangaId)

  if (!currentTags || currentTags.length === 0) return null

  const tagIds = currentTags.map(t => t.tag_id)

  // 2. Buscar mangas que comparten esos tags (excluyendo el actual)
  const { data: relatedTagData } = await supabase
    .from('manga_tags')
    .select('manga_id')
    .in('tag_id', tagIds)
    .neq('manga_id', mangaId)

  if (!relatedTagData || relatedTagData.length === 0) return null

  // 3. Contar coincidencias por manga — más tags en común = más relevante
  const countMap: Record<string, number> = {}
  relatedTagData.forEach(({ manga_id }) => {
    countMap[manga_id] = (countMap[manga_id] ?? 0) + 1
  })

  // 4. Ordenar por coincidencias y tomar los top 6
  const topIds = Object.entries(countMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([id]) => id)

  if (topIds.length === 0) return null

  // 5. Obtener datos completos de esos mangas
  const { data: mangasRaw } = await supabase
    .from('mangas')
    .select('*, manga_genres(genres(id, name, slug))')
    .in('id', topIds)

  if (!mangasRaw || mangasRaw.length === 0) return null

  // Ordenar según relevancia
  const mangas = topIds
    .map(id => mangasRaw.find(m => m.id === id))
    .filter(Boolean) as MangaRow[]

  return (
    <section style={{ marginTop: '48px', paddingTop: '32px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#f0ece8', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ width: '3px', height: '18px', borderRadius: '2px', background: '#3D5A9E', display: 'inline-block' }} />
          También te puede gustar
        </h2>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px' }} className="related-grid">
        {mangas.map((manga) => {
          const genres = (manga.manga_genres ?? []).map((mg: { genres: { id: string; name: string; slug: string } }) => mg.genres)
          const sharedCount = countMap[manga.id] ?? 0

          return (
            <Link
              key={manga.id}
              href={`/manga/${manga.slug}`}
              style={{ display: 'flex', flexDirection: 'column', borderRadius: '10px', overflow: 'hidden', background: '#111118', border: '1px solid rgba(255,255,255,0.06)', textDecoration: 'none', transition: 'all .2s' }}
            >
              {/* Portada */}
              <div style={{ position: 'relative', aspectRatio: '2/3', background: '#18181f', overflow: 'hidden' }}>
                {manga.cover_url ? (
                  <Image
                    src={manga.cover_url}
                    alt={manga.title}
                    fill
                    sizes="(max-width: 640px) 50vw, 16vw"
                    style={{ objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.1)' }}>
                    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                    </svg>
                  </div>
                )}

                {/* Badge estado */}
                <span style={{
                  position: 'absolute', top: '6px', left: '6px',
                  fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px',
                  background: manga.status === 'ongoing' ? '#1D9E75' : manga.status === 'completed' ? '#3D5A9E' : '#C4956A',
                  color: '#0c0c12',
                }}>
                  {manga.status === 'ongoing' ? 'En curso' : manga.status === 'completed' ? 'Completo' : 'Pausado'}
                </span>

                {/* Score */}
                {manga.score > 0 && (
                  <span style={{ position: 'absolute', bottom: '5px', right: '5px', fontSize: '10px', fontWeight: 700, padding: '2px 5px', borderRadius: '4px', background: 'rgba(10,10,15,0.85)', color: '#C4956A' }}>
                    ★ {manga.score.toFixed(1)}
                  </span>
                )}

                {/* Badge de tags en común */}
                <span style={{ position: 'absolute', top: '6px', right: '6px', fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: 'rgba(61,90,158,0.85)', color: '#fff' }}>
                  {sharedCount} en común
                </span>
              </div>

              {/* Info */}
              <div style={{ padding: '8px 10px' }}>
                <p style={{ fontSize: '11px', fontWeight: 600, color: '#f0ece8', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {manga.title}
                </p>
                {genres.length > 0 && (
                  <p style={{ fontSize: '10px', color: 'rgba(196,149,106,0.6)', marginTop: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {genres.slice(0, 2).map((g: { name: string }) => g.name).join(' · ')}
                  </p>
                )}
              </div>
            </Link>
          )
        })}
      </div>

      <style>{`
        .related-grid:hover > a { opacity: 0.7; }
        .related-grid > a:hover { opacity: 1 !important; transform: scale(1.03); border-color: rgba(196,149,106,0.25) !important; }
        @media (max-width: 1024px) { .related-grid { grid-template-columns: repeat(4, 1fr) !important; } }
        @media (max-width: 640px)  { .related-grid { grid-template-columns: repeat(3, 1fr) !important; } }
        @media (max-width: 480px)  { .related-grid { grid-template-columns: repeat(2, 1fr) !important; } }
      `}</style>
    </section>
  )
}