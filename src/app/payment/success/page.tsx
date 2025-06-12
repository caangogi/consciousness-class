
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'; // Added CardFooter
import { CheckCircle, Home, BookOpen } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const courseId = searchParams.get('courseId');
  const [isLoading, setIsLoading] = useState(true); // For potential future session verification

  // TODO: In a real scenario, you would verify the session_id with your backend
  // to confirm the payment and then grant access to the course.
  // For now, we just display a success message.

  useEffect(() => {
    if (sessionId && courseId) {
      console.log('Payment success for session:', sessionId, 'and course:', courseId);
      // Here you might trigger a backend call to verify session and enroll user
      // For now, we assume success based on reaching this page with session_id
      setIsLoading(false); 
    } else {
      // Handle missing parameters, though Stripe should always provide session_id
      console.warn('Payment success page reached without session_id or courseId.');
      setIsLoading(false); // Or redirect to an error page
    }
  }, [sessionId, courseId]);


  return (
    <div className="flex min-h-[calc(100vh-theme(spacing.16))] items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-green-500/10 via-background to-background">
      <Card className="w-full max-w-md shadow-xl text-center">
        <CardHeader>
          <div className="mx-auto mb-4 p-3 bg-green-500/10 rounded-full w-fit">
            <CheckCircle className="h-16 w-16 text-green-600" />
          </div>
          <CardTitle className="text-3xl font-headline">¡Pago Exitoso!</CardTitle>
          <CardDescription>
            Gracias por tu compra. Tu acceso al curso se está procesando.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
             <p className="text-muted-foreground">Verificando tu compra...</p>
          ) : (
            <>
                <p className="text-muted-foreground">
                Recibirás un correo electrónico de confirmación en breve. 
                La inscripción al curso se completará automáticamente.
                </p>
                {courseId && (
                    <p className="text-sm text-muted-foreground">
                        ID del Curso: {courseId}
                    </p>
                )}
            </>
          )}
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-3 justify-center">
           {courseId && !isLoading && (
             <Button asChild>
                <Link href={`/learn/${courseId}/start`}> {/* Assuming 'start' or first lesson ID */}
                  <BookOpen className="mr-2 h-4 w-4"/> Ir al Curso
                </Link>
              </Button>
           )}
          <Button variant="outline" asChild>
            <Link href="/dashboard">
              <Home className="mr-2 h-4 w-4"/> Ir al Dashboard
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
