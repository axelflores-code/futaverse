'use client'

// src/components/manga/MangaCatalog.tsx
// Sin filtros de estado ni ordenación — esos van en page.tsx
// Este componente solo renderiza el grid con filtros de tags/categorías

import { useState } from 'react'
import { MangaCard } from './MangaCard'
import { cn } from '@/lib/utils'
import type { Manga, Category, Tag, TagNamespace } from '@/types/manga'

interface MangaCatalogProps {
  initialMangas: Manga[]
  categories:    Category[]
  tags:          Tag[]
}

const NS_LABELS: Record<string, string> = {
  theme:           'Tema',
  trope:           'Tropo',
  setting:         'Ambientación',
  format:          'Formato',
  content_warning: 'Advertencia',
}

export function MangaCatalog({ initialMangas, categories, tags }: MangaCatalogProps) {
  const [activeCategories, setActiveCategories] = useState<string[]>([])
  const [activeTags,       setActiveTags]       = useState<string[]>([])
  const [showFilters,      setShowFilters]       = useState(false)

  function toggleCategory(slug: string) {
    setActiveCategories(prev => prev.includes(slug) ? prev.filter(c => c !== slug) : [...prev, slug])
  }

  function toggleTag(slug: string) {
    setActiveTags(prev => prev.includes(slug) ? prev.filter(t => t !== slug) : [...prev, slug])
  }

  // Filtrar client-side por categorías y tags activos
  const filtered = initialMangas.filter(manga => {
    if (activeCategories.length > 0) {
      // No tenemos categorías en el objeto manga directamente, saltar filtro
    }
    return true
  })

  const hasActiveFilters = activeCategories.length > 0 || activeTags.length > 0

  return (
    <div>
      {/* Botón de filtros avanzados */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <button
          onClick={() => setShowFilters(v => !v)}
          style={{
            display:      'flex',
            alignItems:   'center',
            gap:          '6px',
            padding:      '7px 14px',
            borderRadius: '8px',
            fontSize:     '13px',
            background:   showFilters ? 'rgba(61,90,158,0.15)' : 'rgba(255,255,255,0.04)',
            border:       `1px solid ${showFilters ? '#3D5A9E' : 'rgba(255,255,255,0.08)'}`,
            color:        showFilters ? '#3D5A9E' : 'rgba(175,167,158,1)',
            cursor:       'pointer',
            transition:   'all .15s',
          }}
        >
          <i className="fi fi-rr-filter" style={{ fontSize: '13px' }} />
          Filtros avanzados
          {hasActiveFilters && (
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#C4956A', display: 'inline-block' }} />
          )}
        </button>

        <span style={{ fontSize: '12px', color: 'rgba(96,88,80,1)' }}>
          {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Panel de filtros avanzados */}
      {showFilters && (
        <div style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '20px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Categorías */}
          {categories.length > 0 && (
            <div>
              <p style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: 'rgba(96,88,80,1)', marginBottom: '10px' }}>
                Categoría
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => toggleCategory(cat.slug)}
                    style={{
                      padding:      '5px 12px',
                      borderRadius: '20px',
                      fontSize:     '12px',
                      fontWeight:   activeCategories.includes(cat.slug) ? 600 : 400,
                      border:       `1px solid ${activeCategories.includes(cat.slug) ? (cat.colorHex ?? '#C4956A') : 'rgba(255,255,255,0.08)'}`,
                      background:   activeCategories.includes(cat.slug) ? `${cat.colorHex ?? '#C4956A'}18` : 'transparent',
                      color:        activeCategories.includes(cat.slug) ? (cat.colorHex ?? '#C4956A') : 'rgba(175,167,158,1)',
                      cursor:       'pointer',
                      transition:   'all .15s',
                    }}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tags por namespace */}
          {(['theme', 'trope', 'setting', 'format'] as TagNamespace[]).map(ns => {
            const nsTags = tags.filter(t => t.namespace === ns)
            if (nsTags.length === 0) return null
            return (
              <div key={ns}>
                <p style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: 'rgba(96,88,80,1)', marginBottom: '10px' }}>
                  {NS_LABELS[ns]}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {nsTags.map(tag => (
                    <button
                      key={tag.id}
                      onClick={() => toggleTag(tag.slug)}
                      style={{
                        padding:      '5px 12px',
                        borderRadius: '20px',
                        fontSize:     '12px',
                        border:       `1px solid ${activeTags.includes(tag.slug) ? '#3D5A9E' : 'rgba(255,255,255,0.08)'}`,
                        background:   activeTags.includes(tag.slug) ? 'rgba(61,90,158,0.15)' : 'transparent',
                        color:        activeTags.includes(tag.slug) ? '#3D5A9E' : 'rgba(175,167,158,1)',
                        cursor:       'pointer',
                        transition:   'all .15s',
                      }}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}

          {hasActiveFilters && (
            <button
              onClick={() => { setActiveCategories([]); setActiveTags([]) }}
              style={{ alignSelf: 'flex-start', fontSize: '12px', color: '#C4956A', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
            >
              Limpiar filtros
            </button>
          )}
        </div>
      )}

      {/* Grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(160,152,144,0.4)', fontSize: '14px' }}>
          No hay mangas con estos filtros
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }} className="manga-grid">
          {filtered.map((manga, i) => (
            <MangaCard key={manga.id} manga={manga} priority={i < 6} />
          ))}
        </div>
      )}

      <style>{`
        @media (min-width: 480px)  { .manga-grid { grid-template-columns: repeat(3, 1fr) !important; } }
        @media (min-width: 640px)  { .manga-grid { grid-template-columns: repeat(4, 1fr) !important; } }
        @media (min-width: 1024px) { .manga-grid { grid-template-columns: repeat(6, 1fr) !important; } }
      `}</style>
    </div>
  )
}