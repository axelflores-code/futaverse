// src/components/ui/Pagination.tsx

import Link from 'next/link'

interface PaginationProps {
  currentPage:  number
  totalPages:   number
  basePath:     string
  searchParams?: Record<string, string | undefined>
}

export function Pagination({
  currentPage,
  totalPages,
  basePath,
  searchParams = {},
}: PaginationProps) {

  function buildUrl(page: number) {
    const params = new URLSearchParams()
    params.set('page', String(page))
    Object.entries(searchParams).forEach(([k, v]) => {
      if (v) params.set(k, v)
    })
    return `${basePath}?${params.toString()}`
  }

  // Páginas a mostrar
  function getPages(): (number | '...')[] {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }
    const pages: (number | '...')[] = [1]
    if (currentPage > 3)       pages.push('...')
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i)
    }
    if (currentPage < totalPages - 2) pages.push('...')
    pages.push(totalPages)
    return pages
  }

  const pages = getPages()

  return (
    <nav className="flex items-center gap-1" aria-label="Paginación">

      {/* Anterior */}
      {currentPage > 1 ? (
        <Link
          href={buildUrl(currentPage - 1)}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-sm transition-all"
          style={{
            background:  'rgba(255,255,255,0.04)',
            border:      '1px solid rgba(196,149,106,0.15)',
            color:       'rgba(196,149,106,0.8)',
          }}
          aria-label="Página anterior"
        >
          «
        </Link>
      ) : (
        <span
          className="w-9 h-9 flex items-center justify-center rounded-lg text-sm"
          style={{
            background: 'rgba(255,255,255,0.02)',
            border:     '1px solid rgba(255,255,255,0.05)',
            color:      'rgba(160,152,144,0.3)',
          }}
        >
          «
        </span>
      )}

      {/* Números */}
      {pages.map((p, i) =>
        p === '...' ? (
          <span
            key={`dots-${i}`}
            className="w-9 h-9 flex items-center justify-center text-sm"
            style={{ color: 'rgba(160,152,144,0.4)' }}
          >
            ···
          </span>
        ) : (
          <Link
            key={p}
            href={buildUrl(p)}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-all"
            style={p === currentPage ? {
              background:  '#C4956A',
              border:      '1px solid #C4956A',
              color:       '#0a0a0f',
              fontWeight:  700,
            } : {
              background:  'rgba(255,255,255,0.04)',
              border:      '1px solid rgba(196,149,106,0.15)',
              color:       'rgba(160,152,144,0.8)',
            }}
            aria-label={`Página ${p}`}
            aria-current={p === currentPage ? 'page' : undefined}
          >
            {p}
          </Link>
        )
      )}

      {/* Siguiente */}
      {currentPage < totalPages ? (
        <Link
          href={buildUrl(currentPage + 1)}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-sm transition-all"
          style={{
            background:  'rgba(255,255,255,0.04)',
            border:      '1px solid rgba(196,149,106,0.15)',
            color:       'rgba(196,149,106,0.8)',
          }}
          aria-label="Página siguiente"
        >
          »
        </Link>
      ) : (
        <span
          className="w-9 h-9 flex items-center justify-center rounded-lg text-sm"
          style={{
            background: 'rgba(255,255,255,0.02)',
            border:     '1px solid rgba(255,255,255,0.05)',
            color:      'rgba(160,152,144,0.3)',
          }}
        >
          »
        </span>
      )}
    </nav>
  )
}