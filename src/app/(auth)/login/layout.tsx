import type {
  Metadata,
} from 'next'

import type {
  ReactNode,
} from 'react'

export const metadata:
  Metadata = {
  title:
    'Iniciar sesión',

  description:
    'Inicia sesión en tu cuenta de MangaFuta.',

  robots: {
    index: false,
    follow: false,

    googleBot: {
      index: false,
      follow: false,
    },
  },
}

interface LoginLayoutProps {
  children: ReactNode
}

export default function LoginLayout({
  children,
}: LoginLayoutProps) {
  return children
}