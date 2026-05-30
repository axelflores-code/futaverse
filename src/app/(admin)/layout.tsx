import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user!.id)
    .single()

  console.log('Admin profile:', profile)

  if (!profile || profile.role !== 'admin') {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-[#0b0c10] flex">

      <aside className="w-56 bg-[#111] border-r border-white/5 flex flex-col p-4 gap-1 fixed h-full">
        <div className="flex items-center gap-2 px-2 py-3 mb-4">
          <div className="w-6 h-6 rounded-md bg-red-500 flex items-center justify-center">
            <svg className="w-3 h-3 fill-white" viewBox="0 0 18 18">
              <path d="M9 1L3 5v8l6 4 6-4V5L9 1zm0 2.4L13 6v6l-4 2.6L5 12V6l4-2.6z"/>
            </svg>
          </div>
          <span className="text-sm font-bold text-white">Admin Panel</span>
        </div>

        <a href="/admin" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-white/5 transition-colors">
          Dashboard
        </a>
        <a href="/admin/mangas" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-white/5 transition-colors">
          Mangas
        </a>
        <a href="/admin/chapters" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-white/5 transition-colors">
          Capítulos
        </a>

        <div className="mt-auto">
          <a href="/" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-600 hover:text-zinc-400 transition-colors">
            ← Ver sitio
          </a>
        </div>
      </aside>

      <main className="flex-1 ml-56 p-8">
        {children}
      </main>

    </div>
  )
}