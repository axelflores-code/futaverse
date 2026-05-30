import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t border-white/5 mt-16 py-10 bg-[#0b0c10]">
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-red-500 flex items-center justify-center">
            <svg className="w-3 h-3 fill-white" viewBox="0 0 18 18">
              <path d="M9 1L3 5v8l6 4 6-4V5L9 1zm0 2.4L13 6v6l-4 2.6L5 12V6l4-2.6z"/>
            </svg>
          </div>
          <span className="text-sm font-bold text-white">FutaVerse</span>
        </div>
        <p className="text-xs text-zinc-600">© 2025 FutaVerse. Todos los derechos reservados.</p>
        <div className="flex gap-4">
          {[
            { href: '/terms',   label: 'Términos' },
            { href: '/privacy', label: 'Privacidad' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  )
}