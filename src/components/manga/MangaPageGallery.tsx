'use client'

// src/components/manga/MangaPageGallery.tsx

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import type { Chapter } from '@/types/manga'

interface MangaPageGalleryProps {
  chapters:  Chapter[]
  mangaSlug: string
}

export function MangaPageGallery({ chapters, mangaSlug }: MangaPageGalleryProps) {
  const [selectedChapter, setSelectedChapter] = useState(0)
  const [showAll, setShowAll] = useState(false)

  if (chapters.length === 0) return null

  const chapter      = chapters[selectedChapter]
  const pages        = chapter?.pages ?? []
  const visiblePages = showAll ? pages : pages.slice(0, 10)
  const remaining    = pages.length - 10

  return (
    <section className="mt-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold flex items-center gap-2"
          style={{ color: '#f0ece8' }}
        >
          <span className="w-1 h-5 rounded-full inline-block"
            style={{ background: 'linear-gradient(180deg, #C4956A, #2D4B8E)' }}
          />
          Vista previa
          <span className="text-xs font-normal"
            style={{ color: 'rgba(160,152,144,0.7)' }}
          >
            ({pages.length} páginas)
          </span>
        </h2>

        {chapters.length > 1 && (
          <select
            value={selectedChapter}
            onChange={(e) => {
              setSelectedChapter(Number(e.target.value))
              setShowAll(false)
            }}
            className="text-xs px-3 py-1.5 rounded-lg outline-none"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border:     '1px solid rgba(196,149,106,0.20)',
              color:      '#C4956A',
            }}
          >
            {chapters.map((ch, i) => (
              <option key={ch.id} value={i}>
                Cap. {ch.number}{ch.title ? ` — ${ch.title}` : ''}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Grid de miniaturas */}
      <div
        style={{
          display:             'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap:                 '6px',
        }}
      >
        {visiblePages.map((pageUrl, i) => (
          <Link
            key={i}
            href={`/read/${mangaSlug}/${chapter.number}`}
            title={`Página ${i + 1}`}
            style={{
              position:     'relative',
              display:      'block',
              aspectRatio: '2/3',
                height: 'auto',
              borderRadius: '6px',
              overflow:     'hidden',
              border:       '1px solid rgba(196,149,106,0.10)',
              background:   '#18181f',
            }}
          >
            <Image
              src={pageUrl}
              alt={`Página ${i + 1}`}
              fill
              sizes="20vw"
              style={{ objectFit: 'cover' }}
            />
            <span
              style={{
                position:     'absolute',
                bottom:       '3px',
                right:        '4px',
                fontSize:     '10px',
                fontWeight:   700,
                padding:      '1px 5px',
                borderRadius: '4px',
                background:   'rgba(10,10,15,0.85)',
                color:        'rgba(196,149,106,0.9)',
              }}
            >
              {i + 1}
            </span>
          </Link>
        ))}

        {!showAll && remaining > 0 && (
          <button
            onClick={() => setShowAll(true)}
            style={{
              height:         '130px',
              borderRadius:   '6px',
              border:         '1px solid rgba(196,149,106,0.15)',
              background:     'rgba(196,149,106,0.06)',
              display:        'flex',
              flexDirection:  'column',
              alignItems:     'center',
              justifyContent: 'center',
              gap:            '4px',
              cursor:         'pointer',
            }}
          >
            <span style={{ fontSize: '18px', fontWeight: 900, color: '#C4956A' }}>
              +{remaining}
            </span>
            <span style={{ fontSize: '10px', color: 'rgba(160,152,144,0.7)' }}>
              más páginas
            </span>
          </button>
        )}
      </div>

      {/* Botones */}
      <div className="mt-5 flex gap-3 flex-wrap">
        <Link
          href={`/read/${mangaSlug}/${chapter.number}`}
          style={{
            display:        'inline-flex',
            alignItems:     'center',
            gap:            '6px',
            padding:        '10px 24px',
            borderRadius:   '12px',
            fontWeight:     700,
            fontSize:       '14px',
            background:     '#C4956A',
            color:          '#0a0a0f',
            textDecoration: 'none',
          }}
        >
          <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z"/>
          </svg>
          Leer desde el inicio
        </Link>

        {showAll && (
          <button
            onClick={() => setShowAll(false)}
            style={{
              padding:      '10px 16px',
              borderRadius: '12px',
              fontSize:     '14px',
              border:       '1px solid rgba(196,149,106,0.20)',
              color:        'rgba(160,152,144,0.8)',
              background:   'transparent',
              cursor:       'pointer',
            }}
          >
            Mostrar menos
          </button>
        )}
      </div>
    </section>
  )
}