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
import Script from 'next/script'

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

// ── Frequency capping PopAds: 1 vez cada 24h ──────────────────
function shouldShowPopAds(): boolean {
  if (typeof window === 'undefined') return false
  const last = localStorage.getItem('popads_last_shown')
  if (!last) return true
  const diff = Date.now() - parseInt(last, 10)
  return diff > 24 * 60 * 60 * 1000 // 24 horas
}

function markPopAdsShown() {
  if (typeof window === 'undefined') return
  localStorage.setItem('popads_last_shown', Date.now().toString())
}

export function MangaReader({
  chapter,
  manga,
  prevChapter,
  nextChapter,
}: MangaReaderProps) {
  const { setTotalPages, setPage, settings } = useReaderStore()
  const { saveProgress = () => {} } = useReadingProgress(chapter.id) || {}

  // Auto-hide UI
  const [uiVisible, setUiVisible] = useState(true)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 🔽 EN TRUE TEMPORALMENTE PARA PASAR LA VALIDACIÓN DE POPADS 🔽
  const [loadPopAds, setLoadPopAds] = useState(true)

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

  // Lógica de activación (Volverá a actuar normalmente cuando loadPopAds regrese a false)
  useEffect(() => {
    if (!shouldShowPopAds()) return

    const handleFirstInteraction = () => {
      setLoadPopAds(true)
      markPopAdsShown()
      window.removeEventListener('scroll', handleFirstInteraction)
      window.removeEventListener('click', handleFirstInteraction)
    }

    window.addEventListener('scroll', handleFirstInteraction, { once: true })
    window.addEventListener('click', handleFirstInteraction, { once: true })

    return () => {
      window.removeEventListener('scroll', handleFirstInteraction)
      window.removeEventListener('click', handleFirstInteraction)
    }
  }, [])

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

      {/* CÓDIGO TEMPORAL ESTÁNDAR — SOLO PARA PASAR LA VALIDACIÓN DEL BOT */}
      {loadPopAds && (
        <Script
          id="popads"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              var _pop = _pop || [];
              _pop.push(['siteId', 5274444]);
              _pop.push(['minBid', 0]);
              _pop.push(['popundersPerIP', 1]);
              _pop.push(['delayBetween', 0]);
              _pop.push(['default', false]);
              _pop.push(['defaultPerDay', 0]);
              _pop.push(['topmostLayer', 'auto']);
              (function() {
                var pa = document.createElement('script'); pa.type = 'text/javascript'; pa.async = true;
                var s = document.getElementsByTagName('script')[0]; 
                pa.src = '//c1.popads.net/pop.js';
                pa.onerror = function() {
                  var sa = document.createElement('script'); sa.type = 'text/javascript'; sa.async = true;
                  sa.src = '//c2.popads.net/pop.js';
                  s.parentNode.insertBefore(sa, s);
                };
                s.parentNode.insertBefore(pa, s);
              })();
            `,
          }}
        />
      )}

      {/* Banner Adsterra nativo con Auto-Limpieza al salir del componente */}
      <AdsterraBannerWithCleanup />

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

// Componente auxiliar para forzar la eliminación del banner de Adsterra al salir de la página
function AdsterraBannerWithCleanup() {
  useEffect(() => {
    return () => {
      const elementsToCleanup = document.querySelectorAll(
        'iframe[src*="effectivecpmnetwork"], script[src*="effectivecpmnetwork"], [id^="at_"]'
      );
      elementsToCleanup.forEach((el) => el.remove());
    };
  }, []);

  return (
    <div className="fixed bottom-16 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <div className="pointer-events-auto">
        <Script
          src="https://pl30401168.effectivecpmnetwork.com/71/2d/71/712d71cf118ac18e499ea6141d17258f.js"
          strategy="lazyOnload"
        />
      </div>
    </div>
  );
}