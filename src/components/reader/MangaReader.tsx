
'use client';

import { useEffect, useCallback } from 'react';
import { useReaderStore } from '@/stores/readerStore';
import { useReadingProgress } from '@/hooks/useReadingProgress';
import { ReaderTopbar } from './ReaderTopbar';
import { ReaderSettings } from './ReaderSettings';
import { ReaderPageList } from './ReaderPageList';
import { ReaderBottombar } from './ReaderBottombar';
import { KeyboardHandler } from './KeyboardHandler';
import type { Chapter, Manga } from '@/types/manga';

interface ChapterNav {
  id: string;
  number: number;
  mangaId: string;
}

interface MangaReaderProps {
  chapter: Chapter;
  manga: Pick<Manga, 'id' | 'slug' | 'title'>;
  prevChapter: ChapterNav | null;
  nextChapter: ChapterNav | null;
}

export function MangaReader({
  chapter,
  manga,
  prevChapter,
  nextChapter,
}: MangaReaderProps) {
  const { setTotalPages, setPage, settings } = useReaderStore();
  const { saveProgress } = useReadingProgress(chapter.id);

  // Inicializar estado al montar
  useEffect(() => {
    setTotalPages(chapter.pages.length);
    setPage(0);
  }, [chapter.id, chapter.pages.length, setTotalPages, setPage]);

  const handlePageVisible = useCallback(
    (pageIndex: number) => {
      setPage(pageIndex);
      // Guardar progreso en Supabase cada 3 páginas
      if (pageIndex % 3 === 0) saveProgress(pageIndex);
    },
    [setPage, saveProgress]
  );

  return (
    <div
      className="min-h-screen flex flex-col"
      data-theme={settings.theme}
      style={{
        background: settings.theme === 'dark' ? '#0a0a0a' : '#f0ede8',
      }}
    >
      <KeyboardHandler
        prevChapterSlug={
          prevChapter
            ? `/read/${manga.slug}/${prevChapter.number}`
            : null
        }
        nextChapterSlug={
          nextChapter
            ? `/read/${manga.slug}/${nextChapter.number}`
            : null
        }
      />

      <ReaderTopbar
        manga={manga}
        chapter={chapter}
        prevChapter={prevChapter}
        nextChapter={nextChapter}
      />

      <ReaderSettings />

      <ReaderPageList
        pages={chapter.pages}
        onPageVisible={handlePageVisible}
        mangaTitle={manga.title}
        chapterNumber={chapter.number}
        prevChapter={prevChapter}
        nextChapter={nextChapter}
        mangaSlug={manga.slug}
      />

      <ReaderBottombar totalPages={chapter.pages.length} />
    </div>
  );
}