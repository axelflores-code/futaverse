'use client'

// src/components/manga/MangaHeroCarousel.tsx

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { Manga } from '@/types/manga'

interface MangaHeroCarouselProps {
  mangas: Manga[]
}

export function MangaHeroCarousel({ mangas }: MangaHeroCarouselProps) {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % mangas.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [mangas.length])

  if (mangas.length === 0) return null

  const manga = mangas[current]

  return (
    <div className="relative w-full mb-12 overflow-hidden"
      style={{ minHeight: '360px' }}
    >
      {/* Fondo difuminado */}
      <div className="absolute inset-0">
        {manga.coverUrl && (
          <Image
            src={manga.coverUrl}
            alt=""
            fill
            className="object-cover scale-110"
            style={{ filter: 'blur(8px)', opacity: 0.90 }}
            aria-hidden
          />
        )}
        <div className="absolute inset-0"
          style={{
            background: 'linear-gradient(90deg, rgba(10,10,15,0.85) 0%, rgba(10,10,15,0.50) 50%, rgba(10,10,15,0.20) 100%)',
          }}
        />
        <div className="absolute inset-x-0 bottom-0 h-24"
          style={{ background: 'linear-gradient(to top, #0a0a0f, transparent)' }}
        />
      </div>

      {/* Contenido */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 flex items-center gap-10 py-10 md:py-14">

        {/* Info izquierda */}
        <div className="flex-1 min-w-0">
          {manga.score > 0 && (
            <p className="text-sm font-bold mb-2" style={{ color: '#C4956A' }}>
              ★ {manga.score.toFixed(1)}
            </p>
          )}

          {/* Título más pequeño */}
          <h2
            className="text-2xl md:text-3xl font-black text-white mb-3 leading-tight"
            style={{ borderLeft: '4px solid #C4956A', paddingLeft: '14px' }}
          >
            {manga.title}
          </h2>

          {manga.description && (
            <p className="text-sm leading-relaxed mb-5 line-clamp-3 max-w-lg"
              style={{ color: 'rgba(160,152,144,0.9)' }}
            >
              {manga.description}
            </p>
          )}

          {/* Tags */}
          <div className="flex gap-2 flex-wrap mb-6">
            <span className="text-xs px-2.5 py-1 rounded-full font-medium"
              style={{
                background: 'rgba(196,149,106,0.15)',
                color: '#C4956A',
                border: '1px solid rgba(196,149,106,0.30)',
              }}
            >
              +18
            </span>
            {manga.genres.slice(0, 3).map(genre => (
              <span key={genre.id}
                className="text-xs px-2.5 py-1 rounded-full"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  color: 'rgba(240,236,232,0.80)',
                  border: '1px solid rgba(255,255,255,0.10)',
                }}
              >
                {genre.name}
              </span>
            ))}
          </div>

          {/* Botones */}
          <div className="flex gap-3 flex-wrap items-center">
            <Link
              href={`/manga/${manga.slug}`}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-opacity hover:opacity-90"
              style={{ background: '#C4956A', color: '#0a0a0f' }}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
              Leer ahora
            </Link>
            <Link
              href={`/manga/${manga.slug}`}
              className="px-6 py-2.5 rounded-xl font-semibold text-sm transition-all"
              style={{
                border: '1px solid rgba(255,255,255,0.15)',
                color: 'rgba(240,236,232,0.80)',
                background: 'rgba(255,255,255,0.05)',
              }}
            >
              Detalles
            </Link>
          </div>
        </div>

        {/* Portada más grande */}
        {manga.coverUrl && (
          <div className="hidden md:block flex-shrink-0"
            style={{
              width: '240px',
              aspectRatio: '2/3',
              borderRadius: '14px',
              overflow: 'hidden',
              border: '1px solid rgba(196,149,106,0.25)',
              boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
            }}
          >
            <Image
              src={manga.coverUrl}
              alt={manga.title}
              width={240}
              height={360}
              className="w-full h-full object-cover"
              priority
            />
          </div>
        )}
      </div>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {mangas.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className="rounded-full transition-all duration-300"
            style={{
              width:      i === current ? '24px' : '8px',
              height:     '8px',
              background: i === current ? '#C4956A' : 'rgba(196,149,106,0.25)',
            }}
            aria-label={`Manga ${i + 1}`}
          />
        ))}
      </div>
    </div>
  )
}