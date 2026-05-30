import { Suspense } from 'react'
import { getLatestUpdated } from '@/lib/queries/manga'
import { MangaGrid } from '@/components/manga/MangaGrid'
import { Skeleton } from '@/components/ui/Skeleton'

export const revalidate = 300

export default async function HomePage() {
  const mangas = await getLatestUpdated(12)

  return (
  <div className="max-w-7xl mx-auto px-4 py-8">

    {/* Hero */}
    <section className="mb-12 text-center py-12">
      <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
        Tu universo manga
      </h1>

      <p className="text-zinc-400 text-lg max-w-xl mx-auto">
        Miles de títulos actualizados. Lee gratis desde cualquier dispositivo.
      </p>
    </section>

    {/* Últimas actualizaciones */}
    <section>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">
          Últimas actualizaciones
        </h2>

        <a
          href="/manga"
          className="text-sm text-red-400 hover:text-red-300 transition-colors"
        >
          Ver todo →
        </a>
      </div>

      <Suspense
        fallback={
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[2/3] rounded-lg" />
            ))}
          </div>
        }
      >
        <MangaGrid mangas={mangas} />
      </Suspense>
    </section>

  </div>
);}