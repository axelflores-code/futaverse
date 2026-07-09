// src/app/tags/page.tsx

import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tags — FutaVerse',
  description: 'Explora todos los tags y géneros de FutaVerse.',
}

export const revalidate = 3600

const NS_CONFIG: Record<string, { label: string; emoji: string; color: string }> = {
  theme:           { label: 'Temas',              emoji: '🎭', color: '#C4956A' },
  trope:           { label: 'Tropos',             emoji: '✨', color: '#4A6FBF' },
  setting:         { label: 'Ambientación',       emoji: '🌍', color: '#1D9E75' },
  format:          { label: 'Formato',            emoji: '📐', color: '#7F77DD' },
  content_warning: { label: 'Advertencias',       emoji: '⚠️', color: '#E8424A' },
}

export default async function TagsPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; ns?: string }>
}) {
  const supabase = await createClient()
  const { sort = 'az', ns: nsFilter } = await searchParams

  const { data: tags } = await supabase
    .from('tags')
    .select('*')

  const { data: mangas } = await supabase
    .from('mangas')
    .select('id')

  const totalMangas = mangas?.length ?? 0

  if (!tags) return null

  // Filtrar por namespace si hay filtro activo
  const filteredTags = nsFilter
    ? tags.filter(t => t.namespace === nsFilter)
    : tags

  // Ordenar
  const sorted = [...filteredTags].sort((a, b) => {
    if (sort === 'az')      return a.name.localeCompare(b.name)
    if (sort === 'za')      return b.name.localeCompare(a.name)
    if (sort === 'popular') return b.usage_count - a.usage_count
    return a.name.localeCompare(b.name)
  })

  // Agrupar por namespace
  const grouped = Object.keys(NS_CONFIG).reduce((acc, ns) => {
    acc[ns] = sorted.filter(t => t.namespace === ns)
    return acc
  }, {} as Record<string, typeof tags>)

  // Stats por namespace
  const nsCounts = Object.keys(NS_CONFIG).reduce((acc, ns) => {
    acc[ns] = tags.filter(t => t.namespace === ns).length
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-black mb-2" style={{ color: '#f0ece8' }}>
          Explorar tags
        </h1>
        <p className="text-sm" style={{ color: 'rgba(160,152,144,1)' }}>
          {tags.length} tags disponibles · {totalMangas} mangas en la plataforma
        </p>
      </div>

      {/* Stats por namespace */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-8">
        {Object.entries(NS_CONFIG).map(([ns, config]) => (
          <Link
            key={ns}
            href={nsFilter === ns ? '/tags' : `/tags?ns=${ns}&sort=${sort}`}
            className="flex flex-col gap-1 p-4 rounded-xl border transition-all"
            style={{
              background:  nsFilter === ns ? `${config.color}15` : 'rgba(255,255,255,0.03)',
              borderColor: nsFilter === ns ? `${config.color}40` : 'rgba(255,255,255,0.06)',
            }}
          >
            <span className="text-xl">{config.emoji}</span>
            <span className="text-xs font-semibold" style={{ color: nsFilter === ns ? config.color : '#f0ece8' }}>
              {config.label}
            </span>
            <span className="text-xs" style={{ color: 'rgba(96,88,80,1)' }}>
              {nsCounts[ns]} tags
            </span>
          </Link>
        ))}
      </div>

      {/* Controles de orden */}
      <div className="flex items-center gap-2 mb-8 flex-wrap">
        <span className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: 'rgba(96,88,80,1)' }}
        >
          Ordenar:
        </span>
        {[
          { value: 'az',      label: 'A → Z'    },
          { value: 'za',      label: 'Z → A'    },
          { value: 'popular', label: 'Populares' },
        ].map(opt => (
          <Link
            key={opt.value}
            href={`/tags?sort=${opt.value}${nsFilter ? `&ns=${nsFilter}` : ''}`}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background:  sort === opt.value ? 'rgba(196,149,106,0.15)' : 'rgba(255,255,255,0.04)',
              border:      `1px solid ${sort === opt.value ? 'rgba(196,149,106,0.40)' : 'rgba(255,255,255,0.06)'}`,
              color:       sort === opt.value ? '#C4956A' : 'rgba(160,152,144,1)',
            }}
          >
            {opt.label}
          </Link>
        ))}

        {nsFilter && (
          <Link
            href={`/tags?sort=${sort}`}
            className="ml-auto text-xs px-3 py-1.5 rounded-lg transition-all"
            style={{
              background:  'rgba(232,66,74,0.10)',
              border:      '1px solid rgba(232,66,74,0.25)',
              color:       '#E8424A',
            }}
          >
            ✕ Quitar filtro
          </Link>
        )}
      </div>

      {/* Tags agrupados por namespace */}
      {nsFilter ? (
        // Vista filtrada — solo un namespace
        <section>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">{NS_CONFIG[nsFilter]?.emoji}</span>
            <h2 className="text-lg font-bold" style={{ color: '#f0ece8' }}>
              {NS_CONFIG[nsFilter]?.label}
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(160,152,144,1)' }}
            >
              {sorted.length} tags
            </span>
          </div>
          <TagCloud tags={sorted} color={NS_CONFIG[nsFilter]?.color ?? '#C4956A'} />
        </section>
      ) : (
        // Vista completa — todos los namespaces
        <div className="flex flex-col gap-10">
          {Object.entries(NS_CONFIG).map(([ns, config]) => {
            const nsTags = grouped[ns] ?? []
            if (nsTags.length === 0) return null
            return (
              <section key={ns}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{config.emoji}</span>
                    <h2 className="text-base font-bold" style={{ color: '#f0ece8' }}>
                      {config.label}
                    </h2>
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(160,152,144,1)' }}
                    >
                      {nsTags.length}
                    </span>
                  </div>
                  <Link
                    href={`/tags?ns=${ns}&sort=${sort}`}
                    className="text-xs transition-colors"
                    style={{ color: config.color }}
                  >
                    Ver todos →
                  </Link>
                </div>
                <TagCloud tags={nsTags} color={config.color} />
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}

function TagCloud({
  tags,
  color,
}: {
  tags: Array<{ id: string; name: string; slug: string; usage_count: number }>
  color: string
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map(tag => (
        <Link
          key={tag.id}
          href={`/tag/${tag.slug}`}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:scale-105"
          style={{
            background:  `${color}12`,
            border:      `1px solid ${color}25`,
            color:       'rgba(200,192,184,1)',
          }}
        >
          {tag.name}
          {tag.usage_count > 0 && (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
              style={{ background: `${color}25`, color }}
            >
              {tag.usage_count}
            </span>
          )}
        </Link>
      ))}
    </div>
  )
}