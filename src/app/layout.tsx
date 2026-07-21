import type { Metadata } from 'next'
import './globals.css'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { AgeGateProvider } from '@/components/AgeGateProvider'

export const metadata: Metadata = {
  metadataBase: new URL('https://mangafuta.com'),
  title: {
    default: 'MangaFuta — Manga Futanari en Español',
    template: '%s | MangaFuta',
  },
  description: 'La mejor colección de manga futanari traducido al español. La mejor colección de manga futa en Latino América. Acceso gratuito a cientos de títulos.',
  keywords: [
    'manga futanari',
    'manga futa latino',
    'hentai español',
    'manga futa español',
    'futanari manga online',
    'manga futa gratis',
    'dickgirl manga español',
    'manga +18 español',
    'leer manga futa online',
    'manga hentai latino',
  ],
  authors: [{ name: 'MangaFuta' }],
  creator: 'MangaFuta',
  publisher: 'MangaFuta',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'es_LA',
    url: 'https://mangafuta.com',
    siteName: 'MangaFuta',
    title: 'MangaFuta — Manga Futanari en Español',
    description: 'La mejor colección de manga futanari traducido al español para Latino América.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'MangaFuta',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MangaFuta — Manga Futanari en Español',
    description: 'La mejor colección de manga futanari traducido al español.',
    images: ['/og-image.jpg'],
  },
  alternates: {
    canonical: 'https://mangafuta.com',
    languages: {
      'es': 'https://mangafuta.com',
    },
  },
  verification: {
    google: '',
    other: {
      '6a97888e-site-verification': '9862d423ce5b704289bca8e9f5a361c8',
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        <link rel="canonical" href="https://mangafuta.com" />
        <link rel="stylesheet" href="https://cdn-uicons.flaticon.com/2.6.0/uicons-regular-rounded/css/uicons-regular-rounded.css" />
        <link rel="stylesheet" href="https://cdn-uicons.flaticon.com/2.6.0/uicons-solid-rounded/css/uicons-solid-rounded.css" />
        <link rel="stylesheet" href="https://cdn-uicons.flaticon.com/2.6.0/uicons-brands/css/uicons-brands.css" />
      </head>
      <body className="bg-[#0b0c10] text-white antialiased min-h-screen flex flex-col">
        <AgeGateProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </AgeGateProvider>s

      </body>
    </html>
  )
}