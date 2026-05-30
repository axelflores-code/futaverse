'use client';

import { useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useReadingProgress(chapterId: string) {
  const supabase = createClient();
  const lastSavedPage = useRef<number>(-1);

  const saveProgress = useCallback(
    async (page: number) => {
      // No guardar si la página no cambió
      if (page === lastSavedPage.current) return;
      lastSavedPage.current = page;

      // Verificar sesión sin bloquear el UI thread
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('reading_progress').upsert(
        {
          user_id: user.id,
          chapter_id: chapterId,
          page,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,chapter_id' }
      );
    },
    [chapterId, supabase]
  );

  return { saveProgress };
}