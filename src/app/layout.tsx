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

  description:
    'La mejor colección de manga futanari traducido al español. Acceso gratuito a cientos de títulos.',

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
    locale: 'es_ES',
    siteName: 'MangaFuta',
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
    images: ['/og-image.jpg'],
  },

  verification: {
    google: '',
    other: {
      '6a97888e-site-verification':
        '9862d423ce5b704289bca8e9f5a361c8',
    },
  },

  other: {
    rating: 'adult',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn-uicons.flaticon.com/2.6.0/uicons-regular-rounded/css/uicons-regular-rounded.css"
        />
        <link
          rel="stylesheet"
          href="https://cdn-uicons.flaticon.com/2.6.0/uicons-solid-rounded/css/uicons-solid-rounded.css"
        />
        <link
          rel="stylesheet"
          href="https://cdn-uicons.flaticon.com/2.6.0/uicons-brands/css/uicons-brands.css"
        />
      </head>

      <body className="bg-[#0b0c10] text-white antialiased min-h-screen flex flex-col">
        <AgeGateProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </AgeGateProvider>
      </body>
    </html>
  )
}