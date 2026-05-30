'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export interface ActionState {
  error: string | null
  success: string | null
}

export async function loginAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const email    = formData.get('email') as string
  const password = formData.get('password') as string

  console.log('Login intento:', { email })

  if (!email || !password) {
    return { error: 'Completa todos los campos.', success: null }
  }

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  console.log('Login response:', {
    userId: data?.user?.id,
    error:  error?.message,
  })

  if (error) {
    return { error: mapAuthError(error.message), success: null }
  }

  if (!data.user) {
    return { error: 'No se pudo iniciar sesión.', success: null }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function registerAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const firstName = formData.get('firstName') as string
  const lastName  = formData.get('lastName')  as string
  const email     = formData.get('email')     as string
  const password  = formData.get('password')  as string

  console.log('Datos recibidos:', { firstName, email, passwordLength: password?.length })

  if (!email || !password || !firstName) {
    return { error: 'Completa todos los campos.', success: null }
  }

  if (password.length < 8) {
    return { error: 'La contraseña debe tener al menos 8 caracteres.', success: null }
  }

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name:   firstName,
        last_name:    lastName,
        display_name: `${firstName} ${lastName}`.trim(),
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm`,
    },
  })

  console.log('Supabase response:', {
    user:  data?.user?.id,
    email: data?.user?.email,
    error: error?.message,
    errorStatus: error?.status,
  })

  if (error) {
    return { error: mapAuthError(error.message), success: null }
  }

  if (!data.user) {
    return { error: 'No se pudo crear la cuenta.', success: null }
  }

  return {
    error:   null,
    success: '¡Cuenta creada! Ya puedes iniciar sesión.',
  }
}

export async function logoutAction(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

export async function resetPasswordAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const email = formData.get('email') as string

  if (!email) {
    return { error: 'Ingresa tu correo.', success: null }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm`,
  })

  if (error) {
    return { error: mapAuthError(error.message), success: null }
  }

  return {
    error:   null,
    success: 'Si el correo existe recibirás un enlace en tu bandeja.',
  }
}

function mapAuthError(message: string): string {
  const map: Record<string, string> = {
    'Invalid login credentials':     'Correo o contraseña incorrectos.',
    'Email not confirmed':           'Confirma tu correo antes de entrar.',
    'User already registered':       'Ya existe una cuenta con este correo.',
    'Password should be at least 6 characters': 'Mínimo 6 caracteres.',
    'Email rate limit exceeded':     'Demasiados intentos. Espera unos minutos.',
  }
  return map[message] ?? 'Ocurrió un error. Inténtalo de nuevo.'
}