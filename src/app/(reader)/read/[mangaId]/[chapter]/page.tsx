import type {
  Metadata,
} from 'next'

import {
  cache,
} from 'react'

import Script from 'next/script'
import {
  notFound,
} from 'next/navigation'

import {
  MangaReader,
} from '@/components/reader/MangaReader'

import {
  getChapterWithAdjacentNav,
} from '@/lib/queries/chapters'

interface PageProps {
  params: Promise<{
    mangaId: string
    chapter: string
  }>
}

/*
 * Evita ejecutar dos veces la misma
 * consulta entre generateMetadata
 * y la página.
 *
 * No modifica el comportamiento de
 * capítulos anteriores o siguientes.
 */
const getReaderData = cache(
  async (
    mangaId: string,
    chapterNumber: number
  ) => {
    return getChapterWithAdjacentNav(
      mangaId,
      chapterNumber
    )
  }
)

function parseChapterNumber(
  value: string
): number | null {
  const chapterNumber =
    Number(value)

  if (
    !Number.isFinite(
      chapterNumber
    ) ||
    chapterNumber < 0
  ) {
    return null
  }

  return chapterNumber
}

function cleanSeoTitle(
  title: string
): string {
  return title
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const {
    mangaId,
    chapter,
  } = await params

  const chapterNumber =
    parseChapterNumber(chapter)

  if (chapterNumber === null) {
    return {
      title:
        'Capítulo no encontrado',

      robots: {
        index: false,
        follow: false,
      },
    }
  }

  const data =
    await getReaderData(
      mangaId,
      chapterNumber
    )

  if (!data) {
    return {
      title:
        'Capítulo no encontrado',

      robots: {
        index: false,
        follow: false,
      },
    }
  }

  const mangaTitle =
    cleanSeoTitle(
      data.manga.title
    )

  const mangaUrl =
    `https://mangafuta.com/manga/${data.manga.slug}`

  const title =
    `${mangaTitle} — Capítulo ${chapterNumber}`

  const description =
    `Lee el capítulo ${chapterNumber} de ${mangaTitle} en MangaFuta.`

  return {
    title,
    description,

    /*
     * Como normalmente existe un único
     * capítulo, consolidamos la relevancia
     * SEO en la ficha principal.
     */
    alternates: {
      canonical:
        mangaUrl,
    },

    robots: {
      index: false,
      follow: true,

      googleBot: {
        index: false,
        follow: true,

        'max-image-preview':
          'large',
      },
    },

    openGraph: {
      type: 'website',
      locale: 'es_ES',
      siteName: 'MangaFuta',
      title,
      description,
      url: mangaUrl,
    },

    twitter: {
      card:
        'summary_large_image',

      title,
      description,
    },
  }
}

export default async function ReaderPage({
  params,
}: PageProps) {
  const {
    mangaId,
    chapter,
  } = await params

  const chapterNumber =
    parseChapterNumber(chapter)

  if (chapterNumber === null) {
    notFound()
  }

  const data =
    await getReaderData(
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