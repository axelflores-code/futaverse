'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface Tag      { id: string; name: string; namespace: string }
interface Genre    { id: string; name: string; slug: string }
interface Category { id: string; name: string; slug: string; color_hex: string | null }

interface EditMangaFormProps {
  manga:            Record<string, unknown>
  allTags:          Tag[]
  activeTags:       string[]
  allGenres:        Genre[]
  activeGenres:     string[]
  allCategories:    Category[]
  activeCategories: string[]
}

const NS_LABELS: Record<string, string> = {
  theme:           'Tema',
  trope:           'Tropo',
  setting:         'Ambientación',
  format:          'Formato',
  content_warning: 'Advertencia',
}

export function EditMangaForm({
  manga,
  allTags,
  activeTags,
  allGenres,
  activeGenres,
  allCategories,
  activeCategories,
}: EditMangaFormProps) {
  const router = useRouter()
  const [loading, setLoading]   = useState(false)
  const [success, setSuccess]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [coverFile, setCoverFile]     = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)

  const [form, setForm] = useState({
    title:       manga.title       as string,
    slug:        manga.slug        as string,
    description: manga.description as string ?? '',
    status:      manga.status      as string,
    rating:      manga.rating      as string,
    score:       String(manga.score),
    autor:      manga.autor      as string ?? '',
  })

  const [selectedTags,       setSelectedTags]       = useState<string[]>(activeTags)
  const [selectedGenres,     setSelectedGenres]     = useState<string[]>(activeGenres)
  const [selectedCategories, setSelectedCategories] = useState<string[]>(activeCategories)

  function toggleItem(id: string, list: string[], setList: (v: string[]) => void) {
    setList(list.includes(id) ? list.filter(i => i !== id) : [...list, id])
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
      const mangaId  = manga.id as string
      let coverUrl   = manga.cover_url as string | null

      // Subir nueva portada si hay
      if (coverFile) {
  const ext  = coverFile.name.split('.').pop()
  const path = `${form.slug}/cover.${ext}`

  console.log('Subiendo portada:', path, 'tamaño:', coverFile.size)

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('manga-covers')
    .upload(path, coverFile, { upsert: true })

  console.log('Upload result:', uploadData, 'error:', uploadError?.message, uploadError?.cause)

  if (uploadError) throw new Error(`Error portada: ${uploadError.message}`)

  const { data: urlData } = supabase.storage
    .from('manga-covers')
    .getPublicUrl(path)

  coverUrl = urlData.publicUrl
}

      // Actualizar datos del manga
      const { error: updateError } = await supabase
        .from('mangas')
        .update({
          title:       form.title,
          slug:        form.slug,
          description: form.description || null,
          cover_url:   coverUrl,
          status:      form.status,
          rating:      form.rating,
          score:       parseFloat(form.score),
           autor:      form.autor || null,
        })
        .eq('id', mangaId)

      if (updateError) throw new Error(updateError.message)

      // Actualizar tags
      await supabase.from('manga_tags').delete().eq('manga_id', mangaId)
      if (selectedTags.length > 0) {
        await supabase.from('manga_tags').insert(
          selectedTags.map(tag_id => ({ manga_id: mangaId, tag_id }))
        )
      }

      // Actualizar géneros
      await supabase.from('manga_genres').delete().eq('manga_id', mangaId)
      if (selectedGenres.length > 0) {
        await supabase.from('manga_genres').insert(
          selectedGenres.map(genre_id => ({ manga_id: mangaId, genre_id }))
        )
      }


      // Actualizar categorías
      await supabase.from('manga_categories').delete().eq('manga_id', mangaId)
      if (selectedCategories.length > 0) {
        await supabase.from('manga_categories').insert(
          selectedCategories.map(category_id => ({ manga_id: mangaId, category_id }))
        )
      }

      setSuccess(true)
      router.refresh()

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-3 text-sm text-emerald-400">
          ✓ Manga actualizado correctamente
        </div>
      )}

      {/* Portada */}
      <div>
        <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
          Portada
        </label>
        <div className="flex gap-4 items-start">
          <div className="w-28 aspect-2/3 bg-[#1a1a1a] rounded-lg overflow-hidden shrink-0">
            {coverPreview || manga.cover_url ? (
              <img
                src={coverPreview ?? manga.cover_url as string}
                alt="portada"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-700 text-xs">
                Sin portada
              </div>
            )}
          </div>
          <label className="cursor-pointer bg-[#111] border border-white/10 hover:border-white/20 text-zinc-400 hover:text-white text-sm px-4 py-2 rounded-lg transition-colors inline-block mt-2">
            Cambiar portada
            <input type="file" accept="image/*" onChange={handleCoverChange} className="hidden"/>
          </label>
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
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500/50 transition-colors"
        />
      </div>

      {/* Autor */}
<div>
  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
    Autor
  </label>
  <input
    type="text"
    value={form.autor}
    onChange={e => setForm(f => ({ ...f, autor: e.target.value }))}
    placeholder="Nombre del autor"
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
          className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-2.5 text-zinc-400 text-sm font-mono focus:outline-none focus:border-red-500/50 transition-colors"
        />
      </div>

      {/* Descripción */}
      <div>
        <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
          Descripción
        </label>
        <textarea
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          rows={4}
          className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500/50 transition-colors resize-none"
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

      {/* Score */}
      <div>
        <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
          Score (0-10)
        </label>
        <input
          type="number"
          min="0" max="10" step="0.1"
          value={form.score}
          onChange={e => setForm(f => ({ ...f, score: e.target.value }))}
          className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500/50 transition-colors"
        />
      </div>

      {/* Géneros */}
      {allGenres.length > 0 && (
        <div>
          <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
            Géneros
          </label>
          <div className="flex flex-wrap gap-2">
            {allGenres.map(genre => (
              <button
                key={genre.id}
                type="button"
                onClick={() => toggleItem(genre.id, selectedGenres, setSelectedGenres)}
                className={cn(
                  'px-3 py-1 rounded-full text-xs border transition-all',
                  selectedGenres.includes(genre.id)
                    ? 'border-red-500 text-red-400 bg-red-500/10'
                    : 'border-white/10 text-zinc-500 hover:text-white hover:border-white/20'
                )}
              >
                {genre.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Categorías */}
      {allCategories.length > 0 && (
        <div>
          <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
            Categorías
          </label>
          <div className="flex flex-wrap gap-2">
            {allCategories.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => toggleItem(cat.id, selectedCategories, setSelectedCategories)}
                className={cn(
                  'px-3 py-1 rounded-full text-xs border transition-all',
                  selectedCategories.includes(cat.id)
                    ? 'border-transparent text-white'
                    : 'border-white/10 text-zinc-500 hover:text-white hover:border-white/20'
                )}
                style={selectedCategories.includes(cat.id) && cat.color_hex
                  ? { background: cat.color_hex + '33', borderColor: cat.color_hex, color: cat.color_hex }
                  : {}
                }
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tags por namespace */}
      {Object.entries(NS_LABELS).map(([ns, label]) => {
        const nsTags = allTags.filter(t => t.namespace === ns)
        if (nsTags.length === 0) return null
        return (
          <div key={ns}>
            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
              {label}
            </label>
            <div className="flex flex-wrap gap-2">
              {nsTags.map(tag => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleItem(tag.id, selectedTags, setSelectedTags)}
                  className={cn(
                    'px-3 py-1 rounded-full text-xs border transition-all',
                    selectedTags.includes(tag.id)
                      ? 'border-red-500 text-red-400 bg-red-500/10'
                      : 'border-white/10 text-zinc-500 hover:text-white hover:border-white/20'
                  )}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>
        )
      })}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-3 border border-white/10 text-zinc-400 hover:text-white rounded-lg text-sm transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-3 bg-red-500 hover:bg-red-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors text-sm"
        >
          {loading ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  )
}