import { ChapterUploadForm } from '@/components/admin/ChapterUploadForm'
import { createClient } from '@/lib/supabase/server'

export default async function AdminChaptersPage({
  searchParams,
}: {
  searchParams: Promise<{ manga?: string }>
}) {
  const { manga: mangaSlug } = await searchParams
  const supabase = await createClient()

  const { data: mangas } = await supabase
    .from('mangas')
    .select('id, slug, title')
    .order('title')

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-white mb-8">Subir capítulo</h1>
      <ChapterUploadForm
        mangas={mangas ?? []}
        defaultMangaSlug={mangaSlug ?? ''}
      />
    </div>
  )
}