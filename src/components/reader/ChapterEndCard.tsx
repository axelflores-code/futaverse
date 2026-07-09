'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useReaderStore } from '@/stores/readerStore'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface ChapterNav { id: string; number: number; mangaId: string }

interface ChapterEndCardProps {
  chapterNumber: number
  mangaSlug:     string
  chapterId:     string
  prevChapter:   ChapterNav | null
  nextChapter:   ChapterNav | null
}

type ChapterReaction = '😍' | '😐' | '😭' | '🔥' | '😤'

const REACTIONS: { emoji: ChapterReaction; label: string }[] = [
  { emoji: '😍', label: 'Me encantó'   },
  { emoji: '😐', label: 'No me gusto'     },
  { emoji: '😭', label: 'Me entristece'      },
  { emoji: '🔥', label: 'Riko'     },
  { emoji: '😤', label: 'Me enoja'   },
]

export function ChapterEndCard({
  chapterNumber,
  mangaSlug,
  chapterId,
  prevChapter,
  nextChapter,
}: ChapterEndCardProps) {
  const { settings }                        = useReaderStore()
  const [userReaction, setUserReaction]     = useState<ChapterReaction | null>(null)
  const [counts, setCounts]                 = useState<Record<string, number>>({})
  const [isAuth, setIsAuth]                 = useState(false)
  const [loading, setLoading]               = useState(false)
  const [saved, setSaved]                   = useState(false)

  const isDark = settings.theme === 'dark'

  useEffect(() => {
    const supabase = createClient()

    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setIsAuth(true)

      // Cargar conteos de reacciones del capítulo
      const { data: allReactions } = await supabase
        .from('chapter_reactions')
        .select('type')
        .eq('chapter_id', chapterId)

      if (allReactions) {
        const newCounts: Record<string, number> = {}
        allReactions.forEach(r => {
          newCounts[r.type] = (newCounts[r.type] ?? 0) + 1
        })
        setCounts(newCounts)
      }

      if (!user) return

      // Ver reacción del usuario
      const { data: myReaction } = await supabase
        .from('chapter_reactions')
        .select('type')
        .eq('chapter_id', chapterId)
        .eq('user_id', user.id)
        .single()

      if (myReaction) setUserReaction(myReaction.type as ChapterReaction)
    }

    load()
  }, [chapterId])

  async function handleReaction(emoji: ChapterReaction) {
    if (loading) return
    setLoading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      window.location.href = '/login'
      return
    }

    if (userReaction === emoji) {
      await supabase
        .from('chapter_reactions')
        .delete()
        .eq('chapter_id', chapterId)
        .eq('user_id', user.id)
      setCounts(prev => ({ ...prev, [emoji]: Math.max(0, (prev[emoji] ?? 1) - 1) }))
      setUserReaction(null)
    } else {
      if (userReaction) {
        setCounts(prev => ({ ...prev, [userReaction]: Math.max(0, (prev[userReaction] ?? 1) - 1) }))
      }
      await supabase
        .from('chapter_reactions')
        .upsert({
          user_id:    user.id,
          chapter_id: chapterId,
          type:       emoji,
        }, { onConflict: 'user_id,chapter_id' })
      setCounts(prev => ({ ...prev, [emoji]: (prev[emoji] ?? 0) + 1 }))
      setUserReaction(emoji)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }

    setLoading(false)
  }

  const cardStyle = isDark
    ? 'border-[#1e1e1e] bg-[#0f0f0f] text-zinc-400'
    : 'border-zinc-200 bg-white text-zinc-500'

  return (
    <div className={cn('w-full border-t flex flex-col items-center gap-5 py-12 px-6 text-center', cardStyle)}>
      <div>
        <p className="text-sm font-semibold mb-1" style={{ color: isDark ? '#e0e0e0' : '#1a1a1a' }}>
          Fin del capítulo {chapterNumber}
        </p>
        <p className="text-xs">¿Qué te pareció este capítulo?</p>
      </div>

      {/* Reacciones */}
      <div className="flex gap-2 flex-wrap justify-center">
        {REACTIONS.map(({ emoji, label }) => (
          <button
            key={emoji}
            onClick={() => handleReaction(emoji)}
            disabled={loading}
            title={label}
            className={cn(
              'flex flex-col items-center gap-1 px-3 py-2 rounded-xl border transition-all duration-150',
              userReaction === emoji
                ? 'border-red-500/50 bg-red-500/10 scale-110'
                : isDark
                ? 'border-[#222] hover:border-[#333] hover:bg-[#161616]'
                : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'
            )}
          >
            <span className="text-xl">{emoji}</span>
            {counts[emoji] > 0 && (
              <span className="text-[10px] text-zinc-500">{counts[emoji]}</span>
            )}
          </button>
        ))}
      </div>

      {saved && (
        <p className="text-xs text-emerald-400 animate-pulse">¡Reacción guardada!</p>
      )}

      {!isAuth && (
        <p className="text-xs text-zinc-600">
          <a href="/login" className="text-red-400 hover:text-red-300">Inicia sesión</a> para guardar tu reacción
        </p>
      )}

      {/* Navegación */}
      <div className="flex gap-3 flex-wrap justify-center">
        {prevChapter && (
          <Link
            href={`/read/${mangaSlug}/${prevChapter.number}`}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-lg border text-sm font-medium transition-all',
              isDark
                ? 'border-[#222] text-zinc-500 hover:border-[#333] hover:text-zinc-300 hover:bg-[#161616]'
                : 'border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:text-zinc-700'
            )}
          >
            ← Cap. {prevChapter.number}
          </Link>
        )}
        {nextChapter && (
          <Link
            href={`/read/${mangaSlug}/${nextChapter.number}`}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-400 text-white text-sm font-semibold transition-colors"
          >
            Cap. {nextChapter.number} →
          </Link>
        )}
      </div>
    </div>
  )
}