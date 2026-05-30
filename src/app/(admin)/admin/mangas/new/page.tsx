import { NewMangaForm } from '@/components/admin/NewMangaForm'

export default function NewMangaPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-white mb-8">Nuevo manga</h1>
      <NewMangaForm />
    </div>
  )
}