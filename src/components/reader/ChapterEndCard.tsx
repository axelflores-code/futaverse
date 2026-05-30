'use client';

import Link from 'next/link';
import { useReaderStore } from '@/stores/readerStore';
import { cn } from '@/lib/utils';

interface ChapterNav { id: string; number: number; mangaId: string }

interface ChapterEndCardProps {
  chapterNumber: number;
  mangaSlug: string;
  prevChapter: ChapterNav | null;
  nextChapter: ChapterNav | null;
}

export function ChapterEndCard({
  chapterNumber,
  mangaSlug,
  prevChapter,
  nextChapter,
}: ChapterEndCardProps) {
  const { settings } = useReaderStore();
  const isDark = settings.theme === 'dark';

  const cardStyle = isDark
    ? 'border-[#1e1e1e] bg-[#0f0f0f] text-zinc-400'
    : 'border-zinc-200 bg-white text-zinc-500';

  return (
    <div
      className={cn(
        'w-full border-t flex flex-col items-center gap-5 py-12 px-6 text-center',
        cardStyle
      )}
    >
      <div>
        <p className="text-sm font-semibold mb-1" style={{ color: isDark ? '#e0e0e0' : '#1a1a1a' }}>
          Fin del capítulo {chapterNumber}
        </p>
        <p className="text-xs">¿Qué te pareció este capítulo?</p>
      </div>

      {/* Rating rápido */}
      <div className="flex gap-2" aria-label="Calificar capítulo">
        {(['😴', '😐', '😊', '🔥', '💯'] as const).map((emoji, i) => (
          <button
            key={i}
            className={cn(
              'w-9 h-9 rounded-lg border text-base transition-all duration-150',
              isDark
                ? 'border-[#222] hover:border-[#333] hover:bg-[#161616]'
                : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'
            )}
            aria-label={`Calificar ${i + 1} de 5`}
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Navegación entre capítulos */}
      <div className="flex gap-3 flex-wrap justify-center">
        {prevChapter && (
          <Link
            href={`/read/${mangaSlug}/${prevChapter.number}`}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-lg border text-sm font-medium transition-all',
              isDark
                ? 'border-[#222] text-zinc-500 hover:border-[#333] hover:text-zinc-300 hover:bg-[#161616]'
                : 'border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 hover:bg-zinc-50'
            )}
          >
            <ArrowLeftIcon />
            Cap. {prevChapter.number}
          </Link>
        )}

        {nextChapter && (
          <Link
            href={`/read/${mangaSlug}/${nextChapter.number}`}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-400 text-white text-sm font-semibold transition-colors"
          >
            Cap. {nextChapter.number}
            <ArrowRightIcon />
          </Link>
        )}
      </div>
    </div>
  );
}

const svgProps = { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, 'aria-hidden': true };
function ArrowLeftIcon()  { return <svg {...svgProps}><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>; }
function ArrowRightIcon() { return <svg {...svgProps}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>; }