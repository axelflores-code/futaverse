'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface DeleteMangaButtonProps {
  mangaId: string
}

interface MangaDeleteData {
  slug: string
  manga_tags?: Array<{
    tags: {
      slug: string
    } | null
  }>
}

export function DeleteMangaButton({ mangaId }: DeleteMangaButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true)
      window.setTimeout(() => setConfirmDelete(false), 3000)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      /*
       * Guardamos el slug y los tags antes de eliminar.
       * Después del borrado ya no podríamos consultarlos.
       */
      const { data: mangaRaw, error: mangaError } = await supabase
        .from('mangas')
        .select(`
          slug,
          manga_tags (
            tags (slug)
          )
        `)
        .eq('id', mangaId)
        .maybeSingle()

      if (mangaError) {
        throw new Error(`No se pudo cargar el manga: ${mangaError.message}`)
      }

      if (!mangaRaw) {
        throw new Error('El manga ya no existe.')
      }

      const manga = mangaRaw as unknown as MangaDeleteData
      const tagSlugs = (manga.manga_tags ?? [])
        .map((relation) => relation.tags?.slug)
        .filter((slug): slug is string => Boolean(slug))

      const { error: deleteError } = await supabase
        .from('mangas')
        .delete()
        .eq('id', mangaId)

      if (deleteError) {
        throw new Error(`No se pudo eliminar el manga: ${deleteError.message}`)
      }

      const cacheResponse = await fetch('/api/admin/revalidate-manga', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          previousSlug: manga.slug,
          tagSlugs,
        }),
      })

      if (!cacheResponse.ok) {
        console.error('El manga se eliminó, pero no se pudo invalidar el caché.')
      }

      setConfirmDelete(false)
      router.refresh()
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Error desconocido.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <button
        type="button"
        onClick={handleDelete}
        disabled={loading}
        style={{
          fontSize: '12px',
          padding: '4px 10px',
          borderRadius: '6px',
          border: confirmDelete
            ? '1px solid #9E3D3D'
            : '1px solid rgba(158,61,61,0.20)',
          background: confirmDelete
            ? 'rgba(158,61,61,0.15)'
            : 'transparent',
          color: '#9E3D3D',
          cursor: loading ? 'wait' : 'pointer',
          fontWeight: confirmDelete ? 700 : 400,
        }}
      >
        {loading ? 'Eliminando...' : confirmDelete ? '¿Confirmar?' : 'Eliminar'}
      </button>

      {error && (
        <span className="max-w-56 text-right text-xs text-red-400">
          {error}
        </span>
      )}
    </div>
  )
}