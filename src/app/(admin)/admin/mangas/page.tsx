// src/app/(admin)/admin/mangas/page.tsx

import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { PublishButton } from '@/components/admin/PublishButton'

export default async function AdminMangasPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab = 'drafts' } = await searchParams
  const supabase = await createClient()

  const { data: allMangas } = await supabase
    .from('mangas')
    .select('id, slug, title, status, score, views, published, created_at, cover_url')
    .order('created_at', { ascending: false })

  const drafts    = (allMangas ?? []).filter(m => !m.published)
  const published = (allMangas ?? []).filter(m => m.published)
  const current   = tab === 'published' ? published : drafts

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#f0ece8' }}>Mangas</h1>
        <Link
          href="/admin/mangas/new"
          style={{ padding: '8px 16px', borderRadius: '8px', background: '#C4956A', color: '#0c0c12', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}
        >
          + Nuevo manga
        </Link>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '4px', width: 'fit-content' }}>
        {[
          { value: 'drafts',    label: 'Borradores', count: drafts.length,    color: '#C4956A' },
          { value: 'published', label: 'Publicados',  count: published.length, color: '#1D9E75' },
        ].map(t => (
          <Link
            key={t.value}
            href={`/admin/mangas?tab=${t.value}`}
            style={{
              display:        'flex',
              alignItems:     'center',
              gap:            '8px',
              padding:        '8px 16px',
              borderRadius:   '8px',
              fontSize:       '13px',
              fontWeight:     tab === t.value ? 600 : 400,
              textDecoration: 'none',
              background:     tab === t.value ? '#111118' : 'transparent',
              color:          tab === t.value ? t.color : 'rgba(160,152,144,0.6)',
              border:         tab === t.value ? `1px solid ${t.color}30` : '1px solid transparent',
              transition:     'all .15s',
            }}
          >
            {t.label}
            <span style={{ padding: '1px 7px', borderRadius: '12px', fontSize: '11px', background: tab === t.value ? `${t.color}20` : 'rgba(255,255,255,0.06)', color: tab === t.value ? t.color : 'rgba(160,152,144,0.5)' }}>
              {t.count}
            </span>
          </Link>
        ))}
      </div>

      {/* Tabla */}
      <div style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', overflow: 'hidden' }}>
        {current.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'rgba(160,152,144,0.4)', fontSize: '14px' }}>
            {tab === 'drafts' ? 'No hay borradores pendientes' : 'No hay mangas publicados'}
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {['Portada', 'Título', 'Estado', 'Score', 'Vistas', 'Acciones'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '12px 16px', color: 'rgba(96,88,80,1)', fontWeight: 500, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {current.map((manga, i) => (
                <tr
                  key={manga.id}
                  style={{ borderBottom: i < current.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
                >
                  {/* Portada */}
                  <td style={{ padding: '10px 16px' }}>
                    <div style={{ width: '36px', height: '52px', borderRadius: '5px', overflow: 'hidden', background: '#18181f', flexShrink: 0 }}>
                      {manga.cover_url && (
                        <img src={manga.cover_url} alt={manga.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      )}
                    </div>
                  </td>

                  {/* Título */}
                  <td style={{ padding: '10px 16px' }}>
                    <p style={{ color: '#f0ece8', fontWeight: 500, marginBottom: '2px' }}>{manga.title}</p>
                    <p style={{ color: 'rgba(96,88,80,1)', fontSize: '11px' }}>{manga.slug}</p>
                  </td>

                  {/* Estado */}
                  <td style={{ padding: '10px 16px' }}>
                    <span style={{
                      padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600,
                      background: manga.status === 'ongoing' ? 'rgba(29,158,117,0.12)' : manga.status === 'completed' ? 'rgba(61,90,158,0.12)' : 'rgba(196,149,106,0.12)',
                      color: manga.status === 'ongoing' ? '#1D9E75' : manga.status === 'completed' ? '#3D5A9E' : '#C4956A',
                    }}>
                      {manga.status === 'ongoing' ? 'En curso' : manga.status === 'completed' ? 'Completo' : 'Pausado'}
                    </span>
                  </td>

                  {/* Score */}
                  <td style={{ padding: '10px 16px', color: 'rgba(160,152,144,0.7)' }}>
                    {manga.score > 0 ? `★ ${manga.score}` : '—'}
                  </td>

                  {/* Vistas */}
                  <td style={{ padding: '10px 16px', color: 'rgba(160,152,144,0.7)' }}>
                    {manga.views.toLocaleString()}
                  </td>

                  {/* Acciones */}
                  <td style={{ padding: '10px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <Link
                        href={`/admin/mangas/${manga.slug}`}
                        style={{ fontSize: '12px', color: '#3D5A9E', textDecoration: 'none', padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(61,90,158,0.25)', background: 'rgba(61,90,158,0.08)' }}
                      >
                        Editar
                      </Link>

                      <PublishButton
                        mangaId={manga.id}
                        published={manga.published}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}