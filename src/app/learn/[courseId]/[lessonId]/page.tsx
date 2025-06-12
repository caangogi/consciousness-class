
'use client';

import { useState, useEffect, useCallback }
from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CheckCircle, ChevronLeft, ChevronRight, Download, FileText, MessageSquare, PlayCircle, Info, HelpCircle, Loader2, AlertTriangle, Menu } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import type { CourseProperties } from '@/features/course/domain/entities/course.entity';
import type { ModuleProperties } from '@/features/course/domain/entities/module.entity';
import type { LessonProperties } from '@/features/course/domain/entities/lesson.entity';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'; // Added SheetHeader, SheetTitle, SheetDescription
import { auth } from '@/lib/firebase/config';

interface ModuleWithLessons extends ModuleProperties {
  lessons: LessonProperties[];
}

interface CourseStructureData {
  course: CourseProperties;
  modules: ModuleWithLessons[];
}

export default function LessonPage() {
  const params = useParams<{ courseId: string; lessonId: string }>();
  const router = useRouter();
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  
  const [courseStructure, setCourseStructure] = useState<CourseStructureData | null>(null);
  const [currentLesson, setCurrentLesson] = useState<LessonProperties | null>(null);
  const [currentModule, setCurrentModule] = useState<ModuleWithLessons | null>(null);
  
  const [prevLesson, setPrevLesson] = useState<LessonProperties | null>(null);
  const [nextLesson, setNextLesson] = useState<LessonProperties | null>(null);

  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [isTogglingCompletion, setIsTogglingCompletion] = useState(false);

  const [isInitialCourseLoad, setIsInitialCourseLoad] = useState(true);
  const [isLoadingLessonContent, setIsLoadingLessonContent] = useState(false);
  const [courseLoadError, setCourseLoadError] = useState<string | null>(null);

  const getFlatLessons = useCallback((structure: CourseStructureData | null): LessonProperties[] => {
    if (!structure) return [];
    return structure.modules.reduce((acc, moduleItem) => acc.concat(moduleItem.lessons), [] as LessonProperties[]);
  }, []);

  const fetchCourseStructureData = useCallback(async (courseIdToFetch: string) => {
    if (!courseIdToFetch) return;
    console.log(`[LessonPage] Fetching course structure for ${courseIdToFetch}`);
    
    // No resetear courseStructure aquí si es el mismo courseId, solo si isInitialCourseLoad es true
    // Esto se maneja en el useEffect que llama a esta función.

    try {
      const response = await fetch(`/api/learn/course-structure/${courseIdToFetch}`);
      if (!response.ok) {
        const errorData = await response.json();
        console.error("[LessonPage] API error fetching course structure:", errorData);
        throw new Error(errorData.details || errorData.error || 'Error al cargar la estructura del curso');
      }
      const data: CourseStructureData = await response.json();
      console.log("[LessonPage] Course structure data received:", data);
      setCourseStructure(data);
      setCourseLoadError(null); 
    } catch (err: any) {
      console.error("[LessonPage] Error fetching course structure:", err);
      setCourseLoadError(err.message);
      setCourseStructure(null); 
    }
  }, []); // Dependencias mínimas, las lógicas de control están en los useEffect

  const fetchUserProgress = useCallback(async (courseIdToFetch: string) => {
    if (!currentUser || !courseIdToFetch) return;
    console.log(`[LessonPage] Fetching user progress for ${courseIdToFetch}`);
    try {
      const idToken = await auth.currentUser?.getIdToken(true);
      if (!idToken) throw new Error("Token de autenticación no disponible.");
      const response = await fetch(`/api/learn/progress/${courseIdToFetch}`, {
        headers: { 'Authorization': `Bearer ${idToken}` }
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Error al cargar el progreso del usuario');
      }
      const data = await response.json();
      setCompletedLessons(new Set(data.completedLessonIds || []));
    } catch (err: any) {
      console.error("[LessonPage] Error fetching user progress:", err);
      toast({ title: "Error al Cargar Progreso", description: err.message, variant: "destructive" });
    }
  }, [currentUser, toast]);

  // Effect for initial course load or when courseId changes
  useEffect(() => {
    if (params.courseId) {
      console.log(`[LessonPage] Course ID changed or initial load: ${params.courseId}. Setting isInitialCourseLoad to true.`);
      setIsInitialCourseLoad(true);
      setCourseLoadError(null);    
      setCourseStructure(null);    
      setCurrentLesson(null);      
      setCompletedLessons(new Set());

      fetchCourseStructureData(params.courseId);
      if (currentUser) {
        fetchUserProgress(params.courseId);
      }
    }
  }, [params.courseId, currentUser, fetchCourseStructureData, fetchUserProgress]);

  // Effect to mark the end of the initial course load
  useEffect(() => {
    if (courseStructure !== null || courseLoadError !== null) {
      if(isInitialCourseLoad){ // Solo cambiar si realmente era una carga inicial
        console.log("[LessonPage] Course structure or error received. Setting isInitialCourseLoad to false.");
        setIsInitialCourseLoad(false);
      }
    }
  }, [courseStructure, courseLoadError, isInitialCourseLoad]);

  // Effect to update current lesson when lessonId changes or course structure loads (after initial load)
  useEffect(() => {
    if (isInitialCourseLoad || !courseStructure || !params.lessonId) {
      console.log(`[LessonPage] Update current lesson effect: SKIPPING. isInitialCourseLoad: ${isInitialCourseLoad}, courseStructure: ${!!courseStructure}, params.lessonId: ${params.lessonId}`);
      if (!isInitialCourseLoad && courseStructure && !params.lessonId && currentLesson !== null) {
          // Si el curso está cargado pero no hay lessonId (ej. URL base del curso), limpiamos la lección
          setCurrentLesson(null); 
      }
      return;
    }
    
    console.log(`[LessonPage] Update current lesson effect: ACTIVE for lesson ${params.lessonId}. Setting isLoadingLessonContent=true.`);
    setIsLoadingLessonContent(true);

    const flatLessonsArray = getFlatLessons(courseStructure);
    let foundCurrentModule: ModuleWithLessons | null = null;
    let foundCurrentLesson: LessonProperties | null = null;

    for (const moduleItem of courseStructure.modules) {
      const lesson = moduleItem.lessons.find(l => l.id === params.lessonId);
      if (lesson) {
        foundCurrentLesson = lesson;
        foundCurrentModule = moduleItem;
        break; 
      }
    }
    
    setCurrentModule(foundCurrentModule);
    setCurrentLesson(foundCurrentLesson);

    if (foundCurrentLesson) {
      console.log(`[LessonPage] Current lesson set for ${params.lessonId}: ${foundCurrentLesson.nombre}`);
      const currentIndex = flatLessonsArray.findIndex(l => l.id === foundCurrentLesson.id);
      setPrevLesson(currentIndex > 0 ? flatLessonsArray[currentIndex - 1] : null);
      setNextLesson(currentIndex < flatLessonsArray.length - 1 ? flatLessonsArray[currentIndex + 1] : null);
    } else {
      console.warn(`[LessonPage] Lesson with ID ${params.lessonId} NOT found in course structure.`);
      toast({ title: "Lección no Encontrada", description: `No se pudo encontrar la lección con ID ${params.lessonId}`, variant: "destructive" });
      setCurrentLesson(null);
      setPrevLesson(null);
      setNextLesson(null);
    }
    
    // No timeout needed, React handles state updates efficiently
    setIsLoadingLessonContent(false);
    console.log("[LessonPage] isLoadingLessonContent set to false after lesson update.");

  }, [params.lessonId, courseStructure, isInitialCourseLoad, toast, getFlatLessons]);


  const toggleLessonComplete = async () => {
    if (!currentUser || !currentLesson || !courseStructure) return;
    setIsTogglingCompletion(true);
    try {
      const idToken = await auth.currentUser?.getIdToken(true);
      if (!idToken) throw new Error("Token de autenticación no disponible.");

      const totalLessonsInCourse = getFlatLessons(courseStructure).length;

      const response = await fetch(`/api/learn/progress/${params.courseId}/${currentLesson.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ totalLessonsInCourse }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || "Error al actualizar el progreso.");
      }
      
      const updatedProgressData = await response.json();
      setCompletedLessons(prev => {
        const newSet = new Set(prev);
        if (updatedProgressData.lessonIdsCompletadas.includes(currentLesson.id)) {
            newSet.add(currentLesson.id);
        } else {
            newSet.delete(currentLesson.id);
        }
        return newSet;
      });

      toast({
        title: "Progreso Actualizado",
        description: `Lección "${currentLesson.nombre}" marcada.`
      });

    } catch (err: any) {
      toast({ title: "Error al Marcar Lección", description: err.message, variant: "destructive" });
      console.error("Error toggling lesson completion:", err);
    } finally {
      setIsTogglingCompletion(false);
    }
  };
  
  const isCurrentLessonCompleted = currentLesson ? completedLessons.has(currentLesson.id) : false;
  const flatLessonsForProgress = getFlatLessons(courseStructure);
  const courseProgress = flatLessonsForProgress.length > 0 ? Math.round((completedLessons.size / flatLessonsForProgress.length) * 100) : 0;


  const renderLessonContentPlayer = () => {
    if (isLoadingLessonContent) {
        console.log("[LessonPage] Rendering lesson content skeleton (isLoadingLessonContent is true).");
        return <Skeleton className="aspect-video w-full rounded-lg shadow-inner" />;
    }
    if (!currentLesson) {
      console.log("[LessonPage] Rendering 'Select a lesson...' message. (isLoadingLessonContent false)");
      return <div className="p-6 bg-card rounded-lg shadow-md text-muted-foreground flex items-center justify-center h-full">{(isInitialCourseLoad || !courseStructure) ? 'Cargando lección...' : 'Lección no encontrada o selecciona una para comenzar.'}</div>;
    }

    const { tipo, url, texto } = currentLesson.contenidoPrincipal;
    console.log(`[LessonPage] Rendering content for lesson: ${currentLesson.nombre}, type: ${tipo}, url: ${url ? 'present' : 'absent'}, texto: ${texto ? 'present' : 'absent'}`);
    switch (tipo) {
      case 'video':
        if (!url) return <div className="p-6 bg-card rounded-lg shadow-md text-muted-foreground flex items-center justify-center h-full">URL del video no disponible.</div>;
        return <div className="aspect-video bg-black rounded-lg overflow-hidden shadow-xl"><video key={currentLesson.id + url} controls src={url} className="w-full h-full"><track kind="captions" /></video></div>;
      case 'documento_pdf':
        if (!url) return <div className="p-6 bg-card rounded-lg shadow-md text-muted-foreground flex items-center justify-center h-full">URL del PDF no disponible.</div>;
        return <div className="h-[60vh] md:h-[calc(100vh-280px)] bg-muted rounded-lg shadow-inner"><iframe key={currentLesson.id + url} src={url} width="100%" height="100%" className="border-0 rounded-lg" title={currentLesson.nombre}/></div>;
      case 'texto_rico':
        if (!texto) return <div className="p-6 bg-card rounded-lg shadow-md text-muted-foreground flex items-center justify-center h-full">Contenido de texto no disponible.</div>;
        return <Card className="h-full overflow-y-auto shadow-sm"><CardContent className="p-6 prose max-w-none" dangerouslySetInnerHTML={{ __html: texto }} /></Card>;
      default:
        return <div className="p-6 bg-card rounded-lg shadow-md flex items-center justify-center h-full">Contenido no disponible para tipo: {tipo}.</div>;
    }
  };

  const CourseNavigationSidebar = ({ onLessonClick }: { onLessonClick?: () => void }) => {
    if (!courseStructure) { 
      return null; 
    }
    const flatLessonsForSidebar = getFlatLessons(courseStructure);
    return (
      <ScrollArea className="h-full">
        <div className="p-4 sticky top-0 bg-card z-10 border-b">
          <Link href={`/courses/${courseStructure.course.id}`} className="hover:text-primary block group">
            <h2 className="text-lg font-semibold mb-1 font-headline truncate group-hover:text-primary transition-colors" title={courseStructure.course.nombre}>{courseStructure.course.nombre}</h2>
          </Link>
          <p className="text-xs text-muted-foreground mb-1">{completedLessons.size} / {flatLessonsForSidebar.length} lecciones completadas</p>
          <Progress value={courseProgress} className="h-1.5 mb-2" />
        </div>
        <Accordion type="multiple" defaultValue={currentModule ? [`module-${currentModule.id}`] : (courseStructure.modules[0] ? [`module-${courseStructure.modules[0].id}`] : [])} className="w-full px-2 py-2">
          {courseStructure.modules.map((moduleItem) => (
            <AccordionItem value={`module-${moduleItem.id}`} key={moduleItem.id} className="border-b-0 mb-1 rounded-md overflow-hidden bg-secondary/30 hover:bg-secondary/50 transition-colors">
              <AccordionTrigger className="px-3 py-2.5 text-sm font-medium hover:no-underline text-left group data-[state=open]:bg-secondary data-[state=open]:text-primary">
                <span className="truncate flex-1">{moduleItem.nombre}</span>
              </AccordionTrigger>
              <AccordionContent className="pt-0 pb-0 bg-card">
                <ul className="space-y-px py-1">
                  {moduleItem.lessons.map((lesson) => (
                    <li key={lesson.id}>
                      <Link
                          href={`/learn/${params.courseId}/${lesson.id}`}
                          onClick={onLessonClick}
                          className={`flex items-center w-full justify-start text-left h-auto py-2.5 px-3 text-xs group
                          ${lesson.id === currentLesson?.id ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground/80 hover:bg-primary/5 hover:text-primary/90'}
                          ${completedLessons.has(lesson.id) && lesson.id !== currentLesson?.id ? 'text-muted-foreground/70 line-through' : ''}`}
                      >
                        {lesson.contenidoPrincipal.tipo === 'video' ? <PlayCircle className="h-4 w-4 mr-2.5 shrink-0 opacity-70 group-hover:opacity-100" /> : <FileText className="h-4 w-4 mr-2.5 shrink-0 opacity-70 group-hover:opacity-100" />}
                        <span className="flex-grow truncate mr-2">{lesson.nombre}</span>
                        {completedLessons.has(lesson.id) && <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />}
                      </Link>
                    </li>
                  ))}
                   {moduleItem.lessons.length === 0 && <li className="px-3 py-2.5 text-xs text-muted-foreground">No hay lecciones en este módulo.</li>}
                </ul>
              </AccordionContent>
            </AccordionItem>
          ))}
           {courseStructure.modules.length === 0 && <p className="px-3 py-4 text-sm text-muted-foreground">Este curso aún no tiene módulos.</p>}
        </Accordion>
      </ScrollArea>
    );
  };

  if (isInitialCourseLoad) {
    console.log("[LessonPage] Rendering full page skeleton (isInitialCourseLoad is true).");
    return (
      <div className="flex h-screen md:h-[calc(100vh-theme(spacing.16))] bg-background overflow-hidden">
        <aside className="w-72 lg:w-80 border-r bg-card hidden md:flex flex-col p-4 space-y-3">
            <Skeleton className="h-6 w-3/4 mb-1" />
            <Skeleton className="h-3 w-1/2 mb-2" />
            <Skeleton className="h-2 w-full mb-4" />
            {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <div className="pl-4 space-y-1"><Skeleton className="h-6 w-5/6" /><Skeleton className="h-6 w-4/6" /></div>
                </div>
            ))}
        </aside>
        <div className="flex-1 flex flex-col overflow-hidden">
            <header className="md:hidden flex items-center justify-between p-3 border-b bg-card sticky top-0 z-20">
                <div className="flex-1 min-w-0"><Skeleton className="h-5 w-3/5" /> <Skeleton className="h-3 w-2/5 mt-1" /></div>
                <Skeleton className="h-9 w-9 rounded-md" />
            </header>
            <ScrollArea className="flex-1 bg-secondary/30">
                 <div className="max-w-4xl mx-auto p-4 sm:p-6 md:p-8">
                    <div className="mb-4 hidden md:block"><Skeleton className="h-7 w-1/2 mb-1" /><Skeleton className="h-4 w-1/3" /></div>
                    <Skeleton className="aspect-video w-full rounded-lg shadow-inner mb-6" />
                    <div className="mt-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 py-4 border-t">
                        <div className="flex gap-2 w-full md:w-auto"><Skeleton className="h-10 flex-1 md:w-28" /><Skeleton className="h-10 flex-1 md:w-28" /></div>
                        <Skeleton className="h-10 w-full md:w-52" />
                    </div>
                     <Skeleton className="h-10 w-full sm:w-1/2 md:w-1/4 mb-4 rounded-md" /> 
                    <Skeleton className="h-40 w-full rounded-lg" />
                </div>
            </ScrollArea>
        </div>
      </div>
    );
  }
  
  if (courseLoadError) {
    console.error("[LessonPage] Rendering course load error:", courseLoadError);
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-theme(spacing.16))] p-4 text-center">
        <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-destructive mb-2">Error al Cargar el Curso</h2>
        <p className="text-muted-foreground mb-4 max-w-md">{courseLoadError}</p>
        <Button onClick={() => router.push('/courses')}>
          Volver a Cursos
        </Button>
      </div>
    );
  }

  if (!courseStructure) { 
    console.warn("[LessonPage] Rendering loader: No courseStructure (and not initial load or error).");
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Cargando datos del curso...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen md:h-[calc(100vh-theme(spacing.16))] bg-background overflow-hidden">
      <aside className="w-72 lg:w-80 border-r bg-card hidden md:flex flex-col">
        <CourseNavigationSidebar onLessonClick={() => {}} />
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="md:hidden flex items-center justify-between p-3 border-b bg-card sticky top-0 z-20">
           <div className="flex-1 min-w-0">
             <h1 className="text-md font-semibold truncate" title={currentLesson?.nombre || (isLoadingLessonContent ? 'Cargando...' : (courseStructure?.course.nombre ? 'Selecciona lección' : 'Cargando curso...'))}>
               {currentLesson?.nombre || (isLoadingLessonContent ? 'Cargando...' : (courseStructure?.course.nombre ? 'Selecciona lección' : 'Cargando curso...'))}
             </h1>
             <p className="text-xs text-muted-foreground truncate" title={courseStructure?.course.nombre}>{courseStructure?.course.nombre || ''}</p>
           </div>
          <Sheet open={isMobileNavOpen} onOpenChange={setIsMobileNavOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon"> <Menu className="h-5 w-5" /> </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0 flex flex-col">
              <SheetHeader className="sr-only">
                <SheetTitle>Navegación del Curso</SheetTitle>
                <SheetDescription>
                  Lista de módulos y lecciones para el curso actual.
                </SheetDescription>
              </SheetHeader>
              <CourseNavigationSidebar onLessonClick={() => setIsMobileNavOpen(false)} />
            </SheetContent>
          </Sheet>
        </header>

        <ScrollArea className="flex-1 bg-secondary/30">
          <div className="max-w-4xl mx-auto p-4 sm:p-6 md:p-8">
            <div className="mb-4 hidden md:block">
                 <h1 className="text-2xl font-bold font-headline mb-1">{currentLesson?.nombre || (isLoadingLessonContent ? <Skeleton className="h-8 w-3/4" /> : 'Lección no disponible')}</h1>
                 <p className="text-sm text-muted-foreground">Del curso: {courseStructure?.course.nombre || <Skeleton className="h-4 w-1/2" />}</p>
            </div>
            <div className="mb-6 min-h-[250px] md:min-h-[400px] lg:min-h-[500px] flex">
              {renderLessonContentPlayer()}
            </div>

            <div className="mt-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 py-4 border-t">
              <div className="flex gap-2 w-full md:w-auto">
                <Button 
                    variant="outline" 
                    className="flex-1 md:flex-none" 
                    onClick={() => { if(prevLesson) router.push(`/learn/${params.courseId}/${prevLesson.id}`); }}
                    disabled={!prevLesson || isLoadingLessonContent}
                >
                    <ChevronLeft className="h-4 w-4 mr-2" /> Anterior
                </Button>
                <Button 
                    variant="default" 
                    className="flex-1 md:flex-none" 
                    onClick={() => { if(nextLesson) router.push(`/learn/${params.courseId}/${nextLesson.id}`); }}
                    disabled={!nextLesson || isLoadingLessonContent}
                >
                    Siguiente <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
              <Button
                onClick={toggleLessonComplete}
                variant={isCurrentLessonCompleted ? "secondary" : "default"}
                className={`w-full md:w-auto min-w-[200px] ${isCurrentLessonCompleted ? 'bg-green-100 hover:bg-green-200 text-green-700 border border-green-300' : ''}`}
                disabled={isTogglingCompletion || !currentUser || isLoadingLessonContent || !currentLesson}
              >
                {isTogglingCompletion ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <CheckCircle className="h-4 w-4 mr-2" />}
                {isTogglingCompletion ? 'Actualizando...' : (isCurrentLessonCompleted ? 'Lección Completada' : 'Marcar como Completada')}
              </Button>
            </div>

            <Tabs defaultValue="description" className="mt-8">
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-4 bg-card shadow-sm">
                <TabsTrigger value="description" className="text-xs sm:text-sm"><Info className="h-4 w-4 mr-1 md:mr-2" />Descrip.</TabsTrigger>
                <TabsTrigger value="materials" className="text-xs sm:text-sm"><Download className="h-4 w-4 mr-1 md:mr-2" />Materiales</TabsTrigger>
                <TabsTrigger value="q&a" className="text-xs sm:text-sm"><HelpCircle className="h-4 w-4 mr-1 md:mr-2" />Preguntas</TabsTrigger>
                <TabsTrigger value="comments" className="text-xs sm:text-sm"><MessageSquare className="h-4 w-4 mr-1 md:mr-2" />Comentarios</TabsTrigger>
              </TabsList>
              <TabsContent value="description"><Card><CardContent className="p-4 md:p-6 text-sm text-foreground/80"><p>{currentLesson?.descripcionBreve || "Descripción no disponible."}</p></CardContent></Card></TabsContent>
              <TabsContent value="materials"><Card><CardContent className="p-4 md:p-6 text-sm text-muted-foreground">No hay materiales adicionales para esta lección.</CardContent></Card></TabsContent>
              <TabsContent value="q&a"><Card><CardHeader className="pb-4"><CardTitle className="text-lg">Preguntas</CardTitle></CardHeader><CardContent className="p-4 md:p-6"><Textarea placeholder="Escribe tu pregunta..." className="mb-3 text-sm" /><Button size="sm">Enviar</Button></CardContent></Card></TabsContent>
              <TabsContent value="comments"><Card><CardHeader className="pb-4"><CardTitle className="text-lg">Comentarios</CardTitle></CardHeader><CardContent className="p-4 md:p-6"><Textarea placeholder="Escribe tu comentario..." className="mb-3 text-sm" /><Button size="sm">Publicar</Button></CardContent></Card></TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
    
