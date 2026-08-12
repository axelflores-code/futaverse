import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Buscar manga',

  description:
    'Busca mangas y doujinshis disponibles en MangaFuta.',

  alternates: {
    canonical: '/search',
  },

  robots: {
    index: false,
    follow: true,

    googleBot: {
      index: false,
      follow: true,
    },
  },
}

export default function SearchLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return children
}