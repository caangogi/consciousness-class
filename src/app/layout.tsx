
import type { Metadata } from 'next';
import './globals.css';
import { AppLayout } from '@/components/layout/AppLayout';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/contexts/AuthContext';
import React, { Suspense } from 'react';
import Image from 'next/image';
import { ptSans, poppins } from '@/lib/fonts';
import { cn } from '@/lib/utils';
import { ThemeProvider } from '@/components/shared/ThemeProvider';
import { UrlParamEffects } from '@/components/shared/UrlParamEffects';

export const metadata: Metadata = {
  title: 'Consciousness Class',
  description: 'Plataforma de Membresías y Cursos Online',
  icons: {
    icon: 'https://firebasestorage.googleapis.com/v0/b/consciousness-class.firebasestorage.app/o/WEB%2Ficon.png?alt=media&token=5b954603-a0a1-4b06-9b3e-db85ed6d4728',
  }
};


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
            src="https://firebasestorage.googleapis.com/v0/b/consciousness-class.firebasestorage.app/o/WEB%2Ficon.png?alt=media&token=5b954603-a0a1-4b06-9b3e-db85ed6d4728" 
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


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={cn(
        "font-body antialiased",
        ptSans.variable,
        poppins.variable
      )}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <Suspense fallback={<RootLayoutFallback />}>
              <AppLayout>{children}</AppLayout>
              <UrlParamEffects />
            </Suspense>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
