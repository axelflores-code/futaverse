'use client'

import { useState } from 'react'
import { MangaCard } from './MangaCard'
import { cn } from '@/lib/utils'
import type { Manga, MangaStatus, Category, Tag, TagNamespace } from '@/types/manga'

interface MangaCatalogProps {
  initialMangas: Manga[]
  categories: Category[]
  tags: Tag[]
}

const STATUS_OPTIONS: { value: MangaStatus | ''; label: string }[] = [
  { value: '',          label: 'Todos'    },
  { value: 'ongoing',   label: 'En curso' },
  { value: 'completed', label: 'Completo' },
  { value: 'hiatus',    label: 'Pausado'  },
]

const SORT_OPTIONS = [
  { value: 'updatedAt', label: 'Recientes'  },
  { value: 'score',     label: 'Puntuación' },
  { value: 'title',     label: 'Alfabético' },
]

export function MangaCatalog({ initialMangas, categories, tags }: MangaCatalogProps) {
  const [status, setStatus] = useState<MangaStatus | ''>('')
  const [sortBy, setSortBy] = useState('updatedAt')
  const [activeCategories, setActiveCategories] = useState<string[]>([])
  const [activeTags, setActiveTags] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)

  function toggleCategory(slug: string) {
    setActiveCategories(prev =>
      prev.includes(slug) ? prev.filter(c => c !== slug) : [...prev, slug]
    )
  }

  function toggleTag(slug: string) {
    setActiveTags(prev =>
      prev.includes(slug) ? prev.filter(t => t !== slug) : [...prev, slug]
    )
  }

  const filtered = initialMangas
    .filter(m => !status || m.status === status)
    .sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title)
      if (sortBy === 'score') return b.score - a.score
      return 0
    })

  const hasActiveFilters = !!status || activeCategories.length > 0 || activeTags.length > 0

  const NS_LABELS: Record<string, string> = {
    theme:   'Tema',
    trope:   'Tropo',
    setting: 'Ambientación',
    format:  'Formato',
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Controles */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => setShowFilters(v => !v)}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all',
            showFilters
              ? 'border-red-500 text-red-400 bg-red-500/10'
              : 'border-white/10 text-zinc-400 hover:text-white hover:border-white/20'
          )}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M6 8h12M9 12h6M11 16h2"/>
          </svg>
          Filtros
          {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-red-500"/>}
        </button>

        <div className="flex gap-1 flex-wrap">
          {STATUS_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setStatus(opt.value)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                status === opt.value
                  ? 'border-red-500 text-red-400 bg-red-500/10'
                  : 'border-white/10 text-zinc-500 hover:text-white hover:border-white/20'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          className="ml-auto bg-[#111] border border-white/10 text-zinc-400 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-red-500/50"
        >
          {SORT_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        <span className="text-xs text-zinc-600">{filtered.length} títulos</span>
      </div>

      {/* Panel filtros */}
      {showFilters && (
        <div className="bg-[#111] border border-white/5 rounded-xl p-5 flex flex-col gap-5">

          {categories.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Categoría</p>
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => toggleCategory(cat.slug)}
                    className={cn(
                      'px-3 py-1 rounded-full text-xs font-medium border transition-all',
                      activeCategories.includes(cat.slug)
                        ? 'border-transparent text-white'
                        : 'border-white/10 text-zinc-500 hover:text-white hover:border-white/20'
                    )}
                    style={activeCategories.includes(cat.slug) && cat.colorHex
                      ? { background: cat.colorHex + '33', borderColor: cat.colorHex, color: cat.colorHex }
                      : {}
                    }
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {(['theme', 'trope', 'setting', 'format'] as TagNamespace[]).map(ns => {
            const nsTags = tags.filter(t => t.namespace === ns)
            if (nsTags.length === 0) return null
            return (
              <div key={ns}>
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
                  {NS_LABELS[ns]}
                </p>
                <div className="flex flex-wrap gap-2">
                  {nsTags.map(tag => (
                    <button
                      key={tag.id}
                      onClick={() => toggleTag(tag.slug)}
                      className={cn(
                        'px-3 py-1 rounded-full text-xs border transition-all',
                        activeTags.includes(tag.slug)
                          ? 'border-red-500 text-red-400 bg-red-500/10'
                          : 'border-white/10 text-zinc-500 hover:text-white hover:border-white/20'
                      )}
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
              onClick={() => { setStatus(''); setActiveCategories([]); setActiveTags([]) }}
              className="self-start text-xs text-red-400 hover:text-red-300 transition-colors underline underline-offset-2"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      )}

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-zinc-500 text-sm">No hay mangas con estos filtros.</p>
          <button
            onClick={() => { setStatus(''); setActiveCategories([]); setActiveTags([]) }}
            className="mt-3 text-xs text-red-400 hover:text-red-300 underline underline-offset-2"
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filtered.map((manga, i) => (
            <MangaCard key={manga.id} manga={manga} priority={i < 6} />
          ))}
        </div>
      )}
    </div>
  )
}