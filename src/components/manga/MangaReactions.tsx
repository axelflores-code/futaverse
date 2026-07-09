'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'


interface MangaReactionsProps {
  mangaId: string
}

type ReactionType = 'like' | 'love' | 'fire' | 'wow'

const REACTIONS: { type: ReactionType; emoji: string; label: string }[] = [
  { type: 'like',  emoji: '👍', label: 'Me gusta' },
  { type: 'love',  emoji: '❤️',  label: 'Me encanta' },
  { type: 'fire',  emoji: '🔥', label: 'Fuego' },
  { type: 'wow',   emoji: '😱', label: 'Increíble' },
]

export function MangaReactions({ mangaId }: MangaReactionsProps) {
  const [counts, setCounts]       = useState<Record<ReactionType, number>>({
    like: 0, love: 0, fire: 0, wow: 0,
  })
  const [userReaction, setUserReaction] = useState<ReactionType | null>(null)
  const [isAuth, setIsAuth]             = useState(false)
  const [loading, setLoading]           = useState(false)

  useEffect(() => {
    const supabase = createClient()

    async function load() {
      // Cargar conteos
      const { data: allReactions } = await supabase
        .from('reactions')
        .select('type')
        .eq('manga_id', mangaId)

      if (allReactions) {
        const newCounts = { like: 0, love: 0, fire: 0, wow: 0 }
        allReactions.forEach(r => {
          newCounts[r.type as ReactionType]++
        })
        setCounts(newCounts)
      }

      // Ver reacción del usuario
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setIsAuth(true)

      const { data: myReaction } = await supabase
        .from('reactions')
        .select('type')
        .eq('manga_id', mangaId)
        .eq('user_id', user.id)
        .single()

      if (myReaction) setUserReaction(myReaction.type as ReactionType)
    }

    load()
  }, [mangaId])

  async function handleReaction(type: ReactionType) {
    if (!isAuth || loading) return
    setLoading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    if (userReaction === type) {
      // Quitar reacción
      await supabase
        .from('reactions')
        .delete()
        .eq('manga_id', mangaId)
        .eq('user_id', user.id)

      setCounts(prev => ({ ...prev, [type]: Math.max(0, prev[type] - 1) }))
      setUserReaction(null)
    } else {
      // Cambiar o agregar reacción
      if (userReaction) {
        setCounts(prev => ({ ...prev, [userReaction]: Math.max(0, prev[userReaction] - 1) }))
      }

      await supabase
        .from('reactions')
        .upsert({
          user_id:  user.id,
          manga_id: mangaId,
          type,
        }, { onConflict: 'user_id,manga_id' })

      setCounts(prev => ({ ...prev, [type]: prev[type] + 1 }))
      setUserReaction(type)
    }

    setLoading(false)
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
        Reacciones
      </span>
      <div className="flex gap-2 flex-wrap">
        {REACTIONS.map(({ type, emoji, label }) => (
          <button
            key={type}
            onClick={() => handleReaction(type)}
            disabled={!isAuth || loading}
            title={isAuth ? label : 'Inicia sesión para reaccionar'}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm transition-all',
              userReaction === type
                ? 'border-red-500/50 bg-red-500/10 text-white'
                : 'border-white/10 text-zinc-400 hover:border-white/20 hover:text-white',
              !isAuth && 'opacity-50 cursor-not-allowed',
              loading && 'cursor-wait'
            )}
          >
            <span>{emoji}</span>
            {counts[type] > 0 && (
              <span className="text-xs font-medium">{counts[type]}</span>
            )}
          </button>
        ))}
      </div>
      {!isAuth && (
        <p className="text-xs text-zinc-600">
          <a href="/login" className="text-red-400 hover:text-red-300 transition-colors">
            Inicia sesión
          </a>{' '}
          para reaccionar
        </p>
      )}
    </div>
  )
}