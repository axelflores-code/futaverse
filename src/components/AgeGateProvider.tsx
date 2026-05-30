'use client'

import { useState, useEffect } from 'react'
import { AgeGate } from './AgeGate'

export function AgeGateProvider({ children }: { children: React.ReactNode }) {
  const [verified, setVerified] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('fv_age_verified')
    setVerified(saved === 'true')
    setChecking(false)
  }, [])

  if (checking) return null

  if (!verified) {
    return <AgeGate onConfirm={() => setVerified(true)} />
  }

  return <>{children}</>
}