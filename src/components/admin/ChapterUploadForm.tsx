'use client'

import { useEffect, useRef, useState } from 'react'
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

const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
])

const MAX_PAGE_SIZE = 15 * 1024 * 1024

function getSafeExtension(file: File): string {
  const extensionByType: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/avif': 'avif',
  }

  return extensionByType[file.type] ?? 'webp'
}

export function ChapterUploadForm({
  mangas,
  defaultMangaSlug,
}: ChapterUploadFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [pages, setPages] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const previewsRef = useRef<string[]>([])
  const [uploadProgress, setUploadProgress] = useState(0)
  const [form, setForm] = useState({
    mangaSlug: defaultMangaSlug,
    chapterNumber: '',
    chapterTitle: '',
  })

  useEffect(() => () => {
    previewsRef.current.forEach((preview) => URL.revokeObjectURL(preview))
  }, [])

  function handlePagesChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
      .sort((first, second) =>
        first.name.localeCompare(second.name, undefined, { numeric: true })
      )

    const invalidType = files.find((file) => !ALLOWED_IMAGE_TYPES.has(file.type))
    if (invalidType) {
      setError(`${invalidType.name} no es JPG, PNG, WEBP ni AVIF.`)
      event.target.value = ''
      return
    }

    const oversizedFile = files.find((file) => file.size > MAX_PAGE_SIZE)
    if (oversizedFile) {
      setError(`${oversizedFile.name} supera el máximo de 15 MB.`)
      event.target.value = ''
      return
    }

    previewsRef.current.forEach((preview) => URL.revokeObjectURL(preview))
    const nextPreviews = files.map((file) => URL.createObjectURL(file))
    previewsRef.current = nextPreviews
    setError(null)
    setSuccess(false)
    setPages(files)
    setPreviews(nextPreviews)
  }

  function removePage(index: number) {
    URL.revokeObjectURL(previews[index])
    setPages((current) => current.filter((_, itemIndex) => itemIndex !== index))
    setPreviews((current) => {
      const nextPreviews = current.filter((_, itemIndex) => itemIndex !== index)
      previewsRef.current = nextPreviews
      return nextPreviews
    })
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    if (pages.length === 0) {
      setError('Agrega al menos una página.')
      return
    }

    const chapterNumber = Number.parseFloat(form.chapterNumber)
    if (!Number.isFinite(chapterNumber) || chapterNumber < 0) {
      setError('El número del capítulo no es válido.')
      return
    }

    setLoading(true)
    setSuccess(false)
    setError(null)
    setUploadProgress(0)

    const uploadedPaths: string[] = []

    try {
      const supabase = createClient()
      const selectedManga = mangas.find((manga) => manga.slug === form.mangaSlug)

      if (!selectedManga) {
        throw new Error('Selecciona un manga.')
      }

      /* Evita sobrescribir un capítulo que ya existe. */
      const { data: existingChapter, error: existingError } = await supabase
        .from('chapters')
        .select('id')
        .eq('manga_id', selectedManga.id)
        .eq('number', chapterNumber)
        .maybeSingle()

      if (existingError) {
        throw new Error(`No se pudo comprobar el capítulo: ${existingError.message}`)
      }

      if (existingChapter) {
        throw new Error(`El capítulo ${chapterNumber} ya existe en este manga.`)
      }

      const pageUrls: string[] = []
      const chapterPath = String(chapterNumber).replace('.', '-')

      for (let index = 0; index < pages.length; index += 1) {
        const file = pages[index]
        const pageNumber = String(index + 1).padStart(3, '0')
        const extension = getSafeExtension(file)
        const path = `${selectedManga.slug}/cap-${chapterPath}/${pageNumber}.${extension}`

        const { error: uploadError } = await supabase.storage
          .from('manga-pages')
          .upload(path, file, {
            upsert: false,
            contentType: file.type,
            cacheControl: '31536000',
          })

        if (uploadError) {
          throw new Error(`Error subiendo la página ${index + 1}: ${uploadError.message}`)
        }

        uploadedPaths.push(path)

        const { data: urlData } = supabase.storage
          .from('manga-pages')
          .getPublicUrl(path)

        pageUrls.push(urlData.publicUrl)
        setUploadProgress(Math.round(((index + 1) / pages.length) * 100))
      }

      const { error: insertError } = await supabase
        .from('chapters')
        .insert({
          manga_id: selectedManga.id,
          number: chapterNumber,
          title: form.chapterTitle.trim() || null,
          pages: pageUrls,
          views: 0,
        })

      if (insertError) {
        throw new Error(`No se pudo guardar el capítulo: ${insertError.message}`)
      }

      const cacheResponse = await fetch('/api/admin/revalidate-manga', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slug: selectedManga.slug,
        }),
      })

      if (!cacheResponse.ok) {
        console.error('El capítulo se creó, pero no se pudo invalidar el caché.')
      }

      previews.forEach((preview) => URL.revokeObjectURL(preview))
      previewsRef.current = []
      setSuccess(true)
      setPages([])
      setPreviews([])
      setUploadProgress(0)
      setForm((current) => ({
        ...current,
        chapterNumber: '',
        chapterTitle: '',
      }))
      router.refresh()
    } catch (caughtError) {
      /*
       * Si una página o la inserción falla, eliminamos únicamente
       * los archivos nuevos subidos en este intento.
       */
      if (uploadedPaths.length > 0) {
        const supabase = createClient()
        const { error: cleanupError } = await supabase.storage
          .from('manga-pages')
          .remove(uploadedPaths)

        if (cleanupError) {
          console.error('No se pudieron limpiar las páginas incompletas:', cleanupError.message)
        }
      }

      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Error desconocido.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {success && (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
          ✓ Capítulo subido correctamente
        </div>
      )}

      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Manga *
        </label>
        <select
          required
          value={form.mangaSlug}
          onChange={(event) => setForm((current) => ({ ...current, mangaSlug: event.target.value }))}
          className="w-full rounded-lg border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white focus:border-red-500/50 focus:outline-none"
        >
          <option value="">Selecciona un manga...</option>
          {mangas.map((manga) => (
            <option key={manga.id} value={manga.slug}>
              {manga.title}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Número *
          </label>
          <input
            type="number"
            required
            min="0"
            step="0.1"
            value={form.chapterNumber}
            onChange={(event) => setForm((current) => ({ ...current, chapterNumber: event.target.value }))}
            placeholder="1"
            className="w-full rounded-lg border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white transition-colors focus:border-red-500/50 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Título (opcional)
          </label>
          <input
            type="text"
            value={form.chapterTitle}
            onChange={(event) => setForm((current) => ({ ...current, chapterTitle: event.target.value }))}
            placeholder="El comienzo..."
            className="w-full rounded-lg border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white transition-colors placeholder:text-zinc-700 focus:border-red-500/50 focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Páginas * ({pages.length} seleccionadas)
        </label>
        <label className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/10 bg-[#111] transition-colors hover:border-red-500/30">
          <span className="mb-1 text-sm text-zinc-500">Haz clic para seleccionar las páginas</span>
          <span className="text-xs text-zinc-700">Se ordenan por nombre · Máximo 15 MB por imagen</span>
          <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple onChange={handlePagesChange} className="hidden" />
        </label>
      </div>

      {previews.length > 0 && (
        <div>
          <p className="mb-3 text-xs text-zinc-500">{previews.length} páginas — haz clic en × para quitar</p>
          <div className="grid max-h-64 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-6">
            {previews.map((source, index) => (
              <div key={source} className="group relative aspect-[2/3]">
                <img src={source} alt={`Página ${index + 1}`} className="h-full w-full rounded-lg object-cover" />
                <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1 text-[10px] text-white">{index + 1}</span>
                <button type="button" onClick={() => removePage(index)} aria-label={`Quitar página ${index + 1}`} className="absolute right-1 top-1 hidden h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs text-white group-hover:flex">×</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading && uploadProgress > 0 && (
        <div>
          <div className="mb-1 flex justify-between text-xs text-zinc-500">
            <span>Subiendo páginas...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
            <div className="h-full bg-red-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <button type="submit" disabled={loading || !form.mangaSlug || !form.chapterNumber || pages.length === 0} className="w-full rounded-lg bg-red-500 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-50">
        {loading ? `Subiendo... ${uploadProgress}%` : `Subir ${pages.length} páginas`}
      </button>
    </form>
  )
}