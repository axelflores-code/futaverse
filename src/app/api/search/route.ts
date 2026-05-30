import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') ?? ''

  if (!q.trim()) {
    return NextResponse.json({ mangas: [] })
  }

  const supabase = await createClient()

  const { data } = await supabase
    .from('mangas')
    .select('id, slug, title, cover_url, status, score, rating, updated_at, manga_genres(genres(id, name, slug))')
    .ilike('title', `%${q}%`)
    .limit(24)

  const mangas = (data ?? []).map(m => ({
    id:                m.id,
    slug:              m.slug,
    title:             m.title,
    coverUrl:          m.cover_url,
    status:            m.status,
    score:             m.score,
    rating:            m.rating,
    alternativeTitles: [],
    description:       null,
    views:             0,
    author:            null,
    artist:            null,
    genres: (m.manga_genres ?? []).map((mg: Record<string, unknown>) => {
  const g = mg.genres as { id: string; name: string; slug: string }
  return g
}),
    createdAt:         m.updated_at,
    updatedAt:         m.updated_at,
  }))

  return NextResponse.json({ mangas })
}