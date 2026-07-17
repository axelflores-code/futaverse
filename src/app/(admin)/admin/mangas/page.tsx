// src/app/(admin)/admin/mangas/page.tsx

import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { DeleteMangaButton } from '@/components/admin/DeleteMangaButton'

export default async function AdminMangasPage() {
  const supabase = await createClient()

  const { data: mangas } = await supabase
    .from('mangas')
    .select('id, slug, title, status, score, views, created_at, cover_url')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#f0ece8' }}>
          Mangas
          <span style={{ fontSize: '14px', fontWeight: 400, color: 'rgba(160,152,144,0.5)', marginLeft: '8px' }}>
            ({(mangas ?? []).length})
          </span>
        </h1>
        <Link
          href="/admin/mangas/new"
          style={{ padding: '8px 16px', borderRadius: '8px', background: '#C4956A', color: '#0c0c12', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}
        >
          + Nuevo manga
        </Link>
      </div>

      <div style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', overflow: 'hidden' }}>
        {(mangas ?? []).length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'rgba(160,152,144,0.4)', fontSize: '14px' }}>
            No hay mangas todavía.{' '}
            <Link href="/admin/mangas/new" style={{ color: '#C4956A' }}>Crea el primero</Link>
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
              {(mangas ?? []).map((manga, i) => (
                <tr key={manga.id} style={{ borderBottom: i < (mangas ?? []).length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                  <td style={{ padding: '10px 16px' }}>
                    <div style={{ width: '36px', height: '52px', borderRadius: '5px', overflow: 'hidden', background: '#18181f', flexShrink: 0 }}>
                      {manga.cover_url && (
                        <img src={manga.cover_url} alt={manga.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <p style={{ color: '#f0ece8', fontWeight: 500, marginBottom: '2px' }}>{manga.title}</p>
                    <p style={{ color: 'rgba(96,88,80,1)', fontSize: '11px' }}>{manga.slug}</p>
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <span style={{
                      padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600,
                      background: manga.status === 'ongoing' ? 'rgba(29,158,117,0.12)' : manga.status === 'completed' ? 'rgba(61,90,158,0.12)' : 'rgba(196,149,106,0.12)',
                      color: manga.status === 'ongoing' ? '#1D9E75' : manga.status === 'completed' ? '#3D5A9E' : '#C4956A',
                    }}>
                      {manga.status === 'ongoing' ? 'En curso' : manga.status === 'completed' ? 'Completo' : 'Pausado'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 16px', color: 'rgba(160,152,144,0.7)' }}>
                    {manga.score > 0 ? `★ ${manga.score}` : '—'}
                  </td>
                  <td style={{ padding: '10px 16px', color: 'rgba(160,152,144,0.7)' }}>
                    {manga.views.toLocaleString()}
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Link
                        href={`/admin/mangas/${manga.slug}`}
                        style={{ fontSize: '12px', color: '#3D5A9E', textDecoration: 'none', padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(61,90,158,0.25)', background: 'rgba(61,90,158,0.08)' }}
                      >
                        Editar
                      </Link>
                      <Link
                        href={`/admin/chapters?manga=${manga.slug}`}
                        style={{ fontSize: '12px', color: '#C4956A', textDecoration: 'none', padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(196,149,106,0.25)', background: 'rgba(196,149,106,0.08)' }}
                      >
                        + Capítulo
                      </Link>
                      <DeleteMangaButton mangaId={manga.id} />
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