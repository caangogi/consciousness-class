
'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Star, Users, Clock, CheckCircle, PlayCircle, FileText, Download, MessageSquare, Edit3, Loader2, AlertTriangle, LogIn } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { CourseProperties } from '@/features/course/domain/entities/course.entity';
import type { ModuleProperties } from '@/features/course/domain/entities/module.entity';
import type { LessonProperties } from '@/features/course/domain/entities/lesson.entity';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase/config';


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
  const courseId = params.id;
  const router = useRouter();
  const { currentUser, loading: authLoading, refreshUserProfile } = useAuth();
  const { toast } = useToast();

  const [courseData, setCourseData] = useState<CourseStructureData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isUserEnrolled = currentUser?.cursosInscritos?.includes(courseId) ?? false;

  const fetchCourseData = useCallback(async () => {
    if (!courseId) {
      setError("ID del curso no encontrado en la URL.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/learn/course-structure/${courseId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Error al cargar los datos del curso');
      }
      const data: CourseStructureData = await response.json();
      setCourseData(data);
    } catch (err: any) {
      setError(err.message);
      console.error("Error fetching course data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchCourseData();
  }, [fetchCourseData]);

  const handleEnroll = async () => {
    if (!currentUser || !courseId) {
      toast({ title: "Error", description: "Debes iniciar sesión para inscribirte.", variant: "destructive" });
      router.push(`/login?redirect=/courses/${courseId}`);
      return;
    }
    setIsEnrolling(true);
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
      
      toast({ title: "¡Inscripción Exitosa!", description: `Te has inscrito correctamente en "${courseData?.course.nombre}".` });
      await refreshUserProfile(); // Refresh user profile to get updated cursosInscritos
      // No need to manually set isUserEnrolled, AuthContext update will trigger re-render
    } catch (err: any) {
      toast({ title: "Error de Inscripción", description: err.message, variant: "destructive" });
      console.error("Error enrolling in course:", err);
    } finally {
      setIsEnrolling(false);
    }
  };

  if (isLoading || authLoading) {
    return (
      <div className="bg-secondary/30">
        <div className="bg-primary py-12 md:py-20">
          <div className="container mx-auto px-4 md:px-6 grid md:grid-cols-2 gap-8 items-center">
            <div>
              <Skeleton className="h-6 w-24 mb-2" />
              <Skeleton className="h-10 w-3/4 mb-3" />
              <Skeleton className="h-6 w-full mb-4" />
              <div className="flex items-center space-x-4 mb-6">
                <Skeleton className="h-8 w-8 rounded-full mr-2" /> <Skeleton className="h-4 w-32" />
              </div>
              <div className="flex items-center space-x-4"><Skeleton className="h-4 w-20" /> <Skeleton className="h-4 w-24" /> <Skeleton className="h-4 w-32" /></div>
            </div>
            <Card className="overflow-hidden shadow-2xl">
                <Skeleton className="w-full aspect-video" />
                <CardContent className="p-6 space-y-3">
                    <Skeleton className="h-10 w-1/3" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-4 w-3/4 mx-auto" />
                </CardContent>
            </Card>
          </div>
        </div>
        <div className="container mx-auto px-4 md:px-6 py-12">
          <div className="grid lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-8">
                <Card><CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader><CardContent><Skeleton className="h-24 w-full" /></CardContent></Card>
                <Card><CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader><CardContent><Skeleton className="h-32 w-full" /></CardContent></Card>
                <Card><CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader><CardContent><Skeleton className="h-24 w-full" /></CardContent></Card>
            </div>
            <div className="lg:col-span-1 space-y-8">
                 <Card><CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader><CardContent className="text-center space-y-2"><Skeleton className="h-20 w-20 rounded-full mx-auto"/><Skeleton className="h-5 w-1/2 mx-auto"/><Skeleton className="h-12 w-full"/><Skeleton className="h-9 w-3/4 mx-auto"/></CardContent></Card>
                 <Card><CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader><CardContent><Skeleton className="h-10 w-full" /></CardContent></Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
        <div className="container mx-auto py-12 px-4 md:px-6 text-center">
            <Card className="max-w-md mx-auto shadow-lg">
                <CardHeader>
                    <CardTitle className="text-2xl text-destructive flex items-center justify-center gap-2">
                        <AlertTriangle className="h-8 w-8" /> Error al Cargar
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground mb-4">No pudimos cargar los detalles del curso.</p>
                    <p className="text-sm text-destructive-foreground bg-destructive/10 p-3 rounded-md">{error}</p>
                </CardContent>
                <CardFooter className="flex flex-col gap-3">
                     <Button onClick={fetchCourseData} variant="default" disabled={isLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                        Intentar de Nuevo
                    </Button>
                    <Button variant="outline" asChild>
                        <Link href="/courses">Volver a Cursos</Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
  }

  if (!courseData) {
    return <div className="container py-8 text-center">No se encontraron datos para este curso.</div>;
  }

  const { course, modules } = courseData;

  const creatorDisplay = {
    id: course.creadorUid,
    nombre: `Creator ${course.creadorUid.substring(0, 6)}`, 
    avatarUrl: `https://placehold.co/80x80.png?text=${course.creadorUid.substring(0,2).toUpperCase()}`,
    bio: 'Información del creador no disponible en esta vista.',
  };

  const totalLessons = modules.reduce((acc, mod) => acc + mod.lessons.length, 0);
  const firstLessonId = modules[0]?.lessons[0]?.id || 'start';

  return (
    <div className="bg-secondary/30">
      <div className="bg-primary text-primary-foreground py-12 md:py-20">
        <div className="container mx-auto px-4 md:px-6 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <Badge variant="secondary" className="mb-2 bg-accent text-accent-foreground">{modules.length} Módulos</Badge>
            <h1 className="text-3xl md:text-4xl font-bold font-headline mb-3">{course.nombre}</h1>
            <p className="text-lg text-primary-foreground/90 mb-4">{course.descripcionCorta}</p>
            <div className="flex items-center space-x-4 mb-6 text-sm">
              <div className="flex items-center">
                <Avatar className="h-8 w-8 mr-2 border-2 border-accent">
                  <AvatarImage src={creatorDisplay.avatarUrl} alt={creatorDisplay.nombre} data-ai-hint="instructor avatar" />
                  <AvatarFallback>{creatorDisplay.nombre.substring(0,2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span>Creado por <Link href={`/creators/${creatorDisplay.id}`} className="font-semibold hover:underline">{creatorDisplay.nombre}</Link></span>
              </div>
              <div className="flex items-center">
                <Star className="h-4 w-4 mr-1 text-accent fill-accent" />
                <span>{course.ratingPromedio?.toFixed(1) || 'N/A'} ({course.totalResenas || 0} reseñas)</span>
              </div>
            </div>
            <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center gap-1.5"><Users className="h-4 w-4" /> {course.totalEstudiantes || 0} estudiantes</div>
                <div className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {course.duracionEstimada}</div>
                {course.fechaActualizacion && <div className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4" /> Última actualización: {new Date(course.fechaActualizacion).toLocaleDateString()}</div>}
            </div>
          </div>
          <Card className="overflow-hidden shadow-2xl">
            <Image
              src={course.imagenPortadaUrl || 'https://placehold.co/1200x675.png'}
              alt={`Portada del curso ${course.nombre}`}
              width={1200}
              height={675}
              className="w-full aspect-video object-cover"
              data-ai-hint={course.dataAiHintImagenPortada || 'course detail cover'}
              priority
            />
            <CardContent className="p-6">
              <p className="text-3xl font-bold text-primary mb-4">${course.precio.toFixed(2)}</p>
              {!currentUser ? (
                  <Button size="lg" className="w-full" asChild>
                      <Link href={`/login?redirect=/courses/${courseId}`}>
                          <LogIn className="mr-2 h-5 w-5" /> Iniciar Sesión para Inscribirse
                      </Link>
                  </Button>
              ) : isUserEnrolled ? (
                 <Button size="lg" className="w-full" asChild>
                    <Link href={`/learn/${course.id}/${firstLessonId}`}>Ir al Curso</Link>
                  </Button>
              ) : (
                <Button size="lg" className="w-full" onClick={handleEnroll} disabled={isEnrolling}>
                  {isEnrolling ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                  {isEnrolling ? 'Inscribiendo...' : 'Inscribirse Ahora'}
                </Button>
              )}
              <p className="text-xs text-muted-foreground mt-3 text-center">Acceso de por vida. Certificado de finalización.</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-12">
        <div className="grid lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2">
            <Card className="mb-8 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl font-headline">Descripción del Curso</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none text-foreground/80" dangerouslySetInnerHTML={{ __html: course.descripcionLarga }} />
              </CardContent>
            </Card>

            <Card className="mb-8 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl font-headline">Contenido del Curso</CardTitle>
                <CardDescription>{modules.length} módulos &bull; {totalLessons} lecciones &bull; {course.duracionEstimada} total</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full" defaultValue={modules[0]?.id ? `module-${modules[0].id}` : undefined}>
                  {modules.map((moduleItem) => (
                    <AccordionItem value={`module-${moduleItem.id}`} key={moduleItem.id}>
                      <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                        <div className="flex justify-between w-full items-center pr-2">
                           <span>{moduleItem.orden}. {moduleItem.nombre}</span>
                           <span className="text-sm text-muted-foreground font-normal">{moduleItem.lessons.length} lecciones</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <ul className="space-y-2 pt-2">
                          {moduleItem.lessons.map((leccion) => (
                            <li key={leccion.id} className="flex justify-between items-center p-3 rounded-md hover:bg-secondary/50 transition-colors">
                              <div className="flex items-center">
                                {leccion.contenidoPrincipal.tipo === 'video' ? <PlayCircle className="h-5 w-5 mr-3 text-primary" /> : <FileText className="h-5 w-5 mr-3 text-primary" />}
                                <span className="text-foreground/90">{leccion.nombre}</span>
                                {leccion.esVistaPrevia && <Badge variant="outline" className="ml-2 border-accent text-accent">Vista Previa</Badge>}
                              </div>
                              <span className="text-sm text-muted-foreground">{leccion.duracionEstimada}</span>
                            </li>
                          ))}
                        </ul>
                        {moduleItem.lessons.length === 0 && <p className="text-sm text-muted-foreground p-3">Este módulo aún no tiene lecciones.</p>}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
                 {modules.length === 0 && <p className="text-muted-foreground text-center py-4">Este curso aún no tiene módulos definidos.</p>}
              </CardContent>
            </Card>
            
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl font-headline">Valoraciones y Reseñas</CardTitle>
                <div className="flex items-center mt-2">
                  <Star className="h-6 w-6 text-accent fill-accent mr-1" />
                  <span className="text-2xl font-bold mr-1">{course.ratingPromedio?.toFixed(1) || 'N/A'}</span>
                  <span className="text-muted-foreground">({course.totalResenas || 0} reseñas)</span>
                </div>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="mb-6">
                  <Edit3 className="mr-2 h-4 w-4" /> Escribir una reseña
                </Button>
                <div className="space-y-6">
                  {placeholderReviews.map(comment => (
                    <div key={comment.id} className="flex gap-4">
                      <Avatar>
                        <AvatarImage src={comment.usuario.avatarUrl} alt={comment.usuario.nombre} data-ai-hint="user avatar review"/>
                        <AvatarFallback>{comment.usuario.nombre.substring(0,1)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">{comment.usuario.nombre}</span>
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`h-4 w-4 ${i < comment.rating ? 'text-accent fill-accent' : 'text-muted-foreground/50'}`} />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">{comment.fecha}</p>
                        <p className="text-foreground/80">{comment.texto}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {placeholderReviews.length > 0 && <Button variant="link" className="mt-6 text-primary">Ver todas las reseñas</Button>}
                 {placeholderReviews.length === 0 && <p className="text-muted-foreground text-sm">Aún no hay reseñas para este curso. ¡Sé el primero!</p>}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1 space-y-8">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-headline">Sobre el Creator</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <Avatar className="h-20 w-20 mx-auto mb-3 border-4 border-primary">
                  <AvatarImage src={creatorDisplay.avatarUrl} alt={creatorDisplay.nombre} data-ai-hint="instructor portrait detail"/>
                  <AvatarFallback>{creatorDisplay.nombre.substring(0,2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <h3 className="text-lg font-semibold text-primary">{creatorDisplay.nombre}</h3>
                <p className="text-sm text-muted-foreground mt-2 mb-4">{creatorDisplay.bio}</p>
                <Button variant="outline" asChild>
                  <Link href={`/creators/${creatorDisplay.id}`}>Ver Perfil del Creator</Link>
                </Button>
              </CardContent>
            </Card>

            {course.requisitos && course.requisitos.length > 0 && ( 
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl font-headline">Materiales Adicionales</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {course.requisitos.slice(0,2).map((material, index) => ( 
                      <li key={index}>
                        <Button variant="link" asChild className="p-0 h-auto text-primary hover:underline flex items-center">
                          <Link href="#" download>
                            <Download className="h-4 w-4 mr-2" /> {material} (Ej: Guía PDF)
                          </Link>
                        </Button>
                      </li>
                    ))}
                    {course.requisitos.length === 0 && <p className="text-sm text-muted-foreground">No hay materiales adicionales especificados.</p>}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
