'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useReaderStore } from '@/stores/readerStore';
import { cn } from '@/lib/utils';
import type { Chapter, Manga } from '@/types/manga';

interface ChapterNav { id: string; number: number; mangaId: string }

interface ReaderTopbarProps {
  manga: Pick<Manga, 'id' | 'slug' | 'title'>;
  chapter: Chapter;
  prevChapter: ChapterNav | null;
  nextChapter: ChapterNav | null;
}

export function ReaderTopbar({
  manga,
  chapter,
  prevChapter,
  nextChapter,
}: ReaderTopbarProps) {
  const router = useRouter();
  const { settings, updateSettings, showSettings, setShowSettings } =
    useReaderStore();

  const isDark = settings.theme === 'dark';

  const topbarStyle = isDark
    ? 'bg-[#111] border-[#1e1e1e] text-[#e0e0e0]'
    : 'bg-white border-zinc-200 text-zinc-800';

  return (
    <>
      {/* Barra de progreso */}
      <ProgressBar />

      <header
        className={cn(
          'h-12 flex items-center justify-between px-4 gap-4',
          'border-b sticky top-0 z-50',
          topbarStyle
        )}
      >
        {/* Info del manga */}
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={`/manga/${manga.slug}`}
            className={cn(
              'flex-shrink-0 p-1.5 rounded-lg transition-colors',
              isDark
                ? 'hover:bg-white/5 text-zinc-500 hover:text-zinc-300'
                : 'hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700'
            )}
            aria-label="Volver al manga"
          >
            <ChevronLeftIcon />
          </Link>
          <div className="min-w-0">
            <p className="font-semibold text-sm leading-tight truncate">{manga.title}</p>
            <p className={cn('text-xs truncate', isDark ? 'text-[#555]' : 'text-zinc-400')}>
              Cap. {chapter.number}
              {chapter.title ? ` — ${chapter.title}` : ''}
            </p>
          </div>
        </div>

        {/* Controles */}
        <nav className="flex items-center gap-1.5" aria-label="Controles del lector">
          {/* Capítulo anterior */}
          <TopbarButton
            onClick={() =>
              prevChapter &&
              router.push(`/read/${manga.slug}/${prevChapter.number}`)
            }
            disabled={!prevChapter}
            label="Capítulo anterior"
            isDark={isDark}
          >
            <ChevronLeftIcon />
          </TopbarButton>

          {/* Capítulo siguiente */}
          <TopbarButton
            onClick={() =>
              nextChapter &&
              router.push(`/read/${manga.slug}/${nextChapter.number}`)
            }
            disabled={!nextChapter}
            label="Capítulo siguiente"
            isDark={isDark}
          >
            <ChevronRightIcon />
          </TopbarButton>

          <Separator isDark={isDark} />

          {/* Ajustes */}
          <TopbarButton
            onClick={() => setShowSettings(!showSettings)}
            active={showSettings}
            label="Ajustes del lector"
            isDark={isDark}
          >
            <SettingsIcon />
          </TopbarButton>

          <Separator isDark={isDark} />

          {/* Modo claro/oscuro */}
          <TopbarButton
            onClick={() =>
              updateSettings({ theme: isDark ? 'light' : 'dark' })
            }
            label={isDark ? 'Modo claro' : 'Modo oscuro'}
            isDark={isDark}
          >
            {isDark ? <SunIcon /> : <MoonIcon />}
          </TopbarButton>

          {/* Pantalla completa */}
          <TopbarButton
            onClick={() => document.documentElement.requestFullscreen?.()}
            label="Pantalla completa"
            isDark={isDark}
          >
            <MaximizeIcon />
          </TopbarButton>
        </nav>
      </header>
    </>
  );
}

function ProgressBar() {
  const { currentPage, totalPages } = useReaderStore();
  const pct =
    totalPages > 1
      ? Math.round((currentPage / (totalPages - 1)) * 100)
      : 0;

  return (
    <div className="h-0.5 bg-[#1a1a1a] sticky top-0 z-50">
      <div
        className="h-full bg-red-500 transition-all duration-300 ease-out"
        style={{ width: `${pct}%` }}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Progreso de lectura: ${pct}%`}
      />
    </div>
  );
}

interface TopbarButtonProps {
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  label: string;
  isDark: boolean;
  children: React.ReactNode;
}

function TopbarButton({
  onClick,
  disabled = false,
  active = false,
  label,
  isDark,
  children,
}: TopbarButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        'w-8 h-8 flex items-center justify-center rounded-lg',
        'border transition-all duration-150',
        'disabled:opacity-30 disabled:cursor-not-allowed',
        isDark
          ? [
              'border-[#222] text-zinc-500',
              'hover:enabled:border-[#333] hover:enabled:text-zinc-300 hover:enabled:bg-[#161616]',
              active && 'border-red-500 text-red-500',
            ]
          : [
              'border-zinc-200 text-zinc-400',
              'hover:enabled:border-zinc-300 hover:enabled:text-zinc-700 hover:enabled:bg-zinc-50',
              active && 'border-red-500 text-red-500',
            ]
      )}
    >
      {children}
    </button>
  );
}

function Separator({ isDark }: { isDark: boolean }) {
  return (
    <div
      className={cn('w-px h-5 mx-0.5', isDark ? 'bg-[#1e1e1e]' : 'bg-zinc-200')}
    />
  );
}

// Inline SVG icons (16x16)
const iconProps = { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true };

function ChevronLeftIcon()  { return <svg {...iconProps}><polyline points="15 18 9 12 15 6"/></svg>; }
function ChevronRightIcon() { return <svg {...iconProps}><polyline points="9 18 15 12 9 6"/></svg>; }
function SettingsIcon()     { return <svg {...iconProps}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>; }
function SunIcon()          { return <svg {...iconProps}><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>; }
function MoonIcon()         { return <svg {...iconProps}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>; }
function MaximizeIcon()     { return <svg {...iconProps}><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>; }