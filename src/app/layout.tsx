import type { Metadata } from 'next'
import './globals.css'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { AgeGateProvider } from '@/components/AgeGateProvider'

export const metadata: Metadata = {
  metadataBase: new URL('http://localhost:3000'),
  title: {
    default: 'FutaVerse — Manga +18',
    template: '%s | FutaVerse',
  },
  description: 'Plataforma de manga adulto.',
  robots: { index: false, follow: false },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
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