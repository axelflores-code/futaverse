'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface MangaScoreProps {
  mangaId: string
  currentScore: number
}

export function MangaScore({ mangaId, currentScore }: MangaScoreProps) {
  const [userScore, setUserScore]   = useState<number>(0)
  const [hovered, setHovered]       = useState<number>(0)
  const [loading, setLoading]       = useState(false)
  const [isAuth, setIsAuth]         = useState(false)
  const [avgScore, setAvgScore]     = useState(currentScore)

  useEffect(() => {
    const supabase = createClient()

    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setIsAuth(true)

      const { data } = await supabase
        .from('manga_scores')
        .select('score')
        .eq('manga_id', mangaId)
        .eq('user_id', user.id)
        .single()

      if (data) setUserScore(data.score)
    }

    load()
  }, [mangaId])

  async function handleScore(score: number) {
    if (!isAuth || loading) return
    setLoading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (userScore === score) {
      // Si hace clic en la misma estrella, elimina la puntuación
      await supabase
        .from('manga_scores')
        .delete()
        .eq('manga_id', mangaId)
        .eq('user_id', user.id)
      setUserScore(0)
    } else {
      await supabase
        .from('manga_scores')
        .upsert({
          user_id:  user.id,
          manga_id: mangaId,
          score,
        }, { onConflict: 'user_id,manga_id' })
      setUserScore(score)
    }

    // Actualizar score promedio
    const { data: manga } = await supabase
      .from('mangas')
      .select('score')
      .eq('id', mangaId)
      .single()

    if (manga) setAvgScore(manga.score)
    setLoading(false)
  }

  const displayScore = hovered || userScore

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
          Puntuación
        </span>
        {avgScore > 0 && (
          <span className="text-xs text-yellow-400 font-semibold">
            ★ {avgScore.toFixed(1)}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1">
        {[1,2,3,4,5,6,7,8,9,10].map(star => (
          <button
            key={star}
            onClick={() => handleScore(star)}
            onMouseEnter={() => isAuth && setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            disabled={!isAuth || loading}
            title={isAuth ? `Puntuar ${star}/10` : 'Inicia sesión para puntuar'}
            className={cn(
              'text-lg transition-all duration-100',
              !isAuth && 'cursor-not-allowed opacity-40',
              loading && 'cursor-wait',
            )}
          >
            <span className={cn(
              'transition-colors',
              star <= displayScore
                ? 'text-yellow-400'
                : 'text-zinc-700 hover:text-yellow-600'
            )}>
              ★
            </span>
          </button>
        ))}

        {userScore > 0 && (
          <span className="text-xs text-zinc-500 ml-2">
            Tu nota: {userScore}/10
          </span>
        )}
      </div>

      {!isAuth && (
        <p className="text-xs text-zinc-600">
          <a href="/login" className="text-red-400 hover:text-red-300 transition-colors">
            Inicia sesión
          </a>{' '}
          para puntuar
        </p>
      )}
    </div>
  )
}