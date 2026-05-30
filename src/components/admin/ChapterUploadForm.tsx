'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface MangaOption {
  id: string
  slug: string
  title: string
}

interface ChapterUploadFormProps {
  mangas: MangaOption[]
  defaultMangaSlug: string
}

export function ChapterUploadForm({ mangas, defaultMangaSlug }: ChapterUploadFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [pages, setPages] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [uploadProgress, setUploadProgress] = useState(0)

  const [form, setForm] = useState({
    mangaSlug:     defaultMangaSlug,
    chapterNumber: '',
    chapterTitle:  '',
  })

  function handlePagesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    // Ordenar por nombre de archivo
    files.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
    setPages(files)
    setPreviews(files.map(f => URL.createObjectURL(f)))
  }

  function removePage(index: number) {
    setPages(prev => prev.filter((_, i) => i !== index))
    setPreviews(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (pages.length === 0) { setError('Agrega al menos una página'); return }
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      // Obtener el manga seleccionado
      const selectedManga = mangas.find(m => m.slug === form.mangaSlug)
      if (!selectedManga) throw new Error('Selecciona un manga')

      // Subir páginas a Storage
      const pageUrls: string[] = []

      for (let i = 0; i < pages.length; i++) {
        const file = pages[i]
        const ext = file.name.split('.').pop()
        const pageNum = String(i + 1).padStart(3, '0')
        const path = `${form.mangaSlug}/cap-${form.chapterNumber}/${pageNum}.${ext}`

        const { error: uploadError } = await supabase.storage
          .from('manga-pages')
          .upload(path, file, { upsert: true })

        if (uploadError) throw new Error(`Error subiendo página ${i + 1}`)

        const { data: urlData } = supabase.storage
          .from('manga-pages')
          .getPublicUrl(path)

        pageUrls.push(urlData.publicUrl)
        setUploadProgress(Math.round(((i + 1) / pages.length) * 100))
      }

      // Insertar capítulo en la DB
      const { error: insertError } = await supabase
        .from('chapters')
        .insert({
          manga_id: selectedManga.id,
          number:   parseFloat(form.chapterNumber),
          title:    form.chapterTitle || null,
          pages:    pageUrls,
          views:    0,
        })

      if (insertError) throw new Error(insertError.message)

      setSuccess(true)
      setPages([])
      setPreviews([])
      setUploadProgress(0)
      setForm(f => ({ ...f, chapterNumber: '', chapterTitle: '' }))
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
          ✓ Capítulo subido correctamente
        </div>
      )}

      {/* Manga */}
      <div>
        <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
          Manga *
        </label>
        <select
          required
          value={form.mangaSlug}
          onChange={e => setForm(f => ({ ...f, mangaSlug: e.target.value }))}
          className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500/50"
        >
          <option value="">Selecciona un manga...</option>
          {mangas.map(m => (
            <option key={m.id} value={m.slug}>{m.title}</option>
          ))}
        </select>
      </div>

      {/* Número y título */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
            Número *
          </label>
          <input
            type="number"
            required
            min="0"
            step="0.1"
            value={form.chapterNumber}
            onChange={e => setForm(f => ({ ...f, chapterNumber: e.target.value }))}
            placeholder="1"
            className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500/50 transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
            Título (opcional)
          </label>
          <input
            type="text"
            value={form.chapterTitle}
            onChange={e => setForm(f => ({ ...f, chapterTitle: e.target.value }))}
            placeholder="El comienzo..."
            className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-zinc-700 focus:outline-none focus:border-red-500/50 transition-colors"
          />
        </div>
      </div>

      {/* Páginas */}
      <div>
        <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
          Páginas * ({pages.length} seleccionadas)
        </label>
        <label className="cursor-pointer flex flex-col items-center justify-center w-full h-32 bg-[#111] border-2 border-dashed border-white/10 hover:border-red-500/30 rounded-xl transition-colors">
          <span className="text-zinc-500 text-sm mb-1">Haz clic para seleccionar las páginas</span>
          <span className="text-zinc-700 text-xs">Selecciona todas las imágenes a la vez — se ordenan por nombre</span>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handlePagesChange}
            className="hidden"
          />
        </label>
      </div>

      {/* Previews */}
      {previews.length > 0 && (
        <div>
          <p className="text-xs text-zinc-500 mb-3">{previews.length} páginas — haz clic en × para quitar</p>
          <div className="grid grid-cols-6 gap-2 max-h-64 overflow-y-auto">
            {previews.map((src, i) => (
              <div key={i} className="relative group aspect-[2/3]">
                <img
                  src={src}
                  alt={`Página ${i + 1}`}
                  className="w-full h-full object-cover rounded-lg"
                />
                <span className="absolute bottom-1 left-1 text-[10px] bg-black/70 text-white px-1 rounded">
                  {i + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removePage(i)}
                  className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs hidden group-hover:flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progress */}
      {loading && uploadProgress > 0 && (
        <div>
          <div className="flex justify-between text-xs text-zinc-500 mb-1">
            <span>Subiendo páginas...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-500 transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !form.mangaSlug || !form.chapterNumber || pages.length === 0}
        className="w-full py-3 bg-red-500 hover:bg-red-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors text-sm"
      >
        {loading ? `Subiendo... ${uploadProgress}%` : `Subir ${pages.length} páginas`}
      </button>
    </form>
  )
}