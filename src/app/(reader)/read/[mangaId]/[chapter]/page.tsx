import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { MangaReader } from '@/components/reader/MangaReader'
import { getChapterWithAdjacentNav } from '@/lib/queries/chapters'
import Script from 'next/script'

interface PageProps {
  params: Promise<{
    mangaId: string
    chapter: string
  }>
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { mangaId, chapter } = await params
  const chapterNumber = Number(chapter)

  if (
    !Number.isFinite(chapterNumber) ||
    chapterNumber < 0
  ) {
    return {
      title: 'Capítulo no encontrado',
      robots: {
        index: false,
        follow: false,
      },
    }
  }

  const data = await getChapterWithAdjacentNav(
    mangaId,
    chapterNumber
  )

  if (!data) {
    return {
      title: 'Capítulo no encontrado',
      robots: {
        index: false,
        follow: false,
      },
    }
  }

  const mangaUrl =
    `https://mangafuta.com/manga/${data.manga.slug}`

  return {
    title:
      `${data.manga.title} — Capítulo ${chapterNumber}`,

    description:
      `Lee el capítulo ${chapterNumber} de ${data.manga.title} en MangaFuta.`,

    alternates: {
      canonical: mangaUrl,
    },

    robots: {
      index: false,
      follow: true,

      googleBot: {
        index: false,
        follow: true,
        'max-image-preview': 'large',
      },
    },

    openGraph: {
      type: 'website',
      locale: 'es_ES',
      siteName: 'MangaFuta',
      title:
        `${data.manga.title} — Capítulo ${chapterNumber}`,
      description:
        `Lee el capítulo ${chapterNumber} de ${data.manga.title} en MangaFuta.`,
      url: mangaUrl,
    },
  }
}

export default async function ReaderPage({
  params,
}: PageProps) {
  const { mangaId, chapter } = await params
  const chapterNumber = Number(chapter)

  if (
    !Number.isFinite(chapterNumber) ||
    chapterNumber < 0
  ) {
    notFound()
  }

  const data = await getChapterWithAdjacentNav(
    mangaId,
    chapterNumber
  )

  if (!data) {
    notFound()
  }

  return (
    <>
      <Script
        id="popads"
        src="/popads.js"
        strategy="lazyOnload"
      />

      <MangaReader
        chapter={data.chapter}
        manga={data.manga}
        prevChapter={data.prev}
        nextChapter={data.next}
      />
    </>
  )
}