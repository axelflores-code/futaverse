'use client';

import { useCallback } from 'react';
import { useReaderStore } from '@/stores/readerStore';
import { ReaderPage } from './ReaderPage';
import { ChapterEndCard } from './ChapterEndCard';

interface ChapterNav { id: string; number: number; mangaId: string }

interface ReaderPageListProps {
  pages: string[];
  onPageVisible: (index: number) => void;
  mangaTitle: string;
  chapterNumber: number;
  mangaSlug: string;
  prevChapter: ChapterNav | null;
  nextChapter: ChapterNav | null;
}

export function ReaderPageList({
  pages,
  onPageVisible,
  mangaTitle,
  chapterNumber,
  mangaSlug,
  prevChapter,
  nextChapter,
}: ReaderPageListProps) {
  const { settings } = useReaderStore();

  const handlePageVisible = useCallback(
    (index: number) => onPageVisible(index),
    [onPageVisible]
  );

  return (
    <main
      className="flex flex-col items-center mx-auto w-full"
      style={{ gap: settings.gap, maxWidth: settings.maxWidth }}
      aria-label="Páginas del capítulo"
    >
      {pages.map((src, i) => (
        <ReaderPage
          key={`${chapterNumber}-${i}`}
          src={src}
          index={i}
          mangaTitle={mangaTitle}
          chapterNumber={chapterNumber}
          onVisible={handlePageVisible}
        />
      ))}

      <ChapterEndCard
        chapterNumber={chapterNumber}
        mangaSlug={mangaSlug}
        prevChapter={prevChapter}
        nextChapter={nextChapter}
      />
    </main>
  );
}