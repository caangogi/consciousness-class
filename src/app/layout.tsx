
'use client'; 

import type { Metadata } from 'next'; 
import './globals.css';
import { AppLayout } from '@/components/layout/AppLayout';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/contexts/AuthContext';
import React, { useEffect, Suspense } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';
import Image from 'next/image';
import { ptSans, playfairDisplay } from '@/lib/fonts';
import { cn } from '@/lib/utils';

// Fallback component for Suspense
function RootLayoutFallback() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'sans-serif', backgroundColor: 'hsl(var(--secondary))', color: 'hsl(var(--foreground))' }}>
      <div style={{ textAlign: 'center', padding: '30px 20px', borderRadius: '8px', boxShadow: '0 6px 20px rgba(0,0,0,0.08)', backgroundColor: 'hsl(var(--card))', maxWidth: '320px' }}>
        <h2 style={{ fontSize: '1.6em', fontWeight: '600', marginBottom: '12px', color: 'hsl(var(--primary))' }}>Cargando...</h2>
        <p style={{ fontSize: '0.95em', color: 'hsl(var(--muted-foreground))', marginBottom: '25px' }}>
          Estamos preparando la página. Un momento por favor.
        </p>
        {/* Replace CSS loader with Image component for GIF */}
        <Image 
            src="https://firebasestorage.googleapis.com/v0/b/consciousness-class.firebasestorage.app/o/WEB%2Flogo%20consiusness%20class_1.gif?alt=media&token=bbf14d90-4c36-4e2c-9695-39169c145a6b" 
            alt="Cargando..." 
            width={80}  // Ajusta el tamaño según sea necesario
            height={80} // Ajusta el tamaño según sea necesario
            unoptimized // Necesario para GIFs si no quieres optimización de Next/image
            style={{ margin: '0 auto' }}
        />
      </div>
    </div>
  );
}

// New component to handle URL parameters and their effects
function UrlParamEffects() {
  const searchParams = useSearchParams(); 
  const pathname = usePathname();

  useEffect(() => {
    const referralCodeFromUrl = searchParams.get('ref');
    if (referralCodeFromUrl) {
      
      if (referralCodeFromUrl.length > 3 && referralCodeFromUrl.length < 50 && /^[a-zA-Z0-9-_]+$/.test(referralCodeFromUrl)) {
        try {
          localStorage.setItem('referral_code', referralCodeFromUrl);
          console.log(`[UrlParamEffects] Referral code "${referralCodeFromUrl}" from URL saved to localStorage.`);
        } catch (error) {
          console.error("[UrlParamEffects] Error saving referral code to localStorage:", error);
        }
      } else {
        console.warn(`[UrlParamEffects] Invalid referral code format in URL: "${referralCodeFromUrl}". Not saving.`);
      }
    }
  }, [searchParams, pathname]); 

  return null; // This component does not render any UI itself
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Hooks useSearchParams and usePathname are now moved to UrlParamEffects

  return (
    <html lang="es">
      <head>
        <title>Consciousness Class</title>
        <meta name="description" content="Plataforma de Membresías y Cursos Online" />
        <link rel="icon" href="https://firebasestorage.googleapis.com/v0/b/consciousness-class.firebasestorage.app/o/WEB%2Ffavicon.png?alt=media&token=a6df2795-0feb-4bc6-87bd-41a7cdee2c9f" type="image/png" />
      </head>
      <body className={cn(
        "font-body antialiased",
        ptSans.variable,
        playfairDisplay.variable
      )}>
        <AuthProvider>
          <Suspense fallback={<RootLayoutFallback />}>
            <AppLayout>{children}</AppLayout>
            <UrlParamEffects /> {/* Render the new component here, inside Suspense */}
          </Suspense>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
