import Image from 'next/image'
import Link from 'next/link'
import type { Manga } from '@/types/manga'

interface MangaCardProps {
  manga: Manga
  priority?: boolean
}

export function MangaCard({
  manga,
  priority = false,
}: MangaCardProps) {
  return (
    <Link
      href={`/manga/${manga.slug}`}
      /*
       * Evita que Next.js precargue automáticamente
       * decenas de fichas mientras se ve el catálogo.
       * El enlace sigue siendo rastreable por Google.
       */
      prefetch={false}
      aria-label={`Leer ${manga.title}`}
      className="group flex flex-col rounded-xl overflow-hidden transition-all duration-200 hover:scale-[1.03]"
      style={{
        background: '#111118',
        border:
          '1px solid rgba(196,149,106,0.08)',
      }}
    >
      <div
        className="relative aspect-[2/3] overflow-hidden"
        style={{
          background: '#18181f',
        }}
      >
        {manga.coverUrl ? (
          <Image
            src={manga.coverUrl}
            alt={`Portada de ${manga.title}`}
            fill
            sizes="
              (max-width: 479px) 50vw,
              (max-width: 639px) 33vw,
              (max-width: 1023px) 25vw,
              17vw
            "
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            priority={priority}
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              color: '#302820',
            }}
            aria-label="Portada no disponible"
          >
            <svg
              className="w-8 h-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
        )}

        {manga.score > 0 && (
          <div
            className="absolute bottom-2 right-2 text-[10px] font-bold px-1.5 py-0.5 rounded"
            style={{
              background:
                'rgba(10,10,15,0.82)',
              color: '#C4956A',
              backdropFilter: 'blur(4px)',
            }}
            aria-label={`Puntuación ${manga.score.toFixed(1)}`}
          >
            ★ {manga.score.toFixed(1)}
          </div>
        )}
      </div>

      <div className="p-2.5 flex flex-col gap-1">
        <h2
          className="text-xs font-semibold leading-tight line-clamp-2"
          style={{
            color: '#f0ece8',
          }}
        >
          {manga.title}
        </h2>

        {manga.genres.length > 0 && (
          <p
            className="text-[10px] truncate"
            style={{
              color:
                'rgba(196,149,106,0.65)',
            }}
          >
            {manga.genres
              .slice(0, 2)
              .map((genre) => genre.name)
              .join(' · ')}
          </p>
        )}
      </div>
    </Link>
  )
}