import { RegisterForm } from '@/components/auth/RegisterForm';
import Link from 'next/link';

export default function RegisterPage() {
  return (
    <div className="w-full max-w-md bg-[#0f1117] rounded-2xl border border-white/5 p-10 shadow-2xl">
      <div className="flex items-center gap-2.5 mb-8">
        <div className="w-7 h-7 rounded-lg bg-red-500 flex items-center justify-center">
          <svg className="w-4 h-4 fill-white" viewBox="0 0 18 18" aria-hidden="true">
            <path d="M9 1L3 5v8l6 4 6-4V5L9 1zm0 2.4L13 6v6l-4 2.6L5 12V6l4-2.6z" />
          </svg>
        </div>
        <span className="font-display text-base font-extrabold text-white">FutaVerse</span>
      </div>

      <div className="mb-8">
        <h1 className="font-display text-2xl font-extrabold text-white mb-1">
          Crea tu cuenta
        </h1>
        <p className="text-sm text-zinc-500">
          ¿Ya tienes cuenta?{' '}
          <Link
            href="/login"
            className="text-red-500 hover:text-red-400 transition-colors"
          >
            Inicia sesión
          </Link>
        </p>
      </div>

      <RegisterForm />
    </div>
  );
}