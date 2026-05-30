import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Acceso | FutaVerse',
  robots: { index: false }, // No indexar páginas de auth
};

// Si el usuario ya tiene sesión, redirigir al home
export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) redirect('/');

  return (
    <div className="min-h-screen bg-[#0b0c10] flex items-center justify-center p-4">
      {children}
    </div>
  );
}