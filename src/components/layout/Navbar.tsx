'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { cn } from '@/lib/utils'

export function Navbar() {
  const pathname = usePathname()
  const [search, setSearch] = useState('')

  return (
    <header className="sticky top-0 z-50 w-full bg-[#111] border-b border-white/5 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-4">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center">
            <svg className="w-4 h-4 fill-white" viewBox="0 0 18 18">
              <path d="M9 1L3 5v8l6 4 6-4V5L9 1zm0 2.4L13 6v6l-4 2.6L5 12V6l4-2.6z"/>
            </svg>
          </div>
          <span className="font-bold text-white text-lg tracking-tight hidden sm:block">
            FutaVerse
          </span>
        </Link>

        {/* Buscador */}
        <form
          className="flex-1 max-w-md"
          onSubmit={(e) => {
            e.preventDefault()
            if (search.trim()) {
              window.location.href = `/search?q=${encodeURIComponent(search)}`
            }
          }}
        >
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Buscar manga..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/5 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-red-500/50 transition-colors"
            />
          </div>
        </form>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-1">
          {[
            { href: '/',          label: 'Inicio' },
            { href: '/manga',     label: 'Catálogo' },
            { href: '/search',    label: 'Explorar' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm transition-colors',
                pathname === item.href
                  ? 'text-white bg-white/10'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Botones auth */}
        <div className="flex items-center gap-2 ml-auto flex-shrink-0">
          <Link
            href="/login"
            className="text-sm text-zinc-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
          >
            Entrar
          </Link>
          <Link
            href="/register"
            className="text-sm bg-red-500 hover:bg-red-400 text-white px-3 py-1.5 rounded-lg transition-colors font-medium"
          >
            Registrarse
          </Link>
        </div>

      </div>
    </header>
  )
}