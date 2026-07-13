'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  mangaId: string
}

export function MangaViewTracker({ mangaId }: Props) {
  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('manga_views')
      .insert({ manga_id: mangaId })
      .then(() => {})
  }, [mangaId])

  return null
}