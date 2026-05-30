import { getMangas } from '@/lib/queries/manga'
import { getAllCategories } from '@/lib/queries/categories'
import { getAllTags } from '@/lib/queries/tag'
import { MangaCatalog } from '@/components/manga/MangaCatalog'

export const metadata = {
  title: 'Catálogo de Manga',
}

export default async function CatalogPage() {
  const [{ data: mangas }, categories, tags] = await Promise.all([
    getMangas({ pageSize: 48 }),
    getAllCategories(),
    getAllTags(),
  ])

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-6">Catálogo</h1>
      <MangaCatalog
        initialMangas={mangas}
        categories={categories}
        tags={tags}
      />
    </div>
  )
}