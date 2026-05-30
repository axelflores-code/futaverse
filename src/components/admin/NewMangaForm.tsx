'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function NewMangaForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    title:       '',
    slug:        '',
    description: '',
    status:      'ongoing',
    rating:      'mature',
    score:       '0',
    author:      '', 
  })

  function handleTitleChange(title: string) {
    const slug = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
    setForm(f => ({ ...f, title, slug }))
  }

  function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setCoverFile(file)
    setCoverPreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      let coverUrl: string | null = null

      // Subir portada si hay archivo
      if (coverFile) {
        const ext = coverFile.name.split('.').pop()
        const path = `${form.slug}/cover.${ext}`

        const { error: uploadError } = await supabase.storage
          .from('manga-covers')
          .upload(path, coverFile, { upsert: true })

        if (uploadError) throw new Error('Error subiendo la portada')

        const { data: urlData } = supabase.storage
          .from('manga-covers')
          .getPublicUrl(path)

        coverUrl = urlData.publicUrl
      }

      // Insertar manga
      const { error: insertError } = await supabase
        .from('mangas')
        .insert({
          title:       form.title,
          slug:        form.slug,
          description: form.description || null,
          cover_url:   coverUrl,
          status:      form.status,
          rating:      form.rating,
          score:       parseFloat(form.score),
          views:       0,
        })

      if (insertError) throw new Error(insertError.message)

      router.push('/admin/mangas')
      router.refresh()

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">

      {/* Portada */}
      <div>
        <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
          Portada
        </label>
        <div className="flex gap-4 items-start">
          <div className="w-32 aspect-[2/3] bg-[#111] border border-white/10 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0">
            {coverPreview ? (
              <img src={coverPreview} alt="preview" className="w-full h-full object-cover"/>
            ) : (
              <span className="text-zinc-700 text-xs text-center px-2">Sin portada</span>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <label className="cursor-pointer bg-[#111] border border-white/10 hover:border-white/20 text-zinc-400 hover:text-white text-sm px-4 py-2 rounded-lg transition-colors inline-block">
              Elegir imagen
              <input type="file" accept="image/*" onChange={handleCoverChange} className="hidden"/>
            </label>
            <p className="text-xs text-zinc-600">JPG, PNG o WEBP. Recomendado 400×600px</p>
          </div>
        </div>
      </div>

      {/* Título */}
      <div>
        <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
          Título *
        </label>
        <input
          type="text"
          required
          value={form.title}
          onChange={e => handleTitleChange(e.target.value)}
          placeholder="Nombre del manga"
          className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-zinc-700 focus:outline-none focus:border-red-500/50 transition-colors"
        />
      </div>

      {/* Slug */}
      <div>
        <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
          Slug (URL)
        </label>
        <input
          type="text"
          value={form.slug}
          onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
          placeholder="nombre-del-manga"
          className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-2.5 text-zinc-400 text-sm font-mono placeholder:text-zinc-700 focus:outline-none focus:border-red-500/50 transition-colors"
        />
        <p className="text-xs text-zinc-600 mt-1">
          URL: futaverse.com/manga/{form.slug || 'slug'}
        </p>
      </div>

      {/* Descripción */}
      <div>
        <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
          Descripción
        </label>
        <textarea
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          placeholder="Sinopsis del manga..."
          rows={4}
          className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-zinc-700 focus:outline-none focus:border-red-500/50 transition-colors resize-none"
        />
      </div>

      {/* Estado y Rating */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
            Estado
          </label>
          <select
            value={form.status}
            onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
            className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500/50"
          >
            <option value="ongoing">En curso</option>
            <option value="completed">Completo</option>
            <option value="hiatus">Pausado</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
            Rating
          </label>
          <select
            value={form.rating}
            onChange={e => setForm(f => ({ ...f, rating: e.target.value }))}
            className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500/50"
          >
            <option value="mature">+18 Mature</option>
            <option value="teen">Teen</option>
            <option value="everyone">Everyone</option>
          </select>
        </div>
      </div>

      {/* Autor */}
<div>
  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
    Autor
  </label>
  <input
    type="text"
    value={form.author}
    onChange={e => setForm(f => ({ ...f, author: e.target.value }))}
    placeholder="Nombre del autor"
    className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-zinc-700 focus:outline-none focus:border-red-500/50 transition-colors"
  />
</div>

      {/* Score */}
      <div>
        <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
          Score inicial (0-10)
        </label>
        <input
          type="number"
          min="0"
          max="10"
          step="0.1"
          value={form.score}
          onChange={e => setForm(f => ({ ...f, score: e.target.value }))}
          className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500/50 transition-colors"
        />
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !form.title || !form.slug}
        className="w-full py-3 bg-red-500 hover:bg-red-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors text-sm"
      >
        {loading ? 'Guardando...' : 'Crear manga'}
      </button>
    </form>
  )
}