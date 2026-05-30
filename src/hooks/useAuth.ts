'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  loading: boolean;
}

// Hook para usar el usuario en Client Components
export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({ user: null, loading: true });
  const supabase = createClient();

  useEffect(() => {
    // Obtener sesión inicial
    supabase.auth.getUser().then(({ data: { user } }) => {
      setState({ user, loading: false });
    });

    // Suscribirse a cambios de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setState({ user: session?.user ?? null, loading: false });
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  return state;
}