import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { EditMangaForm } from '@/components/admin/EditMangaForm'

export default async function EditMangaPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: manga } = await supabase
    .from('mangas')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!manga) notFound()

  const { data: allTags } = await supabase
    .from('tags')
    .select('*')
    .order('namespace')

  const { data: mangaTags } = await supabase
    .from('manga_tags')
    .select('tag_id')
    .eq('manga_id', manga.id)

  const { data: allGenres } = await supabase
    .from('genres')
    .select('*')
    .order('name')

  const { data: mangaGenres } = await supabase
    .from('manga_genres')
    .select('genre_id')
    .eq('manga_id', manga.id)

  const { data: allCategories } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order')

  const { data: mangaCategories } = await supabase
    .from('manga_categories')
    .select('category_id')
    .eq('manga_id', manga.id)

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-white mb-8">
        Editar — {manga.title}
      </h1>
      <EditMangaForm
        manga={manga}
        allTags={allTags ?? []}
        activeTags={(mangaTags ?? []).map((t: { tag_id: string }) => t.tag_id)}
        allGenres={allGenres ?? []}
        activeGenres={(mangaGenres ?? []).map((g: { genre_id: string }) => g.genre_id)}
        allCategories={allCategories ?? []}
        activeCategories={(mangaCategories ?? []).map((c: { category_id: string }) => c.category_id)}
      />
    </div>
  )
}