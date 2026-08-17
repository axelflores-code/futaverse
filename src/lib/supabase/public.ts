import 'server-only'

import {
  createClient,
  type SupabaseClient,
} from '@supabase/supabase-js'

let publicClient:
  | SupabaseClient
  | undefined

export function createPublicClient() {
  if (publicClient) {
    return publicClient
  }

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL

  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Faltan las variables públicas de Supabase'
    )
  }

  publicClient = createClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  )

  return publicClient
}