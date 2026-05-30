import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { Manga } from '@/types/manga'

interface MangaCardProps {
  manga: Manga
  priority?: boolean
}

export function MangaCard({ manga, priority = false }: MangaCardProps) {
  return (
    <Link
      href={`/manga/${manga.slug}`}
      className="group flex flex-col rounded-lg overflow-hidden border border-white/5 bg-[#111] hover:border-red-500/30 hover:scale-[1.02] transition-all duration-200"
    >
      {/* Portada */}
      <div className="relative aspect-[2/3] bg-[#1a1a1a] overflow-hidden">
        {manga.coverUrl ? (
          <Image
            src={manga.coverUrl}
            alt={manga.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            priority={priority}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-8 h-8 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
            </svg>
          </div>
        )}

        {/* Badge estado */}
        <div className="absolute top-2 left-2">
          <span className={cn(
            'text-[10px] font-semibold px-1.5 py-0.5 rounded-full',
            manga.status === 'ongoing'   && 'bg-green-500/90 text-white',
            manga.status === 'completed' && 'bg-blue-500/90 text-white',
            manga.status === 'hiatus'    && 'bg-yellow-500/90 text-black',
          )}>
            {manga.status === 'ongoing'   ? 'En curso' :
             manga.status === 'completed' ? 'Completo' : 'Pausado'}
          </span>
        </div>

        {/* Score */}
        {manga.score > 0 && (
          <div className="absolute bottom-2 right-2 bg-black/70 text-yellow-400 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
            ★ {manga.score.toFixed(1)}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-2.5 flex flex-col gap-1">
        <h3 className="text-xs font-semibold text-white leading-tight line-clamp-2">
          {manga.title}
        </h3>
        {manga.genres.length > 0 && (
          <p className="text-[10px] text-zinc-500 truncate">
            {manga.genres.slice(0, 2).map(g => g.name).join(' · ')}
          </p>
        )}
      </div>
    </Link>
  )
}