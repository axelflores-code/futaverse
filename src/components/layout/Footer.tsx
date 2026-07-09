// ============================================================
// src/components/layout/Footer.tsx
// ============================================================
 
import Link from 'next/link'
import Image from 'next/image'
 
export function Footer() {
  return (
    <footer className="mt-16 py-10"
      style={{
        borderTop: '1px solid rgba(196,149,106,0.10)',
        background: '#0a0a0f',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="Mangafuta" width={28} height={28} className="object-contain" />
          <span className="text-sm font-bold gradient-text">Mangafuta</span>
        </div>
 
        <p className="text-xs" style={{ color: 'rgba(96,88,80,1)' }}>
          © 2026 Mangafuta · Todos los derechos reservados
        </p>
 
        <div className="flex gap-4">
          {[
            { href: '/terms',   label: 'Términos'   },
            { href: '/privacy', label: 'Privacidad' },
          ].map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="text-xs transition-colors"
              style={{ color: 'rgba(96,88,80,1)' }}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  )
}
 