
'use client'; 

import type { Metadata } from 'next'; 
import './globals.css';
import { AppLayout } from '@/components/layout/AppLayout';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/contexts/AuthContext';
import { useEffect }  from 'react';
import { useSearchParams, usePathname } from 'next/navigation';


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
  }, [searchParams, pathname]); 

  return (
    <html lang="es">
      <head>
        
        <title>Consciousness Class</title>
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

    