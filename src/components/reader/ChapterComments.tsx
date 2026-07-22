'use client'

// src/components/reader/ChapterComments.tsx

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Comment {
  id:         string
  user_id:    string
  content:    string
  created_at: string
  parent_id:  string | null
  profiles:   { username: string | null } | null
  replies?:   Comment[]
}

interface ChapterCommentsProps {
  chapterId: string
  mangaId:   string
}

function timeAgo(date: string): string {
  const diff  = Date.now() - new Date(date).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 1)   return 'ahora mismo'
  if (mins < 60)  return `hace ${mins}m`
  if (hours < 24) return `hace ${hours}h`
  if (days < 30)  return `hace ${days}d`
  return new Date(date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

export function ChapterComments({ chapterId, mangaId }: ChapterCommentsProps) {
  const [comments,   setComments]   = useState<Comment[]>([])
  const [loading,    setLoading]    = useState(true)
  const [userId,     setUserId]     = useState<string | null>(null)
  const [isAdmin,    setIsAdmin]    = useState(false)
  const [content,    setContent]    = useState('')
  const [replyTo,    setReplyTo]    = useState<{ id: string; name: string } | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]      = useState<string | null>(null)

  const loadComments = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()

    const { data, error: fetchError } = await supabase
      .from('comments')
      .select('id, user_id, content, created_at, parent_id, profiles(username)')
      .eq('chapter_id', chapterId)
      .is('parent_id', null)
      .order('created_at', { ascending: false })

    if (fetchError || !data) { setLoading(false); return }

    // Cargar respuestas
    const withReplies = await Promise.all(
      data.map(async (c) => {
        const { data: replies } = await supabase
          .from('comments')
          .select('id, user_id, content, created_at, parent_id, profiles(username)')
          .eq('parent_id', c.id)
          .order('created_at', { ascending: true })
        return { ...c, replies: replies ?? [] }
      })
    )

    setComments(withReplies as unknown as Comment[])
    setLoading(false)
  }, [chapterId])

  useEffect(() => {
    const supabase = createClient()
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        if (profile?.role === 'admin') setIsAdmin(true)
      }
      loadComments()
    }
    init()
  }, [loadComments])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim() || submitting) return
    if (!userId) { window.location.href = '/login'; return }

    setSubmitting(true)
    setError(null)

    const supabase = createClient()
    const { error: insertError } = await supabase.from('comments').insert({
      user_id:    userId,
      manga_id:   mangaId,
      chapter_id: chapterId,
      content:    content.trim(),
      parent_id:  replyTo?.id ?? null,
    })

    if (insertError) {
      console.error('Comment error:', insertError)
      setError('Error al publicar. Verifica que has iniciado sesión.')
    } else {
      setContent('')
      setReplyTo(null)
      loadComments()
    }
    setSubmitting(false)
  }

  async function handleDelete(commentId: string) {
    const supabase = createClient()
    await supabase.from('comments').delete().eq('id', commentId)
    loadComments()
  }

  const totalCount = comments.reduce((acc, c) => acc + 1 + (c.replies?.length ?? 0), 0)

  return (
    <div style={{ marginTop: '48px', paddingTop: '32px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>

      {/* Header */}
      <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f0ece8', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ width: '3px', height: '18px', borderRadius: '2px', background: '#C4956A', display: 'inline-block' }} />
        Comentarios
        {totalCount > 0 && (
          <span style={{ fontSize: '12px', fontWeight: 400, color: 'rgba(160,152,144,0.5)', marginLeft: '2px' }}>
            ({totalCount})
          </span>
        )}
      </h3>

      {/* Formulario */}
      {userId ? (
        <form onSubmit={handleSubmit} style={{ marginBottom: '28px' }}>
          {replyTo && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(196,149,106,0.08)', border: '1px solid rgba(196,149,106,0.15)', borderRadius: '8px', marginBottom: '8px', fontSize: '12px', color: '#C4956A' }}>
              <span>Respondiendo a <strong>{replyTo.name}</strong></span>
              <button type="button" onClick={() => setReplyTo(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C4956A', fontSize: '16px', lineHeight: 1 }}>✕</button>
            </div>
          )}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder={replyTo ? `Responder a ${replyTo.name}...` : 'Escribe un comentario...'}
              maxLength={1000}
              rows={2}
              style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', color: '#f0ece8', outline: 'none', resize: 'none', fontFamily: 'inherit' }}
              onFocus={e => (e.target.style.borderColor = 'rgba(196,149,106,0.30)')}
              onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
            />
            <button
              type="submit"
              disabled={submitting || !content.trim()}
              style={{ padding: '10px 18px', borderRadius: '10px', background: content.trim() ? '#C4956A' : 'rgba(196,149,106,0.15)', color: content.trim() ? '#0c0c12' : 'rgba(196,149,106,0.30)', fontSize: '13px', fontWeight: 600, border: 'none', cursor: content.trim() ? 'pointer' : 'not-allowed', whiteSpace: 'nowrap', transition: 'all .15s' }}
            >
              {submitting ? '...' : 'Publicar'}
            </button>
          </div>
          {error && <p style={{ marginTop: '6px', fontSize: '12px', color: '#9E3D3D' }}>{error}</p>}
          <p style={{ marginTop: '4px', fontSize: '11px', color: 'rgba(96,88,80,1)', textAlign: 'right' }}>{content.length}/1000</p>
        </form>
      ) : (
        <div style={{ marginBottom: '28px', padding: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', textAlign: 'center', fontSize: '13px', color: 'rgba(160,152,144,0.6)' }}>
          <a href="/login" style={{ color: '#C4956A', textDecoration: 'none', fontWeight: 600 }}>Inicia sesión</a>
          {' '}para comentar
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div style={{ fontSize: '13px', color: 'rgba(160,152,144,0.4)', textAlign: 'center', padding: '24px' }}>
          Cargando comentarios...
        </div>
      ) : comments.length === 0 ? (
        <div style={{ fontSize: '13px', color: 'rgba(160,152,144,0.3)', textAlign: 'center', padding: '32px' }}>
          Sé el primero en comentar este capítulo
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {comments.map(comment => (
            <CommentItem
              key={comment.id}
              comment={comment}
              userId={userId}
              isAdmin={isAdmin}
              onReply={(id, name) => {
                setReplyTo({ id, name })
                document.querySelector('textarea')?.focus()
              }}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function CommentItem({
  comment, userId, isAdmin, onReply, onDelete,
}: {
  comment:  Comment
  userId:   string | null
  isAdmin:  boolean
  onReply:  (id: string, name: string) => void
  onDelete: (id: string) => void
}) {
  const [showReplies, setShowReplies] = useState(true)
  const name     = comment.profiles?.username ?? 'Usuario'
  const isOwner  = userId === comment.user_id
  const canDelete = isOwner || isAdmin

  return (
    <div>
      <div style={{ display: 'flex', gap: '10px' }}>
        {/* Avatar */}
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #C4956A, #3D5A9E)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '13px', fontWeight: 700, color: '#0c0c12' }}>
          {name[0].toUpperCase()}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#f0ece8' }}>{name}</span>
            {isAdmin && isOwner && (
              <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', background: 'rgba(196,149,106,0.12)', color: '#C4956A', border: '1px solid rgba(196,149,106,0.20)' }}>Admin</span>
            )}
            <span style={{ fontSize: '11px', color: 'rgba(96,88,80,1)' }}>{timeAgo(comment.created_at)}</span>
          </div>

          <p style={{ fontSize: '13px', color: 'rgba(200,192,184,1)', lineHeight: 1.6, margin: 0, wordBreak: 'break-word' }}>
            {comment.content}
          </p>

          <div style={{ display: 'flex', gap: '14px', marginTop: '8px', flexWrap: 'wrap' }}>
            {userId && (
              <button
                onClick={() => onReply(comment.id, name)}
                style={{ fontSize: '12px', color: 'rgba(160,152,144,0.5)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, transition: 'color .15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#C4956A')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(160,152,144,0.5)')}
              >
                Responder
              </button>
            )}
            {(comment.replies?.length ?? 0) > 0 && (
              <button
                onClick={() => setShowReplies(v => !v)}
                style={{ fontSize: '12px', color: 'rgba(160,152,144,0.5)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                {showReplies
                  ? `Ocultar ${comment.replies!.length} respuesta${comment.replies!.length !== 1 ? 's' : ''}`
                  : `Ver ${comment.replies!.length} respuesta${comment.replies!.length !== 1 ? 's' : ''}`}
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => onDelete(comment.id)}
                style={{ fontSize: '12px', color: 'rgba(158,61,61,0.5)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginLeft: 'auto', transition: 'color .15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#9E3D3D')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(158,61,61,0.5)')}
              >
                Eliminar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Respuestas */}
      {showReplies && (comment.replies?.length ?? 0) > 0 && (
        <div style={{ marginLeft: '42px', marginTop: '12px', paddingLeft: '14px', borderLeft: '2px solid rgba(196,149,106,0.12)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {comment.replies!.map((reply) => {
            const replyName   = reply.profiles?.username ?? 'Usuario'
            const replyOwner  = userId === reply.user_id
            const replyDelete = replyOwner || isAdmin
            return (
              <div key={reply.id} style={{ display: 'flex', gap: '8px' }}>
                <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'linear-gradient(135deg, #3D5A9E, #C4956A)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '11px', fontWeight: 700, color: '#0c0c12' }}>
                  {replyName[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#f0ece8' }}>{replyName}</span>
                    <span style={{ fontSize: '11px', color: 'rgba(96,88,80,1)' }}>{timeAgo(reply.created_at)}</span>
                  </div>
                  <p style={{ fontSize: '13px', color: 'rgba(200,192,184,1)', lineHeight: 1.6, margin: 0, wordBreak: 'break-word' }}>
                    {reply.content}
                  </p>
                  {replyDelete && (
                    <button
                      onClick={() => onDelete(reply.id)}
                      style={{ fontSize: '11px', color: 'rgba(158,61,61,0.4)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: '6px', transition: 'color .15s' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#9E3D3D')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'rgba(158,61,61,0.4)')}
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}