'use client'

// src/components/layout/Navbar.tsx

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface SearchResult {
  type:  'manga' | 'tag'
  id:    string
  name:  string
  slug:  string
  extra?: string // descripción corta o namespace del tag
}

export function Navbar() {
  const pathname = usePathname()
  const router   = useRouter()
  const [query,       setQuery]       = useState('')
  const [results,     setResults]     = useState<SearchResult[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [loading,     setLoading]     = useState(false)
  const inputRef  = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        !inputRef.current?.contains(e.target as Node)
      ) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Buscar con debounce
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)

    if (!query.trim()) {
      setResults([])
      setShowDropdown(false)
      return
    }

    timerRef.current = setTimeout(async () => {
      setLoading(true)
      const supabase = createClient()

      const [{ data: mangas }, { data: tags }] = await Promise.all([
        supabase
          .from('mangas')
          .select('id, slug, title, description')
          .ilike('title', `%${query}%`)
          .limit(5),
        supabase
          .from('tags')
          .select('id, slug, name, namespace')
          .ilike('name', `%${query}%`)
          .limit(5),
      ])

      const mangaResults: SearchResult[] = (mangas ?? []).map(m => ({
        type:  'manga',
        id:    m.id,
        name:  m.title,
        slug:  m.slug,
        extra: m.description ?? undefined,
      }))

      const tagResults: SearchResult[] = (tags ?? []).map(t => ({
        type:  'tag',
        id:    t.id,
        name:  t.name,
        slug:  t.slug,
        extra: t.namespace,
      }))

      setResults([...mangaResults, ...tagResults])
      setShowDropdown(true)
      setLoading(false)
    }, 250)
  }, [query])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim()) {
      setShowDropdown(false)
      router.push(`/search?q=${encodeURIComponent(query)}`)
    }
  }

  function handleSelect(result: SearchResult) {
    setShowDropdown(false)
    setQuery('')
    if (result.type === 'manga') {
      router.push(`/manga/${result.slug}`)
    } else {
      router.push(`/tag/${result.slug}`)
    }
  }

  const NS_LABELS: Record<string, string> = {
    theme:           'Tema',
    trope:           'Tropo',
    setting:         'Ambientación',
    format:          'Formato',
    content_warning: 'Advertencia',
  }

  return (
    <header
      className="sticky top-0 z-50 w-full border-b backdrop-blur-md"
      style={{
        background:  'rgba(10,10,15,0.92)',
        borderColor: 'rgba(196,149,106,0.12)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-4">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
          <Image
            src="/logo.png"
            alt="Mangafuta"
            width={36}
            height={36}
            priority
            className="object-contain logo-glow"
            style={{ width: 'auto', height: '36px' }}
          />
          <span
            className="font-bold text-lg tracking-tight hidden sm:block gradient-text"
            style={{ fontWeight: 800 }}
          >
            Mangafuta
          </span>
        </Link>

        {/* Buscador con dropdown */}
        <div className="flex-1 max-w-md relative">
          <form onSubmit={handleSubmit}>
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                style={{ color: 'rgba(196,149,106,0.5)' }}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                ref={inputRef}
                type="text"
                placeholder="Buscar manga, tag..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => query && setShowDropdown(true)}
                className="w-full rounded-lg pl-9 pr-8 py-2 text-sm outline-none transition-all"
                style={{
                  background:  'rgba(196,149,106,0.06)',
                  border:      `1px solid ${showDropdown ? 'rgba(196,149,106,0.40)' : 'rgba(196,149,106,0.12)'}`,
                  color:       '#f0ece8',
                }}
              />
              {query && (
                <button
                  type="button"
                  onClick={() => { setQuery(''); setResults([]); setShowDropdown(false) }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2"
                  style={{ color: 'rgba(160,152,144,0.5)' }}
                >
                  ✕
                </button>
              )}
            </div>
          </form>

          {/* Dropdown de sugerencias */}
          {showDropdown && (
            <div
              ref={dropdownRef}
              className="absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden shadow-2xl"
              style={{
                background: '#111118',
                border:     '1px solid rgba(196,149,106,0.15)',
                zIndex:     100,
              }}
            >
              {loading && (
                <div className="px-4 py-3 text-xs flex items-center gap-2"
                  style={{ color: 'rgba(160,152,144,0.6)' }}
                >
                  <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin"/>
                  Buscando...
                </div>
              )}

              {!loading && results.length === 0 && (
                <div className="px-4 py-3 text-xs"
                  style={{ color: 'rgba(160,152,144,0.5)' }}
                >
                  Sin resultados para "{query}"
                </div>
              )}

              {!loading && results.length > 0 && (
                <>
                  {/* Mangas */}
                  {results.filter(r => r.type === 'manga').length > 0 && (
                    <div>
                      <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider"
                        style={{ color: 'rgba(96,88,80,1)', background: 'rgba(255,255,255,0.02)' }}
                      >
                        📚 Mangas
                      </p>
                      {results.filter(r => r.type === 'manga').map(result => (
                        <button
                          key={result.id}
                          onClick={() => handleSelect(result)}
                          className="w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors hover:bg-white/5"
                        >
                          <span className="text-xs font-medium flex-1 truncate"
                            style={{ color: '#f0ece8' }}
                          >
                            {result.name}
                          </span>
                          {result.extra && (
                            <span className="text-[10px] truncate max-w-[120px]"
                              style={{ color: 'rgba(160,152,144,0.5)' }}
                            >
                              {result.extra.slice(0, 40)}
                            </span>
                          )}
                          <span style={{ color: 'rgba(196,149,106,0.4)', fontSize: '12px' }}>→</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Tags */}
                  {results.filter(r => r.type === 'tag').length > 0 && (
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider"
                        style={{ color: 'rgba(96,88,80,1)', background: 'rgba(255,255,255,0.02)' }}
                      >
                        🏷️ Tags
                      </p>
                      {results.filter(r => r.type === 'tag').map(result => (
                        <button
                          key={result.id}
                          onClick={() => handleSelect(result)}
                          className="w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors hover:bg-white/5"
                        >
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                            style={{
                              background: 'rgba(196,149,106,0.12)',
                              color:      '#C4956A',
                              border:     '1px solid rgba(196,149,106,0.20)',
                            }}
                          >
                            {NS_LABELS[result.extra ?? ''] ?? result.extra}
                          </span>
                          <span className="text-xs font-medium flex-1"
                            style={{ color: '#f0ece8' }}
                          >
                            {result.name}
                          </span>
                          <span style={{ color: 'rgba(196,149,106,0.4)', fontSize: '12px' }}>→</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Ver todos los resultados */}
                  <button
                    onClick={() => {
                      setShowDropdown(false)
                      router.push(`/search?q=${encodeURIComponent(query)}`)
                    }}
                    className="w-full px-4 py-2.5 text-xs text-left transition-colors"
                    style={{
                      borderTop:  '1px solid rgba(255,255,255,0.05)',
                      color:      '#C4956A',
                      background: 'rgba(196,149,106,0.04)',
                    }}
                  >
                    Ver todos los resultados para "{query}" →
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-1">
          {[
            { href: '/',           label: 'Inicio'    },
            { href: '/manga',      label: 'Catálogo'  },
            { href: '/tags',       label: 'Tags'      },
            { href: '/biblioteca', label: 'Biblioteca'},
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-3 py-1.5 rounded-lg text-sm transition-all"
              style={{
                color:      pathname === item.href ? '#C4956A' : 'rgba(160,152,144,1)',
                background: pathname === item.href ? 'rgba(196,149,106,0.10)' : 'transparent',
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Botones auth */}
        <div className="flex items-center gap-2 ml-auto flex-shrink-0">
          <Link
            href="/login"
            className="text-sm px-3 py-1.5 rounded-lg transition-colors hidden sm:block"
            style={{ color: 'rgba(160,152,144,1)' }}
          >
            Entrar
          </Link>
          <Link
            href="/register"
            className="text-sm px-3 py-1.5 rounded-lg font-semibold transition-all gradient-bg"
            style={{ color: '#0a0a0f' }}
          >
            Registrarse
          </Link>
        </div>
      </div>

      {/* Línea gradiente decorativa */}
      <div
        className="h-px w-full"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(196,149,106,0.3), rgba(45,75,142,0.3), transparent)',
        }}
      />
    </header>
  )
}