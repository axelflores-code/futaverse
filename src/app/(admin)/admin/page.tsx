import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function AdminDashboard() {
  const supabase = await createClient()

  const [
    { count: mangaCount },
    { count: chapterCount },
    { count: userCount },
  ] = await Promise.all([
    supabase.from('mangas').select('*',   { count: 'exact', head: true }),
    supabase.from('chapters').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
  ])

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-8">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-[#111] border border-white/5 rounded-xl p-6">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Mangas</p>
          <p className="text-4xl font-bold text-red-400">{mangaCount ?? 0}</p>
        </div>
        <div className="bg-[#111] border border-white/5 rounded-xl p-6">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Capítulos</p>
          <p className="text-4xl font-bold text-blue-400">{chapterCount ?? 0}</p>
        </div>
        <div className="bg-[#111] border border-white/5 rounded-xl p-6">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Usuarios</p>
          <p className="text-4xl font-bold text-emerald-400">{userCount ?? 0}</p>
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="grid grid-cols-2 gap-4">
        <Link
          href="/admin/mangas/new"
          className="bg-[#111] border border-white/5 rounded-xl p-6 hover:border-red-500/30 transition-colors group block"
        >
          <p className="text-2xl mb-3">📚</p>
          <p className="text-white font-semibold group-hover:text-red-400 transition-colors">
            Subir nuevo manga
          </p>
          <p className="text-xs text-zinc-600 mt-1">
            Agrega título, portada y géneros
          </p>
        </Link>

        <Link
          href="/admin/chapters"
          className="bg-[#111] border border-white/5 rounded-xl p-6 hover:border-red-500/30 transition-colors group block"
        >
          <p className="text-2xl mb-3">📄</p>
          <p className="text-white font-semibold group-hover:text-red-400 transition-colors">
            Subir capítulos
          </p>
          <p className="text-xs text-zinc-600 mt-1">
            Sube páginas e imágenes
          </p>
        </Link>

        <Link
          href="/admin/mangas"
          className="bg-[#111] border border-white/5 rounded-xl p-6 hover:border-red-500/30 transition-colors group block"
        >
          <p className="text-2xl mb-3">✏️</p>
          <p className="text-white font-semibold group-hover:text-red-400 transition-colors">
            Editar mangas
          </p>
          <p className="text-xs text-zinc-600 mt-1">
            Modifica títulos, tags y portadas
          </p>
        </Link>

        <Link
          href="/admin/tags"
          className="bg-[#111] border border-white/5 rounded-xl p-6 hover:border-red-500/30 transition-colors group block"
        >
          <p className="text-2xl mb-3">🏷️</p>
          <p className="text-white font-semibold group-hover:text-red-400 transition-colors">
            Gestionar tags
          </p>
          <p className="text-xs text-zinc-600 mt-1">
            Agrega o edita los tags disponibles
          </p>
        </Link>
      </div>
    </div>
  )
}