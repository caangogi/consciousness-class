
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/contexts/AuthContext';
import React, { Suspense } from 'react';
import { Leaf } from 'lucide-react';
import { ptSans, poppins } from '@/lib/fonts';
import { cn } from '@/lib/utils';
import { ThemeProvider } from '@/components/shared/ThemeProvider';
import { UrlParamEffects } from '@/components/shared/UrlParamEffects';
import { LayoutWrapper } from '@/components/layout/LayoutWrapper';

export const metadata: Metadata = {
  title: 'Consciousness Class',
  description: 'Plataforma de Membresías y Cursos Online',
  icons: {
    icon: 'https://firebasestorage.googleapis.com/v0/b/consciousness-class.firebasestorage.app/o/WEB%2Ficon.png?alt=media&token=5b954603-a0a1-4b06-9b3e-db85ed6d4728',
  }
};


/**
 * Suspense fallback shown while AuthProvider / UrlParamEffects hydrate
 * on first paint. Kept fully self-contained (inline styles + an inline
 * SVG via lucide-react) so that:
 *
 *   - It renders correctly even if Tailwind's JIT hasn't produced the
 *     final stylesheet yet (defensive — this is the *very* first
 *     element painted after the HTML shell).
 *   - It does NOT fetch a logo asset from Firebase Storage. The old
 *     implementation pulled an `<Image>` from the project bucket; with
 *     billing inactive in production that request 402'd and the
 *     fallback rendered with a broken image during the entire
 *     hydration window. Inline SVG is zero-network.
 */
function RootLayoutFallback() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'sans-serif', backgroundColor: 'hsl(var(--secondary))', color: 'hsl(var(--foreground))' }}>
      <div style={{ textAlign: 'center', padding: '30px 24px', borderRadius: '16px', boxShadow: '0 6px 20px rgba(0,0,0,0.08)', backgroundColor: 'hsl(var(--card))', maxWidth: '320px' }}>
        <div
          style={{
            // Inline hex (not a Tailwind class) so the fallback paints
            // correctly even before Tailwind's JIT stylesheet attaches.
            // Hex must stay in sync with tailwind.config.ts → theme
            // .extend.colors.brand.terracotta (#AD7556).
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 56,
            height: 56,
            borderRadius: '16px',
            backgroundColor: 'rgba(173, 117, 86, 0.15)',
            color: '#AD7556',
            marginBottom: '16px',
          }}
          aria-hidden="true"
        >
          <Leaf style={{ width: 28, height: 28 }} />
        </div>
        <h2 style={{ fontSize: '1.4em', fontWeight: 600, marginBottom: '8px', color: 'hsl(var(--foreground))' }}>
          Cargando…
        </h2>
        <p style={{ fontSize: '0.9em', color: 'hsl(var(--muted-foreground))', margin: 0 }}>
          Estamos preparando la página.
        </p>
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
              <LayoutWrapper>
                {children}
              </LayoutWrapper>
              <UrlParamEffects />
            </Suspense>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
