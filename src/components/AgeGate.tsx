'use client'

import { useState } from 'react'

interface AgeGateProps {
  onConfirm: () => void
}

export function AgeGate({ onConfirm }: AgeGateProps) {
  const [declined, setDeclined] = useState(false)

  if (declined) {
    return (
      <div className="min-h-screen bg-[#0b0c10] flex items-center justify-center">
        <p className="text-zinc-400 text-sm">Debes ser mayor de 18 años para acceder.</p>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[999] bg-[#0b0c10] flex items-center justify-center p-4">
      <div className="max-w-sm w-full bg-[#111] border border-white/10 rounded-2xl p-8 text-center">

        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-5">
          <span className="text-2xl font-black text-red-400">18+</span>
        </div>

        <h2 className="text-xl font-bold text-white mb-2">
          Contenido para adultos
        </h2>
        <p className="text-sm text-zinc-500 mb-2 leading-relaxed">
          FutaVerse contiene contenido explícito para adultos mayores de 18 años.
        </p>
        <p className="text-xs text-zinc-600 mb-8">
          Al continuar confirmas que eres mayor de edad y aceptas los términos del sitio.
        </p>

        <div className="flex gap-3">
          <button
            onClick={() => setDeclined(true)}
            className="flex-1 py-2.5 rounded-lg border border-white/10 text-zinc-400 text-sm hover:bg-white/5 transition-colors"
          >
            No, salir
          </button>
          <button
            onClick={() => {
              localStorage.setItem('fv_age_verified', 'true')
              onConfirm()
            }}
            className="flex-1 py-2.5 rounded-lg bg-red-500 hover:bg-red-400 text-white text-sm font-semibold transition-colors"
          >
            Sí, soy mayor
          </button>
        </div>
      </div>
    </div>
  )
}