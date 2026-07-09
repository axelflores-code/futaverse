import { LoginForm } from '@/components/auth/LoginForm';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="w-full max-w-[900px] flex rounded-2xl overflow-hidden border border-white/5 shadow-2xl">
      {/* Panel izquierdo — branding */}
      <AuthBrandPanel />

      {/* Panel derecho — formulario */}
      <div className="flex-1 bg-[#0f1117] p-10 flex flex-col justify-center">
        <div className="mb-8">
          <h1 className="font-display text-2xl font-extrabold text-white mb-1">
            Bienvenido de vuelta
          </h1>
          <p className="text-sm text-zinc-500">
            ¿No tienes cuenta?{' '}
            <Link
              href="/register"
              className="text-red-500 hover:text-red-400 transition-colors"
            >
              Regístrate gratis
            </Link>
          </p>
        </div>

        <LoginForm />
      </div>
    </div>
  );
}

function AuthBrandPanel() {
  return (
    <div className="hidden md:flex w-[42%] bg-[#090a0c] p-10 flex-col justify-between border-r border-white/5">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-pink-500 flex items-center justify-center">
          <BookOpenIcon />
        </div>
        <span className="font-display text-lg font-extrabold text-white tracking-tight">
          MangaFuta
        </span>
      </div>

      <div>
        <p className="text-[11px] font-semibold tracking-widest text-red-500 uppercase mb-4">
          ¡Aqui puedes leer manga H en español gratis y sin registro!
        </p>
        <h2 className="font-display text-3xl font-extrabold text-white leading-tight mb-3">
          Miles de títulos.
          <br />
          Un solo acceso.
        </h2>
        <p className="text-sm text-zinc-600 leading-relaxed">
          Sigue tu progreso, guarda favoritos y lee sin
          interrupciones desde cualquier dispositivo.
        </p>
      </div>

      <div className="flex gap-8">
        {[
          { value: '12K+', label: 'Capítulos' },
          { value: '840+', label: 'Series' },
          { value: 'Free', label: 'Siempre' },
        ].map((stat) => (
          <div key={stat.label}>
            <p className="font-display text-xl font-bold text-white">{stat.value}</p>
            <p className="text-xs text-zinc-600 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function BookOpenIcon() {
  return (
    <svg
      className="w-4 h-4 text-white fill-current"
      viewBox="0 0 18 18"
      aria-hidden="true"
    >
      <path d="M9 1L3 5v8l6 4 6-4V5L9 1zm0 2.4L13 6v6l-4 2.6L5 12V6l4-2.6z" />
    </svg>
  );
}