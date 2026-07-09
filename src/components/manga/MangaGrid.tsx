import { MangaCard } from '@/components/manga/MangaCard';
import type { Manga } from '@/types/manga'

interface MangaGridProps {
  mangas: Manga[]
}

export function MangaGrid({ mangas }: MangaGridProps) {
  if (mangas.length === 0) {
    return (
      <p className="text-zinc-500 text-sm">No hay mangas disponibles.</p>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {mangas.map((manga, i) => (
  <MangaCard key={manga.id} manga={manga} priority={i < 3} />
))}
    </div>
  )
}