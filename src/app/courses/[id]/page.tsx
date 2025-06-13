
'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Star, Users, Clock, CheckCircle, PlayCircle, FileText, Download, MessageSquare, Edit3, Loader2, AlertTriangle, LogIn, ShoppingCart } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { CourseProperties } from '@/features/course/domain/entities/course.entity';
import type { ModuleProperties } from '@/features/course/domain/entities/module.entity';
import type { LessonProperties } from '@/features/course/domain/entities/lesson.entity';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase/config';
import { motion } from 'framer-motion';

interface ModuleWithLessons extends ModuleProperties {
  lessons: LessonProperties[];
}

interface CourseStructureData {
  course: CourseProperties;
  modules: ModuleWithLessons[];
}

const placeholderReviews = [
  { id: 'c1', usuario: { nombre: 'Carlos S.', avatarUrl: 'https://placehold.co/40x40.png?text=CS' }, texto: '¡Excelente curso! Muy bien explicado y con ejemplos prácticos.', rating: 5, fecha: '2024-07-01' },
  { id: 'c2', usuario: { nombre: 'Laura M.', avatarUrl: 'https://placehold.co/40x40.png?text=LM' }, texto: 'Me ayudó mucho a entender GraphQL. Lo recomiendo.', rating: 5, fecha: '2024-06-28' },
];


export default function CourseDetailPage() {
  const params = useParams<{ id: string }>();
  const courseId = params.id; // courseId se actualiza si params.id cambia
  console.log("[CourseDetailPage] Render. params.id:", params.id, "courseId var:", courseId);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser, loading: authLoading, refreshUserProfile } = useAuth();
  const { toast } = useToast();

  const [courseData, setCourseData] = useState<CourseStructureData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingEnrollment, setIsProcessingEnrollment] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isUserEnrolled = currentUser?.cursosInscritos?.includes(courseId) ?? false;

  useEffect(() => {
    if (searchParams.get('canceled') === 'true') {
      toast({
        title: 'Pago Cancelado',
        description: 'Has cancelado el proceso de pago. Puedes intentarlo de nuevo.',
        variant: 'default',
        duration: 5000,
      });
      // Remove the 'canceled' query param from URL without reloading the page
      router.replace(`/courses/${courseId}`, { scroll: false });
    }
  }, [searchParams, courseId, router, toast]);

  const fetchCourseData = useCallback(async () => {
    // Usa courseId directamente aquí ya que está en el scope del useCallback y sus dependencias.
    if (!courseId) {
      console.warn("[CourseDetailPage] fetchCourseData: courseId is missing. Current params.id:", params.id);
      setError("ID del curso no disponible en la URL.");
      setIsLoading(false);
      setCourseData(null);
      return;
    }
    console.log(`[CourseDetailPage] fetchCourseData called for courseId: ${courseId}`);
    setIsLoading(true);
    setError(null);
    setCourseData(null);

    try {
      const response = await fetch(`/api/learn/course-structure/${courseId}`);
      console.log(`[CourseDetailPage] API response status: ${response.status} for ${courseId}`);
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
          console.error("[CourseDetailPage] API error response data:", errorData);
        } catch (e) {
          console.error("[CourseDetailPage] API error: Could not parse JSON from error response. Status text:", response.statusText);
          errorData = { details: `Error ${response.status}: ${response.statusText}` };
        }
        throw new Error(errorData.details || errorData.error || 'Error al cargar los datos del curso');
      }
      const data: CourseStructureData = await response.json();
      console.log(`[CourseDetailPage] API success response data for ${courseId}:`, data);
      setCourseData(data);
      setError(null);
    } catch (err: any) {
      console.error(`[CourseDetailPage] Error in fetchCourseData for ${courseId}:`, err);
      setError(err.message);
      setCourseData(null);
    } finally {
      console.log(`[CourseDetailPage] fetchCourseData finally block for ${courseId}. Setting isLoading to false.`);
      setIsLoading(false);
    }
  }, [courseId, params.id, toast]); // courseId y params.id como dependencias. toast es estable.


  useEffect(() => {
    console.log("[CourseDetailPage] Main useEffect triggered. Current courseId:", courseId);
    if (courseId) {
        console.log("[CourseDetailPage] Main useEffect: courseId is present, calling fetchCourseData.");
        fetchCourseData();
    } else {
        console.warn("[CourseDetailPage] Main useEffect: courseId is NOT present. Not calling fetchCourseData.");
        setError("El ID del curso no está presente en la URL.");
        setIsLoading(false); // Asegurarse de que isLoading se actualice
        setCourseData(null); // Limpiar datos del curso si no hay ID
    }

    if (currentUser) {
        console.log("[CourseDetailPage] Main useEffect: currentUser is present, calling refreshUserProfile.");
        refreshUserProfile().catch(err => console.error("Failed to refresh user profile on course detail page:", err));
    }
  }, [courseId, fetchCourseData, currentUser, refreshUserProfile]); // refreshUserProfile (estable), fetchCourseData (memoizado)

  const handleFreeEnrollment = async () => {
    if (!currentUser || !courseId || !courseData) {
        toast({ title: "Error", description: "Usuario no autenticado o datos del curso no disponibles.", variant: "destructive" });
        if (!currentUser) router.push(`/login?redirect=/courses/${courseId}`);
        return;
    }
    setIsProcessingEnrollment(true);
    try {
        const idToken = await auth.currentUser?.getIdToken(true);
        if (!idToken) throw new Error("No se pudo obtener el token de autenticación.");

        const response = await fetch(`/api/courses/${courseId}/enroll`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.details || errorData.error || 'Error al inscribirse en el curso.');
        }
        
        toast({ title: "¡Inscripción Exitosa!", description: `Te has inscrito correctamente en "${courseData.course.nombre}".` });
        await refreshUserProfile();
    } catch (err: any) {
        toast({ title: "Error de Inscripción", description: err.message, variant: "destructive" });
        console.error("Error enrolling in free course:", err);
    } finally {
        setIsProcessingEnrollment(false);
    }
  };

  const handlePaidCheckout = async () => {
    if (!currentUser || !courseId || !courseData) {
        toast({ title: "Error", description: "Usuario no autenticado o datos del curso no disponibles.", variant: "destructive" });
        if (!currentUser) router.push(`/login?redirect=/courses/${courseId}`);
        return;
    }
    if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
      toast({ title: "Error de Configuración", description: "La pasarela de pago no está configurada correctamente (Clave Pública).", variant: "destructive" });
      return;
    }
    setIsProcessingPayment(true);
    try {
        const idToken = await auth.currentUser?.getIdToken(true);
        if (!idToken) throw new Error("No se pudo obtener el token de autenticación.");

        const response = await fetch(`/api/checkout/create-session`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            },
            body: JSON.stringify({ courseId }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.details || errorData.error || 'Error al iniciar el proceso de pago.');
        }
        const { sessionId, sessionUrl } = await response.json();
        
        if (!sessionUrl) {
            throw new Error('No se pudo obtener la URL de la sesión de pago.');
        }

        if (window.top && window.top !== window.self) {
            console.log("Attempting to redirect top-level window to Stripe:", sessionUrl);
            window.top.location.href = sessionUrl;
        } else {
            console.log("Attempting to redirect current window to Stripe:", sessionUrl);
            window.location.href = sessionUrl;
        }
        
    } catch (err: any) {
        toast({ title: "Error de Compra", description: err.message, variant: "destructive" });
        console.error("Error processing paid checkout:", err);
    } finally {
        setIsProcessingPayment(false);
    }
  };

  if (isLoading || authLoading) {
    console.log("[CourseDetailPage] Rendering SKELETON. isLoading:", isLoading, "authLoading:", authLoading);
    return (
      <div className="bg-secondary/30 min-h-screen">
        <div className="bg-primary/80 py-16 md:py-24">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid lg:grid-cols-3 gap-8 items-start">
              <div className="lg:col-span-2 space-y-4">
                <Skeleton className="h-6 w-32 rounded-md" /> {/* Badge */}
                <Skeleton className="h-12 w-3/4 rounded-md" /> {/* Title */}
                <Skeleton className="h-20 w-full rounded-md" /> {/* Short Description */}
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <Skeleton className="h-5 w-40 rounded-md" />
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-3 items-center text-sm">
                  <Skeleton className="h-5 w-20 rounded-md" />
                  <Skeleton className="h-5 w-24 rounded-md" />
                  <Skeleton className="h-5 w-28 rounded-md" />
                </div>
              </div>
              <div className="lg:col-span-1">
                <Card className="shadow-xl rounded-lg">
                  <Skeleton className="w-full aspect-video rounded-t-lg" />
                  <CardContent className="p-6 space-y-4">
                    <Skeleton className="h-10 w-1/2 rounded-md" />
                    <Skeleton className="h-12 w-full rounded-md" />
                    <Skeleton className="h-4 w-3/4 mx-auto rounded-md" />
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 md:px-6 py-12">
          <div className="grid lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-8">
              <Card className="shadow-lg rounded-lg"><CardHeader><Skeleton className="h-8 w-1/2 rounded-md" /></CardHeader><CardContent><Skeleton className="h-32 w-full rounded-md" /></CardContent></Card>
              <Card className="shadow-lg rounded-lg"><CardHeader><Skeleton className="h-8 w-1/2 rounded-md" /></CardHeader><CardContent><Skeleton className="h-40 w-full rounded-md" /></CardContent></Card>
            </div>
            <div className="lg:col-span-1 space-y-8">
              <Card className="shadow-lg rounded-lg"><CardHeader><Skeleton className="h-6 w-3/4 rounded-md" /></CardHeader><CardContent className="text-center space-y-3"><Skeleton className="h-20 w-20 rounded-full mx-auto"/><Skeleton className="h-5 w-1/2 mx-auto rounded-md"/><Skeleton className="h-12 w-full rounded-md"/></CardContent></Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    console.log("[CourseDetailPage] Rendering ERROR message:", error);
    return (
        <div className="container mx-auto py-12 px-4 md:px-6 text-center min-h-[60vh] flex items-center justify-center">
            <Card className="max-w-md mx-auto shadow-lg p-6 rounded-xl">
                <CardHeader className="p-0 mb-4">
                    <div className="mx-auto p-3 bg-destructive/10 rounded-full w-fit">
                        <AlertTriangle className="h-12 w-12 text-destructive" />
                    </div>
                    <CardTitle className="text-2xl text-destructive mt-4">Error al Cargar el Curso</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <p className="text-muted-foreground mb-4">No pudimos cargar los detalles de este curso.</p>
                    <p className="text-sm text-destructive-foreground bg-destructive/10 p-3 rounded-md border border-destructive/30">{error}</p>
                </CardContent>
                <CardFooter className="p-0 mt-6 flex flex-col gap-3">
                     <Button onClick={fetchCourseData} variant="default" disabled={isLoading} className="w-full">
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                        Intentar de Nuevo
                    </Button>
                    <Button variant="outline" asChild className="w-full">
                        <Link href="/courses">Volver a Cursos</Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
  }

  if (!courseData) {
    console.log("[CourseDetailPage] Rendering 'No se encontraron datos...' message.");
    // Esto podría ocurrir si fetchCourseData se completa, pero no encuentra datos (o hubo un error seteando error).
    return <div className="container py-12 text-center">No se encontraron datos para este curso o el ID no es válido.</div>;
  }

  const { course, modules } = courseData;
  const totalLessons = modules.reduce((acc, mod) => acc + mod.lessons.length, 0);
  const firstLessonId = modules[0]?.lessons[0]?.id || 'start';
  const isCourseFree = course.precio <= 0;

  const creatorDisplay = {
    id: course.creadorUid,
    nombre: `Creator ${course.creadorUid.substring(0, 6)}`,
    avatarUrl: `https://placehold.co/80x80.png?text=${course.creadorUid.substring(0,2).toUpperCase()}`,
    dataAiHint: "instructor avatar",
    bio: 'Instructor apasionado con experiencia en la industria.',
  };

  const renderActionButton = () => {
    const processing = isProcessingEnrollment || isProcessingPayment;
    const commonButtonClasses = "w-full text-base py-6 rounded-lg shadow-md hover:shadow-lg transition-shadow";

    if (!currentUser) {
        return (
            <Button size="lg" className={commonButtonClasses} asChild>
                <Link href={`/login?redirect=/courses/${courseId}`}>
                    <LogIn className="mr-2 h-5 w-5" /> Iniciar Sesión para Acceder
                </Link>
            </Button>
        );
    }
    if (isUserEnrolled) {
        return (
            <Button size="lg" className={commonButtonClasses} asChild>
               <Link href={`/learn/${course.id}/${firstLessonId}`}>Ir al Curso</Link>
            </Button>
        );
    }
    if (isCourseFree) {
        return (
            <Button size="lg" className={commonButtonClasses} onClick={handleFreeEnrollment} disabled={processing}>
                {processing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CheckCircle className="mr-2 h-5 w-5"/>}
                {processing ? 'Inscribiendo...' : 'Inscribirse Gratis'}
            </Button>
        );
    }
    return (
        <Button size="lg" className={commonButtonClasses} onClick={handlePaidCheckout} disabled={processing}>
             {processing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <ShoppingCart className="mr-2 h-5 w-5"/>}
             {processing ? 'Procesando...' : `Comprar por ${course.precio.toFixed(2)} €`}
        </Button>
    );
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5 } },
  };


  return (
    <motion.div
      className="bg-secondary/30 min-h-screen"
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.1 }}}}
    >
      <motion.div
        className="bg-gradient-to-br from-primary via-primary/90 to-blue-600 text-primary-foreground py-16 md:py-24 shadow-inner"
        variants={itemVariants}
      >
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid lg:grid-cols-3 gap-8 md:gap-12 items-start">
            <motion.div className="lg:col-span-2 space-y-4" variants={itemVariants}>
              <Badge variant="secondary" className="mb-2 bg-accent text-accent-foreground shadow-sm text-sm px-3 py-1">
                {course.categoria}
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold font-headline leading-tight">{course.nombre}</h1>
              <p className="text-lg md:text-xl text-primary-foreground/80 leading-relaxed">{course.descripcionCorta}</p>
              
              <div className="flex items-center space-x-4 pt-2">
                <Avatar className="h-12 w-12 border-2 border-accent shadow-md">
                  <AvatarImage src={creatorDisplay.avatarUrl} alt={creatorDisplay.nombre} data-ai-hint={creatorDisplay.dataAiHint} />
                  <AvatarFallback>{creatorDisplay.nombre.substring(0,2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm">Creado por</p>
                  <Link href={`/creators/${creatorDisplay.id}`} className="font-semibold hover:underline text-lg">{creatorDisplay.nombre}</Link>
                </div>
              </div>

              <div className="flex flex-wrap gap-x-6 gap-y-3 items-center text-sm pt-3 text-primary-foreground/90">
                {course.ratingPromedio !== undefined && (
                  <div className="flex items-center gap-1.5">
                    <Star className="h-5 w-5 text-accent fill-accent" />
                    <span>{course.ratingPromedio.toFixed(1)} ({course.totalResenas || 0} reseñas)</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5"><Users className="h-5 w-5" /> {course.totalEstudiantes || 0} estudiantes</div>
                <div className="flex items-center gap-1.5"><Clock className="h-5 w-5" /> {course.duracionEstimada}</div>
              </div>
            </motion.div>

            <motion.div className="lg:col-span-1 sticky top-24" variants={itemVariants}>
              <Card className="shadow-xl rounded-xl overflow-hidden bg-background text-foreground">
                <motion.div
                  className="relative aspect-video w-full overflow-hidden"
                  whileHover={{ scale: 1.03 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Image
                    src={course.imagenPortadaUrl || 'https://placehold.co/1200x675.png'}
                    alt={`Portada del curso ${course.nombre}`}
                    layout="fill"
                    objectFit="cover"
                    className="transition-transform duration-500 ease-in-out"
                    data-ai-hint={course.dataAiHintImagenPortada || 'course detail cover'}
                    priority
                  />
                </motion.div>
                <CardContent className="p-6 space-y-4">
                  <p className="text-4xl font-bold text-primary">
                      {isCourseFree ? 'Gratis' : `${course.precio.toFixed(2)} €`}
                  </p>
                  {renderActionButton()}
                  <p className="text-xs text-muted-foreground text-center">Garantía de 30 días. Acceso de por vida.</p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </motion.div>

      <div className="container mx-auto px-4 md:px-6 py-12">
        <div className="grid lg:grid-cols-3 gap-12">
          <motion.div className="lg:col-span-2 space-y-10" variants={itemVariants}>
            <Card className="shadow-lg rounded-xl">
              <CardHeader>
                <CardTitle className="text-2xl md:text-3xl font-headline">Descripción del Curso</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none text-foreground/80" dangerouslySetInnerHTML={{ __html: course.descripcionLarga }} />
              </CardContent>
            </Card>

            <Card className="shadow-lg rounded-xl">
              <CardHeader>
                <CardTitle className="text-2xl md:text-3xl font-headline">Contenido del Curso</CardTitle>
                <CardDescription className="text-base">{modules.length} módulos &bull; {totalLessons} lecciones &bull; {course.duracionEstimada} en total</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full" defaultValue={modules[0]?.id ? `module-${modules[0].id}` : undefined}>
                  {modules.map((moduleItem, index) => (
                    <AccordionItem value={`module-${moduleItem.id}`} key={moduleItem.id} className="border-b last:border-b-0">
                      <AccordionTrigger className="text-lg hover:no-underline py-4 px-1 group">
                        <div className="flex justify-between w-full items-center">
                           <span className="font-semibold text-foreground/90 group-hover:text-primary transition-colors">{moduleItem.orden}. {moduleItem.nombre}</span>
                           <span className="text-sm text-muted-foreground font-normal mr-2">{moduleItem.lessons.length} lecciones</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="bg-secondary/30 rounded-b-md">
                        <ul className="space-y-1 p-3">
                          {moduleItem.lessons.map((leccion) => (
                            <li key={leccion.id} className="flex justify-between items-center p-3 rounded-md hover:bg-background/50 transition-colors text-sm">
                              <div className="flex items-center">
                                {leccion.contenidoPrincipal.tipo === 'video' ? <PlayCircle className="h-5 w-5 mr-3 text-primary/80" /> : <FileText className="h-5 w-5 mr-3 text-primary/80" />}
                                <span className="text-foreground/80">{leccion.nombre}</span>
                                {leccion.esVistaPrevia && <Badge variant="outline" className="ml-2 border-accent text-accent text-xs px-1.5 py-0.5">Vista Previa</Badge>}
                              </div>
                              <span className="text-muted-foreground">{leccion.duracionEstimada}</span>
                            </li>
                          ))}
                        </ul>
                        {moduleItem.lessons.length === 0 && <p className="text-sm text-muted-foreground p-4">Este módulo aún no tiene lecciones.</p>}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
                 {modules.length === 0 && <p className="text-muted-foreground text-center py-6">Este curso aún no tiene módulos definidos.</p>}
              </CardContent>
            </Card>
            
            <Card className="shadow-lg rounded-xl">
              <CardHeader>
                <CardTitle className="text-2xl md:text-3xl font-headline">Valoraciones y Reseñas</CardTitle>
                <div className="flex items-center mt-2">
                  <Star className="h-7 w-7 text-accent fill-accent mr-1.5" />
                  <span className="text-3xl font-bold mr-2">{course.ratingPromedio?.toFixed(1) || 'N/A'}</span>
                  <span className="text-muted-foreground text-base">({course.totalResenas || 0} reseñas)</span>
                </div>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="mb-6 shadow-sm">
                  <Edit3 className="mr-2 h-4 w-4" /> Escribir una reseña
                </Button>
                <div className="space-y-6">
                  {placeholderReviews.map(comment => (
                    <div key={comment.id} className="flex gap-4 p-4 border rounded-lg bg-secondary/30 shadow-sm">
                      <Avatar className="h-11 w-11">
                        <AvatarImage src={comment.usuario.avatarUrl} alt={comment.usuario.nombre} data-ai-hint="user avatar review"/>
                        <AvatarFallback>{comment.usuario.nombre.substring(0,1)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-md">{comment.usuario.nombre}</span>
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`h-4 w-4 ${i < comment.rating ? 'text-accent fill-accent' : 'text-muted-foreground/30'}`} />
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mb-1.5">{comment.fecha}</p>
                        <p className="text-foreground/80 text-sm">{comment.texto}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {placeholderReviews.length > 0 && <Button variant="link" className="mt-6 text-primary px-0">Ver todas las reseñas</Button>}
                 {placeholderReviews.length === 0 && <p className="text-muted-foreground text-sm py-4">Aún no hay reseñas para este curso. ¡Sé el primero!</p>}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div className="lg:col-span-1 space-y-10" variants={itemVariants}>
            <Card className="shadow-lg rounded-xl sticky top-24">
              <CardHeader>
                <CardTitle className="text-xl font-headline">Sobre el Creator</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <Avatar className="h-24 w-24 mx-auto mb-4 border-4 border-primary shadow-md">
                  <AvatarImage src={creatorDisplay.avatarUrl} alt={creatorDisplay.nombre} data-ai-hint={creatorDisplay.dataAiHint}/>
                  <AvatarFallback>{creatorDisplay.nombre.substring(0,2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <h3 className="text-xl font-semibold text-primary mb-1">{creatorDisplay.nombre}</h3>
                <p className="text-sm text-muted-foreground mt-2 mb-4 px-2">{creatorDisplay.bio}</p>
                <Button variant="outline" asChild className="w-full shadow-sm">
                  <Link href={`/creators/${creatorDisplay.id}`}>Ver Perfil del Creator</Link>
                </Button>
              </CardContent>
            </Card>

            {course.requisitos && course.requisitos.length > 0 && (
              <Card className="shadow-lg rounded-xl">
                <CardHeader>
                  <CardTitle className="text-xl font-headline">Materiales Adicionales</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2.5">
                    {course.requisitos.map((material, index) => (
                      <li key={index}>
                        <Button variant="link" asChild className="p-0 h-auto text-primary hover:underline flex items-center text-sm">
                          <Link href="#" download>
                            <Download className="h-4 w-4 mr-2 shrink-0" /> {material} (Ej: Guía PDF)
                          </Link>
                        </Button>
                      </li>
                    ))}
                  </ul>
                   {course.requisitos.length === 0 && <p className="text-sm text-muted-foreground">No hay materiales adicionales especificados.</p>}
                </CardContent>
              </Card>
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

    