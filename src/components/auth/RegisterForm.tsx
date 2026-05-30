'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { registerAction } from '@/lib/actions/auth';
import { AuthInput } from './AuthInput';
import { PasswordInput } from './PasswordInput';
import { PasswordStrength } from './PasswordStrength';
import { useState } from 'react';

const INITIAL_STATE = { error: null, success: null }

export function RegisterForm() {
  const [state, formAction] = useActionState(registerAction, INITIAL_STATE)
  const [password, setPassword] = useState('')

  if (state.success) {
    return (
      <div className="text-center py-6">
        <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
          </svg>
        </div>
        <p className="text-white font-semibold mb-1">¡Cuenta creada!</p>
        <p className="text-sm text-zinc-500">{state.success}</p>
        <a href="/login" className="mt-4 inline-block text-sm text-red-400 hover:text-red-300 transition-colors">
          Ir al login →
        </a>
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
            Nombre
          </label>
          <input
            name="firstName"
            type="text"
            required
            placeholder="Apodo"
            className="w-full bg-[#111318] border border-white/5 rounded-lg px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-700 outline-none focus:border-red-500/50 hover:border-white/10 transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
            Apellido
          </label>
          <input
            name="lastName"
            type="text"
            placeholder="San"
            className="w-full bg-[#111318] border border-white/5 rounded-lg px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-700 outline-none focus:border-red-500/50 hover:border-white/10 transition-colors"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
          Correo electrónico
        </label>
        <input
          name="email"
          type="email"
          required
          placeholder="tu@email.com"
          className="w-full bg-[#111318] border border-white/5 rounded-lg px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-700 outline-none focus:border-red-500/50 hover:border-white/10 transition-colors"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
          Contraseña
        </label>
        <input
          name="password"
          type="password"
          required
          placeholder="Mín. 8 caracteres"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full bg-[#111318] border border-white/5 rounded-lg px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-700 outline-none focus:border-red-500/50 hover:border-white/10 transition-colors"
        />
        {/* Barra de seguridad */}
        {password && (
          <div className="flex gap-1 mt-2">
            {[1,2,3].map(i => {
              const score = [
                password.length >= 8,
                /[A-Z]/.test(password) && /[0-9]/.test(password),
                /[^A-Za-z0-9]/.test(password),
              ].filter(Boolean).length
              return (
                <div
                  key={i}
                  className={`h-0.5 flex-1 rounded-full transition-colors duration-300 ${
                    i <= score
                      ? score === 1 ? 'bg-red-500'
                      : score === 2 ? 'bg-amber-500'
                      : 'bg-emerald-500'
                      : 'bg-white/5'
                  }`}
                />
              )
            })}
          </div>
        )}
      </div>

      {state.error && (
        <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5">
          {state.error}
        </div>
      )}

      <SubmitButton />

      <p className="text-xs text-zinc-700 text-center leading-relaxed">
        Al registrarte aceptas los Términos y la Política de privacidad.
      </p>
    </form>
  )
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full py-3 rounded-lg bg-red-500 hover:bg-red-400 text-white text-sm font-bold tracking-wide transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
    >
      {pending && (
        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
      )}
      {pending ? 'Creando cuenta...' : 'Crear mi cuenta'}
    </button>
  )
}