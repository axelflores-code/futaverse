'use client'

import { useState, useEffect } from 'react'
import { AgeGate } from './AgeGate'

export function AgeGateProvider({ children }: { children: React.ReactNode }) {
  const [verified, setVerified] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('fv_age_verified')
    setVerified(saved === 'true')
    setMounted(true)
  }, [])

  return (
    <>
      {/* El contenido real SIEMPRE está en el DOM — esto es lo que Google
          indexa y lo que cuenta para LCP. El Age Gate es solo un overlay
          visual que se retira, no un bloqueo que reemplaza el contenido. */}
      {children}

      {/* Overlay del Age Gate — solo se muestra en cliente si no está verificado */}
      {mounted && !verified && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999 }}>
          <AgeGate onConfirm={() => setVerified(true)} />
        </div>
      )}
    </>
  )
}