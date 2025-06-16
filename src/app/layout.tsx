
'use client'; // Convertir a Client Component para usar useEffect

import type { Metadata } from 'next'; // Metadata sigue siendo útil para SSR inicial
import './globals.css';
import { AppLayout } from '@/components/layout/AppLayout';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/contexts/AuthContext';
import { useEffect }  from 'react';
import { useSearchParams, usePathname } from 'next/navigation';

// Metadata puede definirse aquí o moverse a un componente Server Component padre si es necesario
// export const metadata: Metadata = { // Esto ya no es válido en un Client Component raíz
//   title: 'MentorBloom',
//   description: 'Plataforma de Membresías y Cursos Online',
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  useEffect(() => {
    const referralCodeFromUrl = searchParams.get('ref');
    if (referralCodeFromUrl) {
      // Validar formato básico del código si es necesario antes de guardarlo
      // Por ejemplo, longitud o caracteres permitidos.
      // Para el MVP, una validación simple:
      if (referralCodeFromUrl.length > 3 && referralCodeFromUrl.length < 50 && /^[a-zA-Z0-9-_]+$/.test(referralCodeFromUrl)) {
        try {
          localStorage.setItem('referral_code', referralCodeFromUrl);
          console.log(`[RootLayout] Referral code "${referralCodeFromUrl}" from URL saved to localStorage.`);
        } catch (error) {
          console.error("[RootLayout] Error saving referral code to localStorage:", error);
        }
      } else {
        console.warn(`[RootLayout] Invalid referral code format in URL: "${referralCodeFromUrl}". Not saving.`);
      }
    }
  }, [searchParams, pathname]); // Re-run if searchParams or pathname changes

  return (
    <html lang="es">
      <head>
        {/* Metadata estática puede ir aquí si no se genera dinámicamente */}
        <title>MentorBloom</title>
        <meta name="description" content="Plataforma de Membresías y Cursos Online" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <AuthProvider>
          <AppLayout>{children}</AppLayout>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
