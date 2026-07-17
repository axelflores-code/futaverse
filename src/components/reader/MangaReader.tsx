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
  const { saveProgress } = useReadingProgress(chapter.id)

  // Auto-hide UI
  const [uiVisible, setUiVisible] = useState(true)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Banner Adsterra — una vez por sesión
  const [bannerClosed, setBannerClosed] = useState(() => {
    if (typeof window === 'undefined') return false
    return sessionStorage.getItem('adBannerClosed') === 'true'
  })

  // PopAds — cargar solo si pasaron 24h
  const [loadPopAds, setLoadPopAds] = useState(false)

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

  // Activar PopAds en el primer scroll/clic si corresponde
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

      {/* PopAds — se carga tras primer scroll/clic, max 1 vez cada 24h */}
      {loadPopAds && (
        <Script
          id="popads"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(){
                var i=window,x="dc9d8b8dbc262cb0af9d8a1ae5b28785",m=
                [["siteId",186*51+180*146+568+5277143],["minBid",0],
                ["popundersPerIP","0"],["delayBetween",0],["default",false],
                ["defaultPerDay",0],["topmostLayer","auto"]],j=
                "d3d3LmJ1dHRlcmFkc3IzdGVtLmNvbS9obGF2ZS5jc3M=",
                "ZDJrazBvM2ZyN2VkMDEuY2xvdWRmcm9udC5uZXQvaG92
                Ymt1dGUubWIuLmpz",b=-1,o,e,c=function(){clearTimeout(e);b++;
                if(j[b]&&!(1810235297000<(new Date).getTime()&&1<b))
                {o=i.document.createElement("script");o.type="text/javascript";
                o.async=!0;var p=i.document.getElementsByTagName("script")
                [0];o.src="https://"+atob(j[b]);o.crossOrigin="anonymous";
                o.onerror=c;o.onload=function(){clearTimeout(e);
                i[x.slice(0,16)]||c()};e=setTimeout(c,5E3);
                p.parentNode.insertBefore(o,p)}else{if(!i[x])
                {try{Object.freeze(i[x]=m)}catch(e){}}}})();
              })();
            `,
          }}
        />
      )}

      {/* Banner Adsterra - una vez por sesión */}
      {!bannerClosed && (
        <div className="fixed bottom-16 left-0 right-0 z-50 flex justify-center">
          <div className="relative">
            <button
              onClick={() => {
                setBannerClosed(true)
                sessionStorage.setItem('adBannerClosed', 'true')
              }}
              className="absolute -top-3 -right-3 z-10 bg-gray-800 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-gray-600"
            >
              ✕
            </button>
            <Script
              src="https://pl30401168.effectivecpmnetwork.com/71/2d/71/712d71cf118ac18e499ea6141d17258f.js"
              strategy="lazyOnload"
            />
          </div>
        </div>
      )}

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