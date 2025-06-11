
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CheckCircle, ChevronLeft, ChevronRight, Download, FileText, MessageSquare, PlayCircle, Info, HelpCircle, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import type { CourseProperties } from '@/features/course/domain/entities/course.entity';
import type { ModuleProperties } from '@/features/course/domain/entities/module.entity';
import type { LessonProperties } from '@/features/course/domain/entities/lesson.entity';
import { Skeleton } from '@/components/ui/skeleton';

interface ModuleWithLessons extends ModuleProperties {
  lessons: LessonProperties[];
}

interface CourseStructure {
  course: CourseProperties;
  modules: ModuleWithLessons[];
}

const lessonCommentsPlaceholder = [
  { id: 'c1', user: { name: 'Alice Wonder', avatar: 'https://placehold.co/40x40.png?text=AW' }, text: '¡Gran explicación! Me quedó todo muy claro.', date: 'Hace 2 días' },
  { id: 'c2', user: { name: 'Bob Builder', avatar: 'https://placehold.co/40x40.png?text=BB' }, text: '¿Podrías dar un ejemplo de cómo aplicar esto en un proyecto real con autenticación?', date: 'Hace 1 día' },
];

export default function LessonPage() {
  const params = useParams<{ courseId: string; lessonId: string }>();
  const router = useRouter();

  const [courseStructure, setCourseStructure] = useState<CourseStructure | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());

  const [currentModule, setCurrentModule] = useState<ModuleWithLessons | null>(null);
  const [currentLesson, setCurrentLesson] = useState<LessonProperties | null>(null);
  const [prevLesson, setPrevLesson] = useState<LessonProperties | null>(null);
  const [nextLesson, setNextLesson] = useState<LessonProperties | null>(null);
  const [flatLessons, setFlatLessons] = useState<LessonProperties[]>([]);
  const [courseProgress, setCourseProgress] = useState(0);

  const fetchCourseStructure = useCallback(async () => {
    if (!params.courseId) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/learn/course-structure/${params.courseId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Failed to fetch course structure');
      }
      const data: CourseStructure = await response.json();
      setCourseStructure(data);
    } catch (err: any) {
      setError(err.message);
      console.error("Error fetching course structure:", err);
    } finally {
      setIsLoading(false);
    }
  }, [params.courseId]);

  useEffect(() => {
    fetchCourseStructure();
  }, [fetchCourseStructure]);

  useEffect(() => {
    if (!courseStructure || !params.lessonId) return;

    const allLessons: LessonProperties[] = [];
    let foundModule: ModuleWithLessons | null = null;
    let foundLesson: LessonProperties | null = null;

    for (const mod of courseStructure.modules) {
      for (const less of mod.lessons) {
        allLessons.push(less);
        if (less.id === params.lessonId) {
          foundModule = mod;
          foundLesson = less;
        }
      }
    }

    setFlatLessons(allLessons);
    setCurrentModule(foundModule);
    setCurrentLesson(foundLesson);

    if (foundLesson) {
      const currentIndex = allLessons.findIndex(l => l.id === foundLesson.id);
      setPrevLesson(currentIndex > 0 ? allLessons[currentIndex - 1] : null);
      setNextLesson(currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null);
    } else {
      // Handle lesson not found, maybe redirect or show error
      console.warn(`Lesson with ID ${params.lessonId} not found in course structure.`);
      // Potentially redirect to course page or first lesson if lessonId is invalid
      // For now, just setting to null which will result in "Lección no encontrada"
      setPrevLesson(null);
      setNextLesson(null);
    }
  }, [courseStructure, params.lessonId]);

  useEffect(() => {
    if (flatLessons.length > 0) {
      const completedCount = completedLessons.size;
      setCourseProgress(Math.round((completedCount / flatLessons.length) * 100));
    } else {
      setCourseProgress(0);
    }
  }, [completedLessons, flatLessons]);


  const toggleLessonComplete = () => {
    if (!currentLesson) return;
    setCompletedLessons(prev => {
      const newSet = new Set(prev);
      if (newSet.has(currentLesson.id)) {
        newSet.delete(currentLesson.id);
      } else {
        newSet.add(currentLesson.id);
      }
      return newSet;
    });
    // TODO: Persist this change to backend
  };
  
  const isCurrentLessonCompleted = currentLesson ? completedLessons.has(currentLesson.id) : false;

  const renderContent = () => {
    if (!currentLesson || !currentLesson.contenidoPrincipal) {
        return <div className="p-6 bg-card rounded-lg shadow-md">Selecciona una lección para ver su contenido.</div>;
    }

    const { tipo, url, texto } = currentLesson.contenidoPrincipal;

    switch (tipo) {
      case 'video':
        if (!url) return <div className="p-6 bg-card rounded-lg shadow-md text-muted-foreground">URL del video no disponible.</div>;
        if (url.includes('youtube.com/embed') || url.includes('player.vimeo.com/video')) {
             return (
                <div className="aspect-video bg-black rounded-lg overflow-hidden shadow-2xl">
                    <iframe width="100%" height="100%" src={url} title={currentLesson.nombre} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen className="border-0"></iframe>
                </div>
            );
        }
        return (
            <div className="aspect-video bg-black rounded-lg overflow-hidden shadow-2xl">
                <video controls src={url} className="w-full h-full"><track kind="captions" /></video>
            </div>
        );
      case 'pdf':
      case 'documento_pdf': // Handle both cases if data might have this
        if (!url) return <div className="p-6 bg-card rounded-lg shadow-md text-muted-foreground">URL del PDF no disponible.</div>;
        return (
          <div className="h-[70vh] md:h-[calc(100vh-250px)] bg-muted rounded-lg shadow-inner">
            <iframe src={url} width="100%" height="100%" className="border-0 rounded-lg" title={currentLesson.nombre}/>
          </div>
        );
      case 'audio':
        if (!url) return <div className="p-6 bg-card rounded-lg shadow-md text-muted-foreground">URL del audio no disponible.</div>;
        return (
          <div className="p-6 bg-card rounded-lg shadow-md flex flex-col items-center">
             <h3 className="text-xl font-semibold mb-4">{currentLesson.nombre}</h3>
            <audio controls src={url} className="w-full max-w-md"><track kind="captions" /></audio>
          </div>
        );
      case 'texto_rico':
        if (!texto) return <div className="p-6 bg-card rounded-lg shadow-md text-muted-foreground">Contenido de texto no disponible.</div>;
        return (
          <Card>
            <CardContent className="p-6 prose max-w-none" dangerouslySetInnerHTML={{ __html: texto }} />
          </Card>
        );
      case 'quiz':
         if (!texto) return <div className="p-6 bg-card rounded-lg shadow-md text-muted-foreground">Contenido del quiz no disponible.</div>;
         return (
          <Card>
            <CardHeader><CardTitle>Quiz: {currentLesson.nombre}</CardTitle></CardHeader>
            <CardContent className="p-6 whitespace-pre-wrap bg-secondary/30 rounded-b-md">{texto}</CardContent>
          </Card>
        );
      default:
        return <div className="p-6 bg-card rounded-lg shadow-md">Contenido de la lección ({tipo}) no soportado o no disponible.</div>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-theme(spacing.16))] bg-background">
        <Skeleton className="w-full md:w-80 lg:w-96 border-r bg-card hidden md:block p-4 space-y-4">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-2 w-5/6 mb-4" />
            {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-6 w-5/6 ml-4" />
                    <Skeleton className="h-6 w-5/6 ml-4" />
                </div>
            ))}
        </Skeleton>
        <div className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10 space-y-6">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="aspect-video w-full" />
            <div className="flex justify-between">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-40" />
            </div>
            <Skeleton className="h-10 w-full" /> 
             <Skeleton className="h-40 w-full" /> 
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="container py-8 text-center text-destructive">Error al cargar el curso: {error}. <Button onClick={fetchCourseStructure}>Reintentar</Button></div>;
  }

  if (!courseStructure || !currentLesson || !currentModule) {
    return <div className="container py-8 text-center">Lección no encontrada o curso no válido.</div>;
  }

  return (
    <div className="flex h-[calc(100vh-theme(spacing.16))] bg-background">
      <ScrollArea className="w-full md:w-80 lg:w-96 border-r bg-card hidden md:block">
        <div className="p-4">
          <Link href={`/courses/${courseStructure.course.id}`} className="hover:text-primary">
            <h2 className="text-lg font-semibold mb-1 font-headline truncate" title={courseStructure.course.nombre}>{courseStructure.course.nombre}</h2>
          </Link>
          <p className="text-xs text-muted-foreground mb-1">Tu Progreso: {completedLessons.size} / {flatLessons.length} lecciones</p>
          <Progress value={courseProgress} className="h-2 mb-4" />
        </div>
        <Accordion type="multiple" defaultValue={[`module-${currentModule.id}`]} className="w-full px-2">
          {courseStructure.modules.map((moduleItem) => (
            <AccordionItem value={`module-${moduleItem.id}`} key={moduleItem.id} className="border-b-0 mb-1">
              <AccordionTrigger className="px-2 py-3 text-sm font-semibold hover:no-underline hover:bg-secondary/50 rounded-md text-left">
                {moduleItem.nombre}
              </AccordionTrigger>
              <AccordionContent className="pt-1 pb-0">
                <ul className="space-y-1 pl-2 border-l-2 border-primary/20 ml-2">
                  {moduleItem.lessons.map((lesson) => (
                    <li key={lesson.id}>
                      <Link href={`/learn/${params.courseId}/${lesson.id}`} passHref>
                        <Button
                          variant="ghost"
                          className={`w-full justify-start text-left h-auto py-2 px-2 text-xs ${
                            lesson.id === currentLesson.id ? 'bg-primary/10 text-primary font-medium' : 'text-foreground/80 hover:bg-secondary/30 hover:text-primary/90'
                          } ${completedLessons.has(lesson.id) ? 'line-through text-muted-foreground/70' : ''}`}
                        >
                          {lesson.contenidoPrincipal.tipo === 'video' ? <PlayCircle className="h-4 w-4 mr-2 shrink-0" /> : <FileText className="h-4 w-4 mr-2 shrink-0" />}
                          <span className="flex-grow truncate mr-2">{lesson.nombre}</span>
                          {completedLessons.has(lesson.id) && <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />}
                        </Button>
                      </Link>
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </ScrollArea>

      <ScrollArea className="flex-1">
        <div className="p-4 sm:p-6 md:p-8 lg:p-10">
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold font-headline mb-2">{currentLesson.nombre}</h1>
            <p className="text-sm text-muted-foreground">Módulo: {currentModule.nombre} &bull; Duración: {currentLesson.duracionEstimada}</p>
          </div>

          {renderContent()}

          <div className="mt-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 py-4 border-t border-b">
            <div className="flex gap-2">
              {prevLesson && (
                <Button variant="outline" asChild>
                  <Link href={`/learn/${params.courseId}/${prevLesson.id}`}>
                    <ChevronLeft className="h-4 w-4 mr-2" /> Anterior
                  </Link>
                </Button>
              )}
              {nextLesson && (
                <Button variant="default" asChild>
                  <Link href={`/learn/${params.courseId}/${nextLesson.id}`}>
                    Siguiente <ChevronRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              )}
            </div>
            <Button 
              onClick={toggleLessonComplete}
              variant={isCurrentLessonCompleted ? "secondary" : "default"}
              className={`w-full md:w-auto ${isCurrentLessonCompleted ? 'bg-green-500/20 hover:bg-green-500/30 text-green-700 border border-green-500/50' : ''}`}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {isCurrentLessonCompleted ? 'Lección Completada' : 'Marcar como Completada'}
            </Button>
          </div>

          <Tabs defaultValue="description" className="mt-8">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-4">
              <TabsTrigger value="description"><Info className="h-4 w-4 mr-1 md:mr-2" />Descripción</TabsTrigger>
              <TabsTrigger value="materials"><Download className="h-4 w-4 mr-1 md:mr-2" />Materiales</TabsTrigger>
              <TabsTrigger value="q&a"><HelpCircle className="h-4 w-4 mr-1 md:mr-2" />Preguntas</TabsTrigger>
              <TabsTrigger value="comments"><MessageSquare className="h-4 w-4 mr-1 md:mr-2" />Comentarios</TabsTrigger>
            </TabsList>
            <TabsContent value="description">
              <Card>
                <CardContent className="p-6 text-foreground/80">
                  <p>{currentLesson.descripcionBreve || "No hay descripción disponible para esta lección."}</p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="materials">
              <Card>
                <CardContent className="p-6">
                  {currentLesson.materialesAdicionales && currentLesson.materialesAdicionales.length > 0 ? (
                    <ul className="space-y-3">
                      {currentLesson.materialesAdicionales.map((material, index) => (
                        <li key={index}> {/* Idealmente usar material.id si estuviera disponible */}
                          <Button variant="link" asChild className="p-0 h-auto text-primary hover:underline">
                            <a href={material.url} download target="_blank" rel="noopener noreferrer">
                              <Download className="h-4 w-4 mr-2" /> {material.nombre}
                            </a>
                          </Button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground">No hay materiales adicionales para esta lección.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="q&a">
              <Card>
                <CardHeader>
                  <CardTitle>Preguntas y Respuestas</CardTitle>
                  <CardDescription>Haz tus preguntas o revisa las de otros estudiantes.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea placeholder="Escribe tu pregunta aquí..." className="mb-4" />
                  <Button>Enviar Pregunta</Button>
                  <p className="mt-4 text-muted-foreground text-sm">Aún no hay preguntas para esta lección. ¡Sé el primero!</p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="comments">
              <Card>
                <CardHeader>
                  <CardTitle>Comentarios de la Comunidad</CardTitle>
                  <CardDescription>Comparte tus pensamientos e interactúa con otros.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6 mb-6 max-h-96 overflow-y-auto">
                    {lessonCommentsPlaceholder.map(comment => (
                      <div key={comment.id} className="flex gap-3 p-3 rounded-md border bg-secondary/30">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={comment.user.avatar} alt={comment.user.name} data-ai-hint="user avatar comment" />
                          <AvatarFallback>{comment.user.name.substring(0,1)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-sm">{comment.user.name}</span>
                            <span className="text-xs text-muted-foreground">{comment.date}</span>
                          </div>
                          <p className="text-sm text-foreground/90 mt-0.5">{comment.text}</p>
                        </div>
                      </div>
                    ))}
                    {lessonCommentsPlaceholder.length === 0 && <p className="text-muted-foreground text-sm">Aún no hay comentarios. ¡Sé el primero en comentar!</p>}
                  </div>
                  <Textarea placeholder="Escribe tu comentario..." className="mb-4" />
                  <Button>Publicar Comentario</Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </div>
  );
}

    