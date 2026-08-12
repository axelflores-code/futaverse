'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  mangaId: string
}

export function MangaViewTracker({ mangaId }: Props) {
  useEffect(() => {
    const storageKey = `mangafuta-view-${mangaId}`
    const previousView = sessionStorage.getItem(storageKey)

    if (previousView) {
      return
    }

    const registerView = async () => {
      const supabase = createClient()

      const { error } = await supabase.rpc(
        'record_manga_view',
        {
          p_manga_id: mangaId,
        }
      )

      if (!error) {
        sessionStorage.setItem(storageKey, '1')
      } else {
        console.error(
          'No se pudo registrar la vista:',
          error.message
        )
      }
    }

    void registerView()
  }, [mangaId])

  return null
}