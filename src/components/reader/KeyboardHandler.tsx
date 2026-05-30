'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface KeyboardHandlerProps {
  prevChapterSlug: string | null;
  nextChapterSlug: string | null;
}

export function KeyboardHandler({
  prevChapterSlug,
  nextChapterSlug,
}: KeyboardHandlerProps) {
  const router = useRouter();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ignorar si el foco está en un input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) return;

      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (prevChapterSlug) router.push(prevChapterSlug);
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (nextChapterSlug) router.push(nextChapterSlug);
          break;
        case 'f':
        case 'F':
          // Toggle fullscreen
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen?.();
          } else {
            document.exitFullscreen?.();
          }
          break;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [prevChapterSlug, nextChapterSlug, router]);

  return null; // Componente invisible — solo maneja eventos
}