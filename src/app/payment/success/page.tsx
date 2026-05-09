'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CheckCircle, Home, BookOpen, ArrowRight, Loader2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  // Support both legacy courseId and new catalogItemId
  const catalogItemId = searchParams.get('catalogItemId') || searchParams.get('courseId');
  
  const { currentUser, loading: authLoading, refreshUserProfile } = useAuth();
  const [refreshed, setRefreshed] = useState(false);

  useEffect(() => {
    if (!sessionId || !catalogItemId) return;
    if (!authLoading && currentUser && !refreshed) {
      setRefreshed(true);
      // Refresh so cursosInscritos is up to date in the context
      refreshUserProfile().catch(console.warn);
      // Clear any referral codes stored in localStorage
      try {
        localStorage.removeItem('referral_code');
        localStorage.removeItem('promoted_course_id');
      } catch {}
    }
  }, [sessionId, catalogItemId, authLoading, currentUser, refreshed, refreshUserProfile]);

  const isValid = sessionId && catalogItemId;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-500/10 via-background to-background px-4">
      <div className="w-full max-w-md text-center space-y-6">
        
        {/* Icon */}
        <div className="mx-auto w-24 h-24 rounded-full bg-green-500/10 flex items-center justify-center">
          <CheckCircle className="h-14 w-14 text-green-600" />
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-foreground">¡Pago Exitoso!</h1>
          <p className="text-muted-foreground text-lg">
            Tu acceso se está procesando. En breve podrás acceder al contenido desde tu área privada.
          </p>
        </div>

        {/* Error / Loading state */}
        {!isValid && (
          <p className="text-sm text-muted-foreground bg-secondary/50 rounded-2xl p-4">
            La compra fue registrada. Si no ves el acceso de inmediato, espera unos segundos y recarga tu librería.
          </p>
        )}

        {authLoading && (
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Verificando tu acceso...</span>
          </div>
        )}

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button asChild size="lg" className="rounded-2xl ios-button">
            <Link href="/dashboard/learning">
              <BookOpen className="mr-2 h-5 w-5" /> Ir a mi Librería
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="rounded-2xl">
            <Link href="/products">
              <ArrowRight className="mr-2 h-5 w-5" /> Seguir explorando
            </Link>
          </Button>
        </div>

        <div>
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-1">
            <Home className="h-3 w-3" /> Ir al Dashboard
          </Link>
        </div>

        {/* Debug ID in dev */}
        {process.env.NODE_ENV === 'development' && catalogItemId && (
          <p className="text-[10px] text-muted-foreground/50 font-mono">item: {catalogItemId}</p>
        )}
      </div>
    </div>
  );
}