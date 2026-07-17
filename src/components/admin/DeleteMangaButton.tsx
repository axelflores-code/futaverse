'use client'

// src/components/admin/DeleteMangaButton.tsx

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface DeleteMangaButtonProps {
  mangaId: string
}

export function DeleteMangaButton({ mangaId }: DeleteMangaButtonProps) {
  const router = useRouter()
  const [loading, setLoading]             = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

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
      {loading ? '...' : confirmDelete ? '¿Confirmar?' : 'Eliminar'}
    </button>
  )
}