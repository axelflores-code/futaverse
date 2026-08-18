import type {
  Metadata,
} from 'next'

import type {
  ReactNode,
} from 'react'

export const metadata:
  Metadata = {
  title:
    'Crear cuenta',

  description:
    'Crea una cuenta en MangaFuta.',

  robots: {
    index: false,
    follow: false,

    googleBot: {
      index: false,
      follow: false,
    },
  },
}

interface RegisterLayoutProps {
  children: ReactNode
}

export default function RegisterLayout({
  children,
}: RegisterLayoutProps) {
  return children
}