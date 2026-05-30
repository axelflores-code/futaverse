import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function AdminMangasPage() {
  const supabase = await createClient()

  const { data: mangas } = await supabase
    .from('mangas')
    .select('id, slug, title, status, score, views, created_at')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-white">Mangas</h1>
        <Link
          href="/admin/mangas/new"
          className="bg-red-500 hover:bg-red-400 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          + Nuevo manga
        </Link>
      </div>

      <div className="bg-[#111] border border-white/5 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left px-4 py-3 text-zinc-500 font-medium">Título</th>
              <th className="text-left px-4 py-3 text-zinc-500 font-medium">Estado</th>
              <th className="text-left px-4 py-3 text-zinc-500 font-medium">Score</th>
              <th className="text-left px-4 py-3 text-zinc-500 font-medium">Vistas</th>
              <th className="text-left px-4 py-3 text-zinc-500 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {(mangas ?? []).map((manga) => (
              <tr
                key={manga.id}
                className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors"
              >
                <td className="px-4 py-3 text-white font-medium">{manga.title}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    manga.status === 'ongoing'
                      ? 'bg-green-500/10 text-green-400'
                      : manga.status === 'completed'
                      ? 'bg-blue-500/10 text-blue-400'
                      : 'bg-yellow-500/10 text-yellow-400'
                  }`}>
                    {manga.status === 'ongoing'
                      ? 'En curso'
                      : manga.status === 'completed'
                      ? 'Completo'
                      : 'Pausado'}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-400">{manga.score}</td>
                <td className="px-4 py-3 text-zinc-400">{manga.views}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/admin/mangas/${manga.slug}`}
                      className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      ✏ Editar
                    </Link>
                    <Link
                      href={`/admin/chapters?manga=${manga.slug}`}
                      className="text-xs text-red-400 hover:text-red-300 transition-colors"
                    >
                      + Capítulo
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
            {(mangas ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-zinc-600">
                  No hay mangas.{' '}
                  <Link href="/admin/mangas/new" className="text-red-400 hover:text-red-300">
                    Crea el primero
                  </Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}