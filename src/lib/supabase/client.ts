import { createBrowserClient } from '@supabase/ssr';
//import type { Database } from '@/types/supabase';

// Singleton para el navegador — reutiliza la misma instancia
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}


