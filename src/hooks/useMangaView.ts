'use client'

// src/hooks/useMangaView.ts
// Registra una vista cuando el usuario entra a un manga o capítulo

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useMangaView(mangaId: string) {
  useEffect(() => {
    if (!mangaId) return

    const supabase = createClient()

    // Registrar vista — fire and forget
    supabase
      .from('manga_views')
      .insert({ manga_id: mangaId })
      .then(() => {})

  }, [mangaId])
}