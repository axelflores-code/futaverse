// src/app/(auth)/login/page.tsx

import { LoginForm } from '@/components/auth/LoginForm'
import Link from 'next/link'
import Image from 'next/image'

export default function LoginPage() {
  return (
    <div style={{ display: 'flex', width: '100%', maxWidth: '900px', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(196,149,106,0.12)', boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }}>

      {/* Panel izquierdo — branding */}
      <div style={{ width: '42%', background: '#0c0c12', padding: '40px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRight: '1px solid rgba(196,149,106,0.08)' }} className="auth-left">

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Image src="/logo.png" alt="MangaFuta" width={36} height={36} style={{ width: 'auto', height: '36px', objectFit: 'contain' }} />
          <span style={{ fontFamily: '"Cormorant Garamond", Georgia, serif', fontWeight: 700, fontSize: '22px', color: '#C4956A', letterSpacing: '-0.02em' }}>
            MangaFuta
          </span>
        </div>

        {/* Hero text */}
        <div>
          <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: '#C4956A', marginBottom: '16px' }}>
            ¡Aquí puedes leer manga H en español gratis y sin registro!
          </p>
          <h2 style={{ fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: '32px', fontWeight: 700, color: '#f0ece8', lineHeight: 1.15, marginBottom: '14px' }}>
            Miles de títulos.<br />Un solo acceso.
          </h2>
          <p style={{ fontSize: '14px', color: 'rgba(160,152,144,0.7)', lineHeight: 1.65 }}>
            Sigue tu progreso, guarda favoritos y lee sin interrupciones desde cualquier dispositivo.
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '28px' }}>
          {[
            { value: '12K+', label: 'Capítulos' },
            { value: '840+', label: 'Series'    },
            { value: 'Free', label: 'Siempre'   },
          ].map(stat => (
            <div key={stat.label}>
              <p style={{ fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: '22px', fontWeight: 700, color: '#C4956A' }}>{stat.value}</p>
              <p style={{ fontSize: '11px', color: 'rgba(96,88,80,1)', marginTop: '2px' }}>{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Panel derecho — formulario */}
      <div style={{ flex: 1, background: '#111118', padding: '40px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#f0ece8', marginBottom: '6px' }}>
            Bienvenido de vuelta
          </h1>
          <p style={{ fontSize: '13px', color: 'rgba(160,152,144,0.6)' }}>
            ¿No tienes cuenta?{' '}
            <Link href="/register" style={{ color: '#C4956A', textDecoration: 'none', fontWeight: 600 }}>
              Regístrate gratis
            </Link>
          </p>
        </div>

        <LoginForm />
      </div>

      <style>{`
        @media (max-width: 640px) { .auth-left { display: none !important; } }
      `}</style>
    </div>
  )
}