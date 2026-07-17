'use client'

// src/components/reader/MangaReader.tsx

import { useEffect, useCallback, useState, useRef } from 'react'
import { useReaderStore } from '@/stores/readerStore'
import { useReadingProgress } from '@/hooks/useReadingProgress'
import { ReaderTopbar } from './ReaderTopbar'
import { ReaderSettings, ReaderSettingsMobile } from './ReaderSettings'
import { ReaderPageList } from './ReaderPageList'
import { ReaderBottombar } from './ReaderBottombar'
import { KeyboardHandler } from './KeyboardHandler'
import type { Chapter, Manga } from '@/types/manga'

interface ChapterNav {
  id: string
  number: number
  mangaId: string
}

interface MangaReaderProps {
  chapter:     Chapter
  manga:       Pick<Manga, 'id' | 'slug' | 'title'>
  prevChapter: ChapterNav | null
  nextChapter: ChapterNav | null
}

export function MangaReader({
  chapter,
  manga,
  prevChapter,
  nextChapter,
}: MangaReaderProps) {
  const { setTotalPages, setPage, settings } = useReaderStore()
  const { saveProgress } = useReadingProgress(chapter.id)

  // Auto-hide UI
  const [uiVisible, setUiVisible] = useState(true)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const resetHideTimer = useCallback(() => {
    setUiVisible(true)
    if (hideTimer.current) clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => {
      setUiVisible(false)
    }, 3000)
  }, [])

  useEffect(() => {
    resetHideTimer()
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current)
    }
  }, [resetHideTimer])

  // Inicializar estado al montar
  useEffect(() => {
    setTotalPages(chapter.pages.length)
    setPage(0)
  }, [chapter.id, chapter.pages.length, setTotalPages, setPage])

  const handlePageVisible = useCallback(
    (pageIndex: number) => {
      setPage(pageIndex)
      if (pageIndex % 3 === 0) saveProgress(pageIndex)
    },
    [setPage, saveProgress]
  )

  return (
    <div
      className="min-h-screen flex flex-col relative"
      onMouseMove={resetHideTimer}
      onTouchStart={resetHideTimer}
      onClick={resetHideTimer}
      style={{
        background: settings.theme === 'dark' ? '#0a0a0a' : '#f0ede8',
        cursor: uiVisible ? 'default' : 'none',
      }}
    >
      <KeyboardHandler
        prevChapterSlug={prevChapter ? `/read/${manga.slug}/${prevChapter.number}` : null}
        nextChapterSlug={nextChapter ? `/read/${manga.slug}/${nextChapter.number}` : null}
      />

      {/* Topbar + Settings — se ocultan */}
      <div
        className="transition-opacity duration-500 sticky top-0 z-50"
        style={{
          opacity:       uiVisible ? 1 : 0,
          pointerEvents: uiVisible ? 'auto' : 'none',
        }}
      >
        <ReaderTopbar
          manga={manga}
          chapter={chapter}
          prevChapter={prevChapter}
          nextChapter={nextChapter}
        />
        <ReaderSettings />
      </div>

      {/* Páginas — siempre visibles */}
      <ReaderPageList
        pages={chapter.pages}
        onPageVisible={handlePageVisible}
        mangaTitle={manga.title}
        chapterNumber={chapter.number}
        chapterId={chapter.id}
        mangaSlug={manga.slug}
        prevChapter={prevChapter}
        nextChapter={nextChapter}
      />

      <script src="https://pl30401168.effectivecpmnetwork.com/71/2d/71/712d71cf118ac18e499ea6141d17258f.js"></script>

      {/* Bottombar — se oculta */}
      <div
        className="transition-opacity duration-500"
        style={{
          opacity:       uiVisible ? 1 : 0,
          pointerEvents: uiVisible ? 'auto' : 'none',
        }}
      >
        <ReaderBottombar totalPages={chapter.pages.length} />
      </div>

      {/* Settings móvil — se oculta */}
      <div
        className="transition-opacity duration-500"
        style={{
          opacity:       uiVisible ? 1 : 0,
          pointerEvents: uiVisible ? 'auto' : 'none',
        }}
      >
        <ReaderSettingsMobile />
      </div>
    </div>
  )
}