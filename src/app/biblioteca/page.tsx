import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import type { FavoriteStatus } from '@/types/manga'

const STATUS_LABELS: Record<FavoriteStatus, string> = {
  reading:      '📖 Leyendo',
  completed:    '✅ Completado',
  on_hold:      '⏸ En pausa',
  dropped:      '❌ Abandonado',
  plan_to_read: '📌 Pendiente',
}

const STATUS_TABS: FavoriteStatus[] = [
  'reading', 'completed', 'on_hold', 'dropped', 'plan_to_read'
]

export default async function BibliotecaPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?redirectTo=/biblioteca')

  const { status: statusParam } = await searchParams
  const activeStatus = (statusParam as FavoriteStatus) ?? 'reading'

  const { data: favorites } = await supabase
    .from('favorites')
    .select(`
      *,
      mangas (
        id, slug, title, cover_url, status, score
      )
    `)
    .eq('user_id', user.id)
    .eq('status', activeStatus)
    .order('updated_at', { ascending: false })

  // Conteos por status
  const { data: allFavorites } = await supabase
    .from('favorites')
    .select('status')
    .eq('user_id', user.id)

  const counts = STATUS_TABS.reduce((acc, s) => {
    acc[s] = (allFavorites ?? []).filter(f => f.status === s).length
    return acc
  }, {} as Record<FavoriteStatus, number>)

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-8">Mi biblioteca</h1>

      {/* Tabs de status */}
      <div className="flex gap-2 flex-wrap mb-8 border-b border-white/5 pb-4">
        {STATUS_TABS.map(s => (
          <Link
            key={s}
            href={`/biblioteca?status=${s}`}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeStatus === s
                ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                : 'text-zinc-500 hover:text-white hover:bg-white/5'
            }`}
          >
            {STATUS_LABELS[s]}
            {counts[s] > 0 && (
              <span className="ml-2 text-xs opacity-70">({counts[s]})</span>
            )}
          </Link>
        ))}
      </div>

      {/* Grid de mangas */}
      {(favorites ?? []).length === 0 ? (
        <div className="text-center py-20">
          <p className="text-zinc-600 text-sm mb-2">
            No tienes mangas en "{STATUS_LABELS[activeStatus]}"
          </p>
          <Link
            href="/manga"
            className="text-sm text-red-400 hover:text-red-300 transition-colors"
          >
            Explorar catálogo →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {(favorites ?? []).map((fav: Record<string, unknown>) => {
            const manga = fav.mangas as {
              id: string; slug: string; title: string
              cover_url: string | null; status: string; score: number
            }
            if (!manga) return null

            return (
              <Link
                key={fav.id as string}
                href={`/manga/${manga.slug}`}
                className="group flex flex-col rounded-lg overflow-hidden border border-white/5 bg-[#111] hover:border-red-500/30 hover:scale-[1.02] transition-all duration-200"
              >
                <div className="relative aspect-[2/3] bg-[#1a1a1a] overflow-hidden">
                  {manga.cover_url ? (
                    <Image
                      src={manga.cover_url}
                      alt={manga.title}
                      fill
                      sizes="(max-width: 640px) 50vw, 16vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-700 text-xs">
                      Sin portada
                    </div>
                  )}
                  {manga.score > 0 && (
                    <div className="absolute bottom-2 right-2 bg-black/70 text-yellow-400 text-[10px] font-bold px-1.5 py-0.5 rounded">
                      ★ {manga.score.toFixed(1)}
                    </div>
                  )}
                </div>
                <div className="p-2.5">
                  <h3 className="text-xs font-semibold text-white leading-tight line-clamp-2">
                    {manga.title}
                  </h3>
                  {(fav.progress as number) > 0 && (
                    <p className="text-[10px] text-zinc-600 mt-1">
                      Cap. {fav.progress as number}
                    </p>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}