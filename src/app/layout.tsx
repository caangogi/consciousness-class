
'use client'; 

import type { Metadata } from 'next'; 
import './globals.css';
import { AppLayout } from '@/components/layout/AppLayout'; // This contains Header and Footer
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/contexts/AuthContext';
import React, { useEffect, Suspense } from 'react'; // Added React and Suspense
import { useSearchParams, usePathname } from 'next/navigation';

// Fallback component for Suspense
function RootLayoutFallback() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'sans-serif', backgroundColor: 'hsl(var(--secondary))', color: 'hsl(var(--foreground))' }}>
      <div style={{ textAlign: 'center', padding: '30px 20px', borderRadius: '8px', boxShadow: '0 6px 20px rgba(0,0,0,0.08)', backgroundColor: 'hsl(var(--card))', maxWidth: '320px' }}>
        <h2 style={{ fontSize: '1.6em', fontWeight: '600', marginBottom: '12px', color: 'hsl(var(--primary))' }}>Cargando...</h2>
        <p style={{ fontSize: '0.95em', color: 'hsl(var(--muted-foreground))', marginBottom: '25px' }}>
          Estamos preparando la página. Un momento por favor.
        </p>
        <div style={{
          border: '4px solid hsla(var(--primary), 0.2)',
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          borderTopColor: 'hsl(var(--primary))',
          animation: 'spin 1s ease-in-out infinite',
          margin: '0 auto'
        }}></div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // These hooks make RootLayout a Client Component and dynamic
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
          <Suspense fallback={<RootLayoutFallback />}>
            <AppLayout>{children}</AppLayout>
          </Suspense>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
