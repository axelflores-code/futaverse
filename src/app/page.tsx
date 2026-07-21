// src/app/page.tsx


import type { Metadata }             from 'next'
import { createClient }          from '@/lib/supabase/server'
import { MangaHeroCarousel }     from '@/components/manga/MangaHeroCarousel'
import { MangaRowScroll }        from '@/components/manga/MangaRowScroll'
import { MangaCard }             from '@/components/manga/MangaCard'
import Link                      from 'next/link'
import type { Manga }            from '@/types/manga'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'MangaFuta — Manga Futanari en Español | Lee Gratis',
  description: 'La mejor plataforma de manga futanari traducido al español para Latino América. Lee cientos de títulos de manga futa, dickgirl y hentai en español completamente gratis.',
  keywords: [
    'manga futanari español',
    'manga futa gratis',
    'futanari manga latino',
    'manga dickgirl español',
    'hentai español gratis',
    'manga futa online',
    'leer manga futanari',
    'manga +18 español',
    'manga hentai latino gratis',
    'futanari en español',
  ],
  alternates: {
    canonical: 'https://mangafuta.com',
  },
  openGraph: {
    title: 'MangaFuta — Manga Futanari en Español',
    description: 'La mejor plataforma de manga futanari traducido al español para Latino América. Lee gratis.',
    url: 'https://mangafuta.com',
    siteName: 'MangaFuta',
    locale: 'es_LA',
    type: 'website',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'MangaFuta' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MangaFuta — Manga Futanari en Español',
    description: 'La mejor plataforma de manga futanari traducido al español para Latino América.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

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

export default async function HomePage() {
  const supabase = await createClient()

  const [
    { data: heroRaw },
    { data: popularRaw },
    { data: latestRaw },
    { data: topTags },
  ] = await Promise.all([
    supabase
      .from('mangas')
      .select('*, manga_genres(genres(id,name,slug))')
      .neq('status', 'draft')
      .order('score', { ascending: false })
      .limit(6),
    supabase
      .from('mangas')
      .select('*, manga_genres(genres(id,name,slug))')
      .neq('status', 'draft')
      .order('views', { ascending: false })
      .limit(12),
    supabase
      .from('mangas')
      .select('*, manga_genres(genres(id,name,slug))')
      .neq('status', 'draft')
      .order('updated_at', { ascending: false })
      .limit(14),
    supabase
      .from('tags')
      .select('id, name, slug, namespace, usage_count')
      .gt('usage_count', 0)
      .order('usage_count', { ascending: false })
      .limit(10),
  ])

  const heroMangas    = (heroRaw    ?? []).map(mapManga)
  const popularMangas = (popularRaw ?? []).map(mapManga)
  const latestMangas  = (latestRaw  ?? []).map(mapManga)

  const tagSections = await Promise.all(
    (topTags ?? []).slice(0, 3).map(async (tag) => {
      const { data: mangaTags } = await supabase
        .from('manga_tags')
        .select('mangas(*, manga_genres(genres(id,name,slug)))')
        .eq('tag_id', tag.id)
        .limit(6)

      const mangas = (mangaTags ?? [])
        .map((mt: Record<string, unknown>) => mt.mangas as Record<string, unknown>)
        .filter(Boolean)
        .map(mapManga)

      return { tag, mangas }
    })
  )

  return (
    <div>
      {/* Hero carousel — full width */}
      <MangaHeroCarousel mangas={heroMangas} />

      {/* Texto SEO visible para Google */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 16px 0' }}>
        <p style={{ fontSize: '13px', color: 'rgba(160,152,144,0.4)', lineHeight: 1.6 }}>
          Bienvenido a <strong style={{ color: 'rgba(160,152,144,0.6)' }}>MangaFuta</strong> — 
          la plataforma líder de <strong style={{ color: 'rgba(160,152,144,0.6)' }}>manga futanari en español</strong> para Latino América. 
          Lee gratis los mejores títulos de manga futa, dickgirl y hentai traducidos al español.
        </p>
      </div>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 16px' }}>

        {/* Popular hoy */}
        <MangaRowScroll
          mangas={popularMangas}
          title="Popular hoy"
          href="/manga?sortBy=views"
        />

        {/* Últimas actualizaciones */}
        <section style={{ marginBottom: '48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#f0ece8', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ width: '3px', height: '20px', borderRadius: '2px', background: '#C4956A', display: 'inline-block' }} />
              Últimas actualizaciones
            </h2>
            <Link href="/manga" style={{ fontSize: '13px', color: '#C4956A', textDecoration: 'none' }}>
              Ver todo →
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px' }} className="latest-grid">
            {latestMangas.map((manga, i) => (
              <MangaCard key={manga.id} manga={manga} priority={i < 7} />
            ))}
          </div>
        </section>

        {/* Secciones por tag popular */}
        {tagSections.map(({ tag, mangas }) => {
          if (mangas.length === 0) return null
          return (
            <section key={tag.id} style={{ marginBottom: '48px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#f0ece8', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ width: '3px', height: '20px', borderRadius: '2px', background: '#3D5A9E', display: 'inline-block' }} />
                  {tag.name}
                  <span style={{ fontSize: '11px', fontWeight: 400, padding: '2px 8px', borderRadius: '20px', background: 'rgba(61,90,158,0.12)', color: '#3D5A9E', border: '1px solid rgba(61,90,158,0.20)' }}>
                    {tag.usage_count} obras
                  </span>
                </h2>
                <Link
                  href={`/tag/${tag.slug}`}
                  style={{ fontSize: '13px', color: '#3D5A9E', textDecoration: 'none' }}
                >
                  Ver todo →
                </Link>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px' }} className="tag-grid">
                {mangas.map((manga) => (
                  <MangaCard key={manga.id} manga={manga} priority={false} />
                ))}
              </div>
            </section>
          )
        })}

        {/* Tags populares */}
        <section style={{ marginBottom: '48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#f0ece8', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ width: '3px', height: '20px', borderRadius: '2px', background: '#C4956A', display: 'inline-block' }} />
              Tags populares
            </h2>
            <Link href="/tags" style={{ fontSize: '13px', color: '#C4956A', textDecoration: 'none' }}>
              Ver todos →
            </Link>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {(topTags ?? []).map(tag => (
              <Link
                key={tag.id}
                href={`/tag/${tag.slug}`}
                style={{
                  display:        'inline-flex',
                  alignItems:     'center',
                  gap:            '6px',
                  padding:        '8px 16px',
                  borderRadius:   '20px',
                  fontSize:       '13px',
                  fontWeight:     500,
                  textDecoration: 'none',
                  background:     'rgba(255,255,255,0.04)',
                  border:         '1px solid rgba(255,255,255,0.08)',
                  color:          'rgba(200,192,184,1)',
                  transition:     'all .15s',
                }}
              >
                {tag.name}
                <span style={{ fontSize: '11px', padding: '1px 6px', borderRadius: '10px', background: 'rgba(196,149,106,0.12)', color: '#C4956A' }}>
                  {tag.usage_count}
                </span>
              </Link>
            ))}
          </div>
        </section>

      </div>

      <style>{`
        @media (max-width: 1024px) { .latest-grid { grid-template-columns: repeat(4, 1fr) !important; } }
        @media (max-width: 640px)  { .latest-grid { grid-template-columns: repeat(3, 1fr) !important; } }
        @media (max-width: 480px)  { .latest-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 1024px) { .tag-grid { grid-template-columns: repeat(4, 1fr) !important; } }
        @media (max-width: 640px)  { .tag-grid { grid-template-columns: repeat(3, 1fr) !important; } }
        @media (max-width: 480px)  { .tag-grid { grid-template-columns: repeat(2, 1fr) !important; } }
      `}</style>
    </div>
  )
}