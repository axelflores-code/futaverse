'use client'

// src/components/reader/ChapterEndCard.tsx

import Link                    from 'next/link'
import { useState, useEffect } from 'react'
import { useReaderStore }      from '@/stores/readerStore'
import { createClient }        from '@/lib/supabase/client'
import { ChapterComments } from './ChapterComments'

interface ChapterNav { id: string; number: number; mangaId: string }

interface ChapterEndCardProps {
  chapterNumber: number
  mangaSlug:     string
  chapterId:     string
  prevChapter:   ChapterNav | null
  nextChapter:   ChapterNav | null
}

type ChapterReaction = '😍' | '😐' | '😢' | '🔥' | '🤮'

const REACTIONS: { emoji: ChapterReaction; label: string }[] = [
  { emoji: '😍', label: 'Me encantó'  },
  { emoji: '😐', label: 'Normal'      },
  { emoji: '😢', label: 'Me entristeció' },
  { emoji: '🔥', label: 'Genial'      },
  { emoji: '🤮', label: 'No me gustó' },
]

// Clave localStorage para reacciones anónimas
function getLocalKey(chapterId: string) {
  return `fv_reaction_${chapterId}`
}

export function ChapterEndCard({
  chapterNumber,
  mangaSlug,
  chapterId,
  prevChapter,
  nextChapter,
}: ChapterEndCardProps) {
  const { settings }                    = useReaderStore()
  const [userReaction, setUserReaction] = useState<ChapterReaction | null>(null)
  const [counts,       setCounts]       = useState<Record<string, number>>({})
  const [loading,      setLoading]      = useState(false)
  const [saved,        setSaved]        = useState(false)

  const isDark = settings.theme === 'dark'

  useEffect(() => {
    const supabase = createClient()

    async function load() {
      // Cargar conteos
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

      // Ver si ya reaccionó (primero localStorage para anónimos)
      const localReaction = localStorage.getItem(getLocalKey(chapterId))
      if (localReaction) {
        setUserReaction(localReaction as ChapterReaction)
        return
      }

      // Si tiene sesión, ver en DB
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

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

    if (userReaction === emoji) {
      // Quitar reacción
      setCounts(prev => ({ ...prev, [emoji]: Math.max(0, (prev[emoji] ?? 1) - 1) }))
      setUserReaction(null)
      localStorage.removeItem(getLocalKey(chapterId))

      if (user) {
        await supabase
          .from('chapter_reactions')
          .delete()
          .eq('chapter_id', chapterId)
          .eq('user_id', user.id)
      }
    } else {
      // Quitar reacción anterior del contador
      if (userReaction) {
        setCounts(prev => ({ ...prev, [userReaction]: Math.max(0, (prev[userReaction] ?? 1) - 1) }))
      }

      // Agregar nueva
      setCounts(prev => ({ ...prev, [emoji]: (prev[emoji] ?? 0) + 1 }))
      setUserReaction(emoji)
      localStorage.setItem(getLocalKey(chapterId), emoji)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)

      if (user) {
        // Usuario con cuenta: guardar en DB
        await supabase
          .from('chapter_reactions')
          .upsert({
            user_id:    user.id,
            chapter_id: chapterId,
            type:       emoji,
          }, { onConflict: 'user_id,chapter_id' })
      }
      // Usuario anónimo: solo se guarda en localStorage (ya hecho arriba)
    }

    setLoading(false)
  }

  const cardStyle = isDark
    ? { borderColor: '#1e1e1e', background: '#0f0f0f', color: 'rgba(160,152,144,1)' }
    : { borderColor: '#e5e5e5', background: '#fff',    color: 'rgba(96,88,80,1)' }

  return (
    <div
      style={{ width: '100%', borderTop: `1px solid ${cardStyle.borderColor}`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', padding: '40px 24px', textAlign: 'center', background: cardStyle.background }}
    >
      <div>
        <p style={{ fontSize: '15px', fontWeight: 600, color: isDark ? '#e0e0e0' : '#1a1a1a', marginBottom: '4px' }}>
          Fin del capítulo {chapterNumber}
        </p>
        <p style={{ fontSize: '13px', color: cardStyle.color }}>
          ¿Qué te pareció este capítulo?
        </p>
      </div>

      {/* Reacciones — disponibles para todos */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {REACTIONS.map(({ emoji, label }) => (
          <button
            key={emoji}
            onClick={() => handleReaction(emoji)}
            disabled={loading}
            title={label}
            style={{
              display:       'flex',
              flexDirection: 'column',
              alignItems:    'center',
              gap:           '4px',
              padding:       '10px 14px',
              borderRadius:  '12px',
              border:        userReaction === emoji
                ? '1px solid #C4956A'
                : `1px solid ${isDark ? '#222' : '#e5e5e5'}`,
              background:    userReaction === emoji
                ? 'rgba(196,149,106,0.12)'
                : isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
              cursor:        loading ? 'wait' : 'pointer',
              transition:    'all .15s',
              transform:     userReaction === emoji ? 'scale(1.10)' : 'scale(1)',
            }}
          >
            <span style={{ fontSize: '24px', lineHeight: 1 }}>{emoji}</span>
            {counts[emoji] > 0 && (
              <span style={{ fontSize: '11px', color: userReaction === emoji ? '#C4956A' : cardStyle.color, fontWeight: 600 }}>
                {counts[emoji]}
              </span>
            )}
          </button>
        ))}
      </div>

      {saved && (
        <p style={{ fontSize: '12px', color: '#1D9E75' }}>✓ ¡Reacción guardada!</p>
      )}

      {/* Navegación entre capítulos */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {prevChapter && (
          <Link
            href={`/read/${mangaSlug}/${prevChapter.number}`}
            style={{
              display:        'inline-flex',
              alignItems:     'center',
              gap:            '6px',
              padding:        '9px 18px',
              borderRadius:   '10px',
              fontSize:       '13px',
              fontWeight:     500,
              textDecoration: 'none',
              border:         `1px solid ${isDark ? '#222' : '#e5e5e5'}`,
              color:          cardStyle.color,
              background:     isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
            }}
          >
            ← Cap. {prevChapter.number}
          </Link>
        )}
        {nextChapter && (
          <Link
            href={`/read/${mangaSlug}/${nextChapter.number}`}
            style={{
              display:        'inline-flex',
              alignItems:     'center',
              gap:            '6px',
              padding:        '9px 18px',
              borderRadius:   '10px',
              fontSize:       '13px',
              fontWeight:     600,
              textDecoration: 'none',
              background:     '#C4956A',
              color:          '#0c0c12',
            }}
          >
            Cap. {nextChapter.number} →
          </Link>
        )}
      </div>

      {/* Comentarios */}
<ChapterComments
  chapterId={chapterId}
  mangaId={mangaSlug}
/>
    </div>
  )
}