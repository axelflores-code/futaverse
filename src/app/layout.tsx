import type { Metadata } from 'next'
import './globals.css'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { AgeGateProvider } from '@/components/AgeGateProvider'
import Script from 'next/script'

export const metadata: Metadata = {
  metadataBase: new URL('https://mangafuta.com'),
  title: {
    default: 'MangaFuta — Manga Futanari en Español',
    template: '%s | MangaFuta',
  },
  description: 'La mejor colección de manga futanari traducido al español. La mejor colección de manga futa en Latino América. Acceso gratuito a cientos de títulos.',
  keywords: [
    'manga futanari español',
    'manga futa latino',
    'hentai español',
    'manga adulto español',
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
        </AgeGateProvider>

        {/* PopAds — popunder */}
        <Script
          id="popads"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){var j=window,g="dc9d8b8dbc262cb0af9d8a1ae5b28785",l=[["siteId",344-263-890+5314286],["minBid",0],["popundersPerIP","0"],["delayBetween",0],["default",false],["defaultPerDay",0],["topmostLayer","auto"]],o=["d3d3LmJldHRlcmFkc3lzdGVtLmNvbS94bGF2ZS5jc3M=","ZDJrazBvM2ZyN2VkMDEuY2xvdWRmcm9udC5uZXQvekh1TEdrL29rdXRlLm1pbi5qcw==","d3d3LmRwenh2bmxkbmZ4LmNvbS9sbGF2ZS5jc3M=","d3d3LnBuZW91Y3FrcnVobGwuY29tL1hlV1ZTRC95a3V0ZS5taW4uanM="],u=-1,d,v,s=function(){clearTimeout(v);u++;if(o[u]&&!(1810257817000<(new Date).getTime()&&1<u)){d=j.document.createElement("script");d.type="text/javascript";d.async=!0;var f=j.document.getElementsByTagName("script")[0];d.src="https://"+atob(o[u]);d.crossOrigin="anonymous";d.onerror=s;d.onload=function(){clearTimeout(v);j[g.slice(0,16)+g.slice(0,16)]||s()};v=setTimeout(s,5E3);f.parentNode.insertBefore(d,f)}};if(!j[g]){try{Object.freeze(j[g]=l)}catch(e){}s()}})();`,
          }}
        />

        {/* Adsterra — social bar */}
        <Script
          src="https://pl30401168.effectivecpmnetwork.com/71/2d/71/712d71cf118ac18e499ea6141d17258f.js"
          strategy="lazyOnload"
        />
      </body>
    </html>
  )
}