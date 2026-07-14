'use client'

// src/components/manga/FavoriteButton.tsx

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { FavoriteStatus } from '@/types/manga'

interface FavoriteButtonProps {
  mangaId: string
}

const STATUS_OPTIONS: { value: FavoriteStatus; label: string; color: string }[] = [
  { value: 'reading',      label: 'Leyendo',     color: '#3D5A9E' },
  { value: 'completed',    label: 'Completado',  color: '#1D9E75' },
  { value: 'on_hold',      label: 'En pausa',    color: '#C4956A' },
  { value: 'dropped',      label: 'Abandonado',  color: '#9E3D3D' },
  { value: 'plan_to_read', label: 'Pendiente',   color: '#888780' },
]

export function FavoriteButton({ mangaId }: FavoriteButtonProps) {
  const [status,    setStatus]    = useState<FavoriteStatus | null>(null)
  const [isAuth,    setIsAuth]    = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [showMenu,  setShowMenu]  = useState(false)
  const [saved,     setSaved]     = useState(false)

  useEffect(() => {
    const supabase = createClient()
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setIsAuth(true)
      const { data } = await supabase
        .from('favorites')
        .select('status')
        .eq('manga_id', mangaId)
        .eq('user_id', user.id)
        .single()
      if (data) setStatus(data.status as FavoriteStatus)
    }
    load()
  }, [mangaId])

  async function handleStatus(newStatus: FavoriteStatus) {
    if (loading) return
    setLoading(true)
    setShowMenu(false)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }

    if (status === newStatus) {
      await supabase.from('favorites').delete().eq('manga_id', mangaId).eq('user_id', user.id)
      setStatus(null)
    } else {
      await supabase.from('favorites').upsert(
        { user_id: user.id, manga_id: mangaId, status: newStatus, progress: 0 },
        { onConflict: 'user_id,manga_id' }
      )
      setStatus(newStatus)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
    setLoading(false)
  }

  const currentOption = STATUS_OPTIONS.find(o => o.value === status)

  if (!isAuth) {
    return (
      <a
        href="/login"
        style={{
          display:        'inline-flex',
          alignItems:     'center',
          gap:            '8px',
          padding:        '9px 16px',
          borderRadius:   '8px',
          border:         '1px solid rgba(255,255,255,0.10)',
          color:          'rgba(160,152,144,1)',
          fontSize:       '13px',
          textDecoration: 'none',
          transition:     'all .15s',
        }}
      >
        <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
        </svg>
        Añadir a biblioteca
      </a>
    )
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setShowMenu(v => !v)}
        disabled={loading}
        style={{
          display:      'inline-flex',
          alignItems:   'center',
          gap:          '8px',
          padding:      '9px 16px',
          borderRadius: '8px',
          border:       status ? `1px solid ${currentOption?.color ?? '#C4956A'}40` : '1px solid rgba(255,255,255,0.10)',
          background:   status ? `${currentOption?.color ?? '#C4956A'}15` : 'transparent',
          color:        status ? (currentOption?.color ?? '#C4956A') : 'rgba(160,152,144,1)',
          fontSize:     '13px',
          cursor:       loading ? 'wait' : 'pointer',
          transition:   'all .15s',
        }}
      >
        <svg width="15" height="15" fill={status ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
        </svg>
        {loading ? 'Guardando...' : currentOption ? currentOption.label : 'Añadir a biblioteca'}
        <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
        </svg>
      </button>

      {showMenu && (
        <div style={{ position:'absolute', top:'calc(100% + 4px)', left:0, minWidth:'180px', background:'#111118', border:'1px solid rgba(255,255,255,0.10)', borderRadius:'10px', overflow:'hidden', boxShadow:'0 12px 40px rgba(0,0,0,0.6)', zIndex:50 }}>
          {STATUS_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => handleStatus(opt.value)}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              style={{ width:'100%', textAlign:'left', padding:'10px 14px', display:'flex', alignItems:'center', justifyContent:'space-between', background:'none', border:'none', cursor:'pointer', fontSize:'13px', color: status === opt.value ? opt.color : 'rgba(175,167,158,1)' }}
            >
              {opt.label}
              {status === opt.value && <span style={{ fontSize:'11px' }}>✓</span>}
            </button>
          ))}
          {status && (
            <>
              <div style={{ height:'1px', background:'rgba(255,255,255,0.06)' }} />
              <button
                onClick={() => handleStatus(status)}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                style={{ width:'100%', textAlign:'left', padding:'10px 14px', background:'none', border:'none', cursor:'pointer', fontSize:'13px', color:'#9E3D3D' }}
              >
                Quitar de biblioteca
              </button>
            </>
          )}
        </div>
      )}

      {saved && (
        <p style={{ position:'absolute', bottom:'-22px', left:0, fontSize:'11px', color:'#1D9E75', whiteSpace:'nowrap' }}>
          ✓ Guardado en biblioteca
        </p>
      )}
    </div>
  )
}