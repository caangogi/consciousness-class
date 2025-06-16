
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { CheckCircle, Home, BookOpen, Loader2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import type { CourseProperties } from '@/features/course/domain/entities/course.entity';
import type { ModuleProperties } from '@/features/course/domain/entities/module.entity';
import type { LessonProperties } from '@/features/course/domain/entities/lesson.entity';
import { useAuth } from '@/contexts/AuthContext'; 

interface ModuleWithLessons extends ModuleProperties {
  lessons: LessonProperties[];
}

interface CourseStructureData {
  course: CourseProperties;
  modules: ModuleWithLessons[];
}

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const courseId = searchParams.get('courseId');
  const { currentUser, loading: authLoading, refreshUserProfile } = useAuth(); 
  
  const [isLoadingCourseData, setIsLoadingCourseData] = useState(false);
  const [firstLessonId, setFirstLessonId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasRefreshed, setHasRefreshed] = useState(false); 

  const fetchCourseDataForLink = useCallback(async () => {
    if (!courseId) return;
    setIsLoadingCourseData(true);
    setError(null);
    try {
      const response = await fetch(`/api/learn/course-structure/${courseId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Error al cargar datos del curso para el enlace.');
      }
      const data: CourseStructureData = await response.json();
      if (data.modules && data.modules.length > 0 && data.modules[0].lessons && data.modules[0].lessons.length > 0) {
        setFirstLessonId(data.modules[0].lessons[0].id);
      } else {
        console.warn(`Curso ${courseId} no tiene lecciones, no se puede generar enlace directo a la primera lección.`);
        setFirstLessonId('start'); // Fallback to 'start' if no lessons, learn page will handle
      }
    } catch (err: any) {
      setError(err.message);
      console.error("Error fetching course data for success page link:", err);
      setFirstLessonId('start'); 
    } finally {
      setIsLoadingCourseData(false);
    }
  }, [courseId]);

  useEffect(() => {
    console.log(`[PaymentSuccessPage] useEffect triggered. Session: ${sessionId}, Course: ${courseId}, AuthLoading: ${authLoading}, CurrentUser: ${!!currentUser}, HasRefreshed: ${hasRefreshed}`);
    if (sessionId && courseId) {
      if (!authLoading && currentUser && !hasRefreshed) {
        console.log(`[PaymentSuccessPage] Auth loaded and user present (UID: ${currentUser.uid}). Attempting to refresh profile and fetch course data...`);
        setHasRefreshed(true); 
        refreshUserProfile().then(() => {
          console.log("[PaymentSuccessPage] User profile refresh COMPLETED.");
          try {
            localStorage.removeItem('referral_code');
            localStorage.removeItem('promoted_course_id');
            localStorage.removeItem('post_auth_redirect'); // Limpiar también la redirección
            console.log("[PaymentSuccessPage] Referral codes and post_auth_redirect cleared from localStorage after successful payment.");
          } catch (e) {
            console.warn("[PaymentSuccessPage] Could not clear items from localStorage:", e);
          }
          fetchCourseDataForLink(); 
        }).catch(err => {
          console.error("[PaymentSuccessPage] Error refreshing user profile on payment success:", err);
          fetchCourseDataForLink(); 
        });
      } else if (authLoading) {
        console.log("[PaymentSuccessPage] Waiting for auth to load...");
      } else if (!currentUser) {
        console.log("[PaymentSuccessPage] Waiting for user to be present...");
      } else if (hasRefreshed) {
        console.log("[PaymentSuccessPage] Profile already refreshed for this session.");
        if (!firstLessonId && !isLoadingCourseData && !error) { 
            fetchCourseDataForLink();
        }
      }
    } else {
      console.warn('[PaymentSuccessPage] Reached without session_id or courseId.');
      setError("Faltan parámetros para confirmar la compra.");
    }
  }, [sessionId, courseId, currentUser, authLoading, refreshUserProfile, fetchCourseDataForLink, hasRefreshed, firstLessonId, isLoadingCourseData, error]);


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
          {(authLoading && !currentUser) ? ( 
             <p className="text-muted-foreground flex items-center justify-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Verificando tu compra...</p>
          ) : error ? (
            <p className="text-destructive">{error}</p>
          ): (
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
           {courseId && (!authLoading || currentUser) && !error && ( 
             isLoadingCourseData ? (
                <Button disabled>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando curso...
                </Button>
             ) : firstLessonId ? (
                <Button asChild>
                    <Link href={`/learn/${courseId}/${firstLessonId}`}>
                    <BookOpen className="mr-2 h-4 w-4"/> Ir al Curso
                    </Link>
                </Button>
             ) : ( 
                <Button asChild>
                    <Link href={`/courses/${courseId}`}>
                    <BookOpen className="mr-2 h-4 w-4"/> Ver Detalles del Curso
                    </Link>
                </Button>
             )
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
    