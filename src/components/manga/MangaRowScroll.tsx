import Image from 'next/image'
import Link from 'next/link'
import type { Manga } from '@/types/manga'

interface MangaRowScrollProps {
  mangas: Manga[]
  title:  string
  href?:  string
}

export function MangaRowScroll({ mangas, title, href = '/manga' }: MangaRowScrollProps) {
  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold flex items-center gap-2"
          style={{ color: '#f0ece8' }}
        >
          <span className="w-1 h-5 rounded-full gradient-bg inline-block"/>
          {title}
        </h2>
        <Link href={href}
          className="text-xs transition-colors"
          style={{ color: '#C4956A' }}
        >
          Ver todo →
        </Link>
      </div>

      {/* Scroll horizontal */}
      <div className="flex gap-3 overflow-x-auto pb-2"
        style={{ scrollbarWidth: 'none' }}
      >
        {mangas.map((manga, i) => (
          <Link
            key={manga.id}
            href={`/manga/${manga.slug}`}
            className="group flex-shrink-0 w-28 flex flex-col rounded-xl overflow-hidden transition-all duration-200 hover:scale-[1.04]"
            style={{
              background: '#111118',
              border:     '1px solid rgba(196,149,106,0.08)',
            }}
          >
            {/* Número + portada */}
            <div className="relative aspect-[2/3] overflow-hidden"
              style={{ background: '#18181f' }}
            >
              {/* Número ranking */}
              <span className="absolute top-1 left-1 z-10 text-xs font-black w-5 h-5 rounded flex items-center justify-center"
                style={{
                  background: i < 3 ? '#C4956A' : 'rgba(10,10,15,0.80)',
                  color:      i < 3 ? '#0a0a0f' : 'rgba(160,152,144,1)',
                }}
              >
                {i + 1}
              </span>

              {manga.coverUrl ? (
                <Image
                  src={manga.coverUrl}
                  alt={manga.title}
                  fill
                  sizes="112px"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center"
                  style={{ color: '#302820' }}
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>
              )}

              {/* Score */}
              {manga.score > 0 && (
                <div className="absolute bottom-1 right-1 text-[10px] font-bold px-1 py-0.5 rounded"
                  style={{ background: 'rgba(10,10,15,0.85)', color: '#C4956A' }}
                >
                  ★{manga.score.toFixed(1)}
                </div>
              )}
            </div>

            {/* Título */}
            <div className="p-2">
              <p className="text-[10px] font-semibold leading-tight line-clamp-2"
                style={{ color: '#f0ece8' }}
              >
                {manga.title}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}