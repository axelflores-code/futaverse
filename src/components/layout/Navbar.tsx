'use client'

// src/components/layout/Navbar.tsx

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface SearchResult {
  type:   'manga' | 'tag'
  id:     string
  name:   string
  slug:   string
  extra?: string
}

const NAV_LINKS = [
  { href: '/',           label: 'Inicio'     },
  { href: '/manga',      label: 'Catálogo'   },
  { href: '/tags',       label: 'Tags'       },
  { href: '/biblioteca', label: 'Biblioteca' },
]

const NS_LABELS: Record<string, string> = {
  theme: 'Tema', trope: 'Tropo', setting: 'Ambientación',
  format: 'Formato', content_warning: 'Advertencia',
}

export function Navbar() {
  const pathname  = usePathname()
  const router    = useRouter()
  const [query,        setQuery]        = useState('')
  const [results,      setResults]      = useState<SearchResult[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [loading,      setLoading]      = useState(false)
  const inputRef    = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const timerRef    = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        !inputRef.current?.contains(e.target as Node)
      ) setShowDropdown(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (!query.trim()) { setResults([]); setShowDropdown(false); return }
    timerRef.current = setTimeout(async () => {
      setLoading(true)
      const supabase = createClient()
      const [{ data: mangas }, { data: tags }] = await Promise.all([
        supabase.from('mangas').select('id, slug, title').ilike('title', `%${query}%`).limit(5),
        supabase.from('tags').select('id, slug, name, namespace').ilike('name', `%${query}%`).limit(5),
      ])
      const mangaResults: SearchResult[] = (mangas ?? []).map(m => ({ type: 'manga', id: m.id, name: m.title, slug: m.slug }))
      const tagResults:   SearchResult[] = (tags   ?? []).map(t => ({ type: 'tag',   id: t.id, name: t.name,  slug: t.slug, extra: t.namespace }))
      setResults([...mangaResults, ...tagResults])
      setShowDropdown(true)
      setLoading(false)
    }, 250)
  }, [query])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim()) { setShowDropdown(false); router.push(`/search?q=${encodeURIComponent(query)}`) }
  }

  function handleSelect(r: SearchResult) {
    setShowDropdown(false); setQuery('')
    router.push(r.type === 'manga' ? `/manga/${r.slug}` : `/tag/${r.slug}`)
  }

  return (
    <header style={{ position:'sticky', top:0, zIndex:50, width:'100%', background:'#0c0c12', borderBottom:'1px solid rgba(255,255,255,0.06)', backdropFilter:'blur(12px)' }}>
      <div style={{ maxWidth:'1280px', margin:'0 auto', padding:'0 1rem', height:'56px', display:'flex', alignItems:'center', gap:'1.25rem' }}>

        {/* Logo */}
        <Link href="/" style={{ display:'flex', alignItems:'center', gap:'10px', flexShrink:0, textDecoration:'none' }}>
          <Image src="/logo.png" alt="MangaFuta" width={34} height={34} priority style={{ width:'auto', height:'34px', objectFit:'contain' }} />
          <span style={{ fontFamily:'"Cormorant Garamond", Georgia, serif', fontWeight:700, fontSize:'22px', color:'#C4956A', letterSpacing:'-0.02em', lineHeight:1 }}>
            Mangafuta
          </span>
        </Link>

        {/* Search */}
        <div style={{ flex:1, maxWidth:'480px', position:'relative' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ position:'relative' }}>
              <svg style={{ position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', width:'14px', height:'14px', color:'rgba(196,149,106,0.4)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                ref={inputRef}
                type="text"
                placeholder="Buscar manga, tag..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                onFocus={() => query && setShowDropdown(true)}
                style={{ width:'100%', background:'rgba(255,255,255,0.04)', border:`1px solid ${showDropdown ? 'rgba(196,149,106,0.30)' : 'rgba(255,255,255,0.07)'}`, borderRadius:'8px', padding:'8px 30px 8px 36px', fontSize:'13px', color:'#f0ece8', outline:'none', transition:'border-color .15s' }}
              />
              {query && (
                <button type="button" onClick={() => { setQuery(''); setResults([]); setShowDropdown(false) }}
                  style={{ position:'absolute', right:'10px', top:'50%', transform:'translateY(-50%)', color:'rgba(160,152,144,0.4)', background:'none', border:'none', cursor:'pointer', fontSize:'13px' }}>
                  ✕
                </button>
              )}
            </div>
          </form>

          {showDropdown && (
            <div ref={dropdownRef} style={{ position:'absolute', top:'calc(100% + 6px)', left:0, right:0, background:'#111118', border:'1px solid rgba(196,149,106,0.15)', borderRadius:'12px', overflow:'hidden', boxShadow:'0 16px 48px rgba(0,0,0,0.6)', zIndex:100 }}>
              {loading && <div style={{ padding:'12px 16px', fontSize:'12px', color:'rgba(160,152,144,0.5)' }}>Buscando...</div>}
              {!loading && results.length === 0 && <div style={{ padding:'12px 16px', fontSize:'12px', color:'rgba(160,152,144,0.4)' }}>Sin resultados para "{query}"</div>}
              {!loading && results.length > 0 && (
                <>
                  {results.filter(r => r.type === 'manga').length > 0 && (
                    <div>
                      <p style={{ padding:'8px 14px 6px', fontSize:'10px', fontWeight:600, textTransform:'uppercase', letterSpacing:'.06em', color:'rgba(96,88,80,1)', background:'rgba(255,255,255,0.02)' }}>📚 Mangas</p>
                      {results.filter(r => r.type === 'manga').map(r => (
                        <button key={r.id} onClick={() => handleSelect(r)}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                          style={{ width:'100%', textAlign:'left', padding:'9px 16px', display:'flex', alignItems:'center', gap:'10px', background:'none', border:'none', cursor:'pointer' }}>
                          <span style={{ fontSize:'13px', color:'#f0ece8', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.name}</span>
                          <span style={{ fontSize:'11px', color:'rgba(196,149,106,0.4)' }}>→</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {results.filter(r => r.type === 'tag').length > 0 && (
                    <div style={{ borderTop:'1px solid rgba(255,255,255,0.05)' }}>
                      <p style={{ padding:'8px 14px 6px', fontSize:'10px', fontWeight:600, textTransform:'uppercase', letterSpacing:'.06em', color:'rgba(96,88,80,1)', background:'rgba(255,255,255,0.02)' }}>🏷️ Tags</p>
                      {results.filter(r => r.type === 'tag').map(r => (
                        <button key={r.id} onClick={() => handleSelect(r)}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                          style={{ width:'100%', textAlign:'left', padding:'9px 16px', display:'flex', alignItems:'center', gap:'10px', background:'none', border:'none', cursor:'pointer' }}>
                          <span style={{ fontSize:'10px', padding:'2px 8px', borderRadius:'20px', background:'rgba(61,90,158,0.12)', border:'1px solid rgba(61,90,158,0.25)', color:'#3D5A9E', fontWeight:600, whiteSpace:'nowrap' }}>
                            {NS_LABELS[r.extra ?? ''] ?? r.extra}
                          </span>
                          <span style={{ fontSize:'13px', color:'#f0ece8', flex:1 }}>{r.name}</span>
                          <span style={{ fontSize:'11px', color:'rgba(196,149,106,0.4)' }}>→</span>
                        </button>
                      ))}
                    </div>
                  )}
                  <button onClick={() => { setShowDropdown(false); router.push(`/search?q=${encodeURIComponent(query)}`) }}
                    style={{ width:'100%', textAlign:'left', padding:'10px 16px', fontSize:'12px', color:'#C4956A', background:'rgba(196,149,106,0.04)', borderTop:'1px solid rgba(255,255,255,0.05)', border:'none', cursor:'pointer' }}>
                    Ver todos los resultados para "{query}" →
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="fv-nav" style={{ display:'none', alignItems:'center', gap:'2px' }}>
          {NAV_LINKS.map(item => (
            <Link key={item.href} href={item.href} style={{ padding:'6px 12px', borderRadius:'6px', fontSize:'13px', fontWeight: pathname === item.href ? 600 : 400, color: pathname === item.href ? '#C4956A' : 'rgba(175,167,158,1)', background: pathname === item.href ? 'rgba(196,149,106,0.08)' : 'transparent', textDecoration:'none', transition:'all .15s' }}>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Auth */}
        <div style={{ display:'flex', alignItems:'center', gap:'8px', marginLeft:'auto', flexShrink:0 }}>
          <Link href="/login" style={{ padding:'7px 14px', fontSize:'13px', fontWeight:400, color:'rgba(175,167,158,1)', textDecoration:'none', borderRadius:'6px' }}>
            Entrar
          </Link>
          <Link href="/register" style={{ padding:'7px 16px', fontSize:'13px', fontWeight:600, color:'#0c0c12', background:'#C4956A', borderRadius:'6px', textDecoration:'none' }}>
            Registrarse
          </Link>
        </div>
      </div>

      {/* Línea inferior */}
      <div style={{ height:'1px', background:'linear-gradient(90deg, transparent 0%, rgba(196,149,106,0.18) 30%, rgba(61,90,158,0.18) 70%, transparent 100%)' }} />

      <style>{`
        @media (min-width: 768px) { .fv-nav { display: flex !important; } }
      `}</style>
    </header>
  )
}