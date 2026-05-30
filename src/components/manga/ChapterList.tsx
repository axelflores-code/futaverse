import Link from 'next/link'
import type { Chapter } from '@/types/manga'
import { formatDate } from '@/lib/utils'

interface ChapterListProps {
  chapters: Chapter[]
  mangaSlug: string
}

export function ChapterList({ chapters, mangaSlug }: ChapterListProps) {
  if (chapters.length === 0) {
    return <p className="text-zinc-500 text-sm">No hay capítulos disponibles.</p>
  }

  return (
    <div className="flex flex-col gap-1">
      {chapters.map((chapter) => (
        <Link
          key={chapter.id}
          href={`/read/${mangaSlug}/${chapter.number}`}
          className="flex items-center justify-between px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
        >
          <span className="text-sm text-white">
            Cap. {chapter.number}
            {chapter.title ? ` — ${chapter.title}` : ''}
          </span>
          <span className="text-xs text-zinc-500">
            {formatDate(chapter.createdAt)}
          </span>
        </Link>
      ))}
    </div>
  )
}