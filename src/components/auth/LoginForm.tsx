'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import { loginAction } from '@/lib/actions/auth';
import { AuthInput } from './AuthInput';
import { PasswordInput } from './PasswordInput';

const INITIAL_STATE = { error: null, success: null };

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, INITIAL_STATE);

  return (
    <form action={formAction} className="space-y-5">
      <AuthInput
        name="email"
        type="email"
        label="Correo electrónico"
        placeholder="tu@email.com"
        autoComplete="email"
        required
      />

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[11px] font-semibold tracking-wider text-zinc-500 uppercase">
            Contraseña
          </label>
          <Link
            href="/reset-password"
            className="text-[11px] text-zinc-600 hover:text-red-500 transition-colors"
          >
            ¿Olvidaste la tuya?
          </Link>
        </div>
        <PasswordInput name="password" placeholder="••••••••" autoComplete="current-password" />
      </div>

      <label className="flex items-center gap-2.5 cursor-pointer group">
        <input
          type="checkbox"
          name="remember"
          value="on"
          className="w-3.5 h-3.5 rounded accent-red-500 cursor-pointer"
        />
        <span className="text-xs text-zinc-600 group-hover:text-zinc-400 transition-colors">
          Mantener sesión iniciada
        </span>
      </label>

      {/* Error del servidor */}
      {state.error && (
        <div
          role="alert"
          className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5"
        >
          {state.error}
        </div>
      )}

      <SubmitButton label="Entrar a FutaVerse" />

      <Divider />

      <GoogleButton />

      <p className="text-[11px] text-zinc-700 text-center leading-relaxed">
        Al entrar aceptas los{' '}
        <Link href="/terms" className="text-red-600 hover:text-red-500">
          Términos
        </Link>{' '}
        y la{' '}
        <Link href="/privacy" className="text-red-600 hover:text-red-500">
          Política de privacidad
        </Link>
        .
      </p>
    </form>
  );
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="
        w-full py-3 rounded-lg
        bg-red-500 hover:bg-red-400
        text-white text-sm font-bold tracking-wide font-display
        transition-colors duration-150
        disabled:opacity-60 disabled:cursor-not-allowed
        flex items-center justify-center gap-2
      "
    >
      {pending && (
        <span
          className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
          aria-hidden="true"
        />
      )}
      {pending ? 'Entrando...' : label}
    </button>
  );
}

function Divider() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-px bg-white/5" />
      <span className="text-xs text-zinc-700">o continúa con</span>
      <div className="flex-1 h-px bg-white/5" />
    </div>
  );
}

function GoogleButton() {
  return (
    <button
      type="button"
      className="
        w-full py-2.5 rounded-lg border border-white/5
        text-zinc-500 hover:text-zinc-300 hover:border-white/10
        text-sm flex items-center justify-center gap-2.5
        transition-colors duration-150
      "
    >
      <GoogleIcon />
      Continuar con Google
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}