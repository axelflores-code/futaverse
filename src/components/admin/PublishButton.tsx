'use client'

// src/components/admin/PublishButton.tsx

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface PublishButtonProps {
  mangaId:   string
  published: boolean
}

export function PublishButton({ mangaId, published }: PublishButtonProps) {
  const router = useRouter()
  const [loading, setLoading]       = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  async function handlePublishToggle() {
    setLoading(true)
    const supabase = createClient()
    await supabase
      .from('mangas')
      .update({ published: !published })
      .eq('id', mangaId)
    setLoading(false)
    router.refresh()
  }

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true)
      setTimeout(() => setConfirmDelete(false), 3000)
      return
    }
    setLoading(true)
    const supabase = createClient()
    await supabase.from('mangas').delete().eq('id', mangaId)
    setLoading(false)
    router.refresh()
  }

  return (
    <>
      {/* Publicar / Despublicar */}
      <button
        onClick={handlePublishToggle}
        disabled={loading}
        style={{
          fontSize:     '12px',
          padding:      '4px 10px',
          borderRadius: '6px',
          border:       published ? '1px solid rgba(196,149,106,0.25)' : '1px solid rgba(29,158,117,0.30)',
          background:   published ? 'rgba(196,149,106,0.08)' : 'rgba(29,158,117,0.10)',
          color:        published ? '#C4956A' : '#1D9E75',
          cursor:       loading ? 'wait' : 'pointer',
          fontWeight:   600,
        }}
      >
        {loading ? '...' : published ? '↩ Despublicar' : '✓ Publicar'}
      </button>

      {/* Eliminar */}
      <button
        onClick={handleDelete}
        disabled={loading}
        style={{
          fontSize:     '12px',
          padding:      '4px 10px',
          borderRadius: '6px',
          border:       confirmDelete ? '1px solid #9E3D3D' : '1px solid rgba(158,61,61,0.20)',
          background:   confirmDelete ? 'rgba(158,61,61,0.15)' : 'transparent',
          color:        '#9E3D3D',
          cursor:       loading ? 'wait' : 'pointer',
          fontWeight:   confirmDelete ? 700 : 400,
        }}
      >
        {confirmDelete ? '¿Confirmar?' : 'Eliminar'}
      </button>
    </>
  )
}