
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
import { CheckCircle, ChevronLeft, ChevronRight, Download, FileText, MessageSquare, PlayCircle, Info, HelpCircle, Loader2, AlertTriangle, Menu } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import type { CourseProperties } from '@/features/course/domain/entities/course.entity';
import type { ModuleProperties } from '@/features/course/domain/entities/module.entity';
import type { LessonProperties } from '@/features/course/domain/entities/lesson.entity';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase/config';
// import type { UserCourseProgressProperties } from '@/features/progress/domain/entities/user-course-progress.entity';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

interface ModuleWithLessons extends ModuleProperties {
  lessons: LessonProperties[];
}

interface CourseStructureData {
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
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const [courseStructure, setCourseStructure] = useState<CourseStructureData | null>(null);
  const [isLoadingCourse, setIsLoadingCourse] = useState(true);
  const [isLoadingProgress, setIsLoadingProgress] = useState(true);
  const [isTogglingCompletion, setIsTogglingCompletion] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [currentModule, setCurrentModule] = useState<ModuleWithLessons | null>(null);
  const [currentLesson, setCurrentLesson] = useState<LessonProperties | null>(null);
  const [prevLesson, setPrevLesson] = useState<LessonProperties | null>(null);
  const [nextLesson, setNextLesson] = useState<LessonProperties | null>(null);
  const [flatLessons, setFlatLessons] = useState<LessonProperties[]>([]);
  const [courseProgress, setCourseProgress] = useState(0);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);


  // SIMPLIFIED DATA FETCHING FOR DEBUGGING NAVIGATION
  const fetchCourseStructureData = useCallback(async () => {
    if (!params.courseId) return;
    setIsLoadingCourse(true);
    setError(null);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 50));

    try {
        const placeholderCourse: CourseProperties = {
            id: params.courseId,
            nombre: "Curso de Prueba (Simplificado)",
            descripcionCorta: "Descripción corta del curso simplificado.",
            descripcionLarga: "<p>Descripción larga y detallada del curso simplificado.</p>",
            precio: 0,
            tipoAcceso: 'unico',
            duracionEstimada: "1h",
            categoria: "Test",
            creadorUid: "testUser",
            estado: 'publicado',
            fechaCreacion: new Date().toISOString(),
            fechaActualizacion: new Date().toISOString(),
            imagenPortadaUrl: 'https://placehold.co/600x400.png',
            dataAiHintImagenPortada: 'course example',
            ordenModulos: ["mod1_simulated_module_xyz"],
        };

        const lessonsForModule: LessonProperties[] = [];
        const currentLessonIdInParams = params.lessonId || "sim_placeholder_lesson_001";
        
        // Add the "current" lesson. If params.lessonId is not defined, use a default.
        lessonsForModule.push({ 
            id: currentLessonIdInParams, 
            moduleId: "mod1_simulated_module_xyz", 
            courseId: params.courseId, 
            nombre: `Lección Actual (${currentLessonIdInParams})`, 
            duracionEstimada: "10m", 
            esVistaPrevia: false, 
            orden: 1, 
            fechaCreacion: new Date().toISOString(), 
            fechaActualizacion: new Date().toISOString(), 
            contenidoPrincipal: { tipo: 'texto_rico', texto: `<p>Contenido simulado para la lección: ${currentLessonIdInParams}.</p>`} 
        });

        // Add a second, distinct lesson. Ensure its ID is different from currentLessonIdInParams.
        const secondLessonStaticId = "sim_placeholder_lesson_002";
        if (currentLessonIdInParams !== secondLessonStaticId) {
            lessonsForModule.push({
                id: secondLessonStaticId,
                moduleId: "mod1_simulated_module_xyz",
                courseId: params.courseId,
                nombre: "Siguiente Lección (Simulada)",
                duracionEstimada: "5m", 
                esVistaPrevia: false, 
                orden: 2, 
                fechaCreacion: new Date().toISOString(), 
                fechaActualizacion: new Date().toISOString(), 
                contenidoPrincipal: { tipo: 'texto_rico', texto: '<p>Contenido para la segunda lección simulada.</p>'}
            });
        } else {
            // If params.lessonId happens to be "sim_placeholder_lesson_002", create a different ID for this 'next' lesson
             lessonsForModule.push({
                id: "sim_placeholder_lesson_003_alt", // A different unique ID
                moduleId: "mod1_simulated_module_xyz",
                courseId: params.courseId,
                nombre: "Siguiente Lección (Simulada Alternativa)",
                duracionEstimada: "7m", 
                esVistaPrevia: false, 
                orden: 2, 
                fechaCreacion: new Date().toISOString(), 
                fechaActualizacion: new Date().toISOString(), 
                contenidoPrincipal: { tipo: 'texto_rico', texto: '<p>Contenido para la lección simulada alternativa.</p>'}
            });
        }
        
        // Ensure lessons are sorted by order for flatLessons consistency
        lessonsForModule.sort((a, b) => a.orden - b.orden);
        
        const placeholderModule: ModuleWithLessons = {
            id: "mod1_simulated_module_xyz",
            courseId: params.courseId,
            nombre: "Módulo Simulado Único",
            orden: 1,
            fechaCreacion: new Date().toISOString(),
            fechaActualizacion: new Date().toISOString(),
            lessons: lessonsForModule,
            ordenLecciones: lessonsForModule.map(l => l.id),
        };
        
        setCourseStructure({ course: placeholderCourse, modules: [placeholderModule] });

    } catch (err: any) {
      setError("Error simulado al cargar estructura: " + err.message);
      console.error("[SIMPLIFICADO] Error al generar estructura placeholder:", err);
    } finally {
      setIsLoadingCourse(false);
    }
  }, [params.courseId, params.lessonId]);


  const fetchUserProgress = useCallback(async () => {
    // This function is currently not making real API calls due to simplification.
    // If re-enabled, ensure it correctly handles auth and API responses.
    if (!currentUser || !params.courseId) {
        setIsLoadingProgress(false);
        return;
    }
    setIsLoadingProgress(true);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 50));
    // console.log("[SIMPLIFICADO] fetchUserProgress INICIADO (simulación)");
    
    setCompletedLessons(new Set()); // Simular progreso vacío
    setIsLoadingProgress(false);
  }, [currentUser, params.courseId]);
  // END SIMPLIFIED DATA FETCHING

  useEffect(() => {
    if (params.courseId) {
        fetchCourseStructureData();
    }
  }, [params.courseId, fetchCourseStructureData]); // fetchCourseStructureData is stable, params.courseId triggers reload of structure


  useEffect(() => {
    if (currentUser && courseStructure) { 
      fetchUserProgress();
    }
  }, [currentUser, courseStructure, fetchUserProgress]);


  useEffect(() => {
    if (!courseStructure || !params.lessonId) {
        setCurrentLesson(null); // Clear current lesson if structure or lessonId is missing
        setPrevLesson(null);
        setNextLesson(null);
        setFlatLessons([]);
        return;
    }
    
    const allLessons: LessonProperties[] = [];
    let foundModule: ModuleWithLessons | null = null;
    let foundLesson: LessonProperties | null = null;

    for (const mod of courseStructure.modules) {
      for (const less of mod.lessons) {
        allLessons.push(less); // Build flat list
        if (less.id === params.lessonId) {
          foundModule = mod;
          foundLesson = less;
        }
      }
    }
    // Sort flatLessons based on module order then lesson order (if multi-module)
    // For single module as in placeholder, module order is fixed.
    // Lessons within module already sorted by 'orden' from placeholder generation.
    setFlatLessons(allLessons.sort((a,b) => {
        const moduleA = courseStructure.modules.find(m => m.id === a.moduleId);
        const moduleB = courseStructure.modules.find(m => m.id === b.moduleId);
        if (moduleA && moduleB && moduleA.orden !== moduleB.orden) {
            return moduleA.orden - moduleB.orden;
        }
        return a.orden - b.orden;
    }));

    setCurrentModule(foundModule);
    setCurrentLesson(foundLesson);

    if (foundLesson) {
      // Re-calculate prev/next based on the now potentially sorted flatLessons
      const sortedFlatLessons = allLessons; // flatLessons state might not be updated yet
      const currentIndex = sortedFlatLessons.findIndex(l => l.id === foundLesson.id);
      setPrevLesson(currentIndex > 0 ? sortedFlatLessons[currentIndex - 1] : null);
      setNextLesson(currentIndex < sortedFlatLessons.length - 1 ? sortedFlatLessons[currentIndex + 1] : null);
    } else {
      console.warn(`Lesson with ID ${params.lessonId} not found in course structure. This might be okay during initial load or if course structure changed.`);
      setPrevLesson(null);
      setNextLesson(null);
    }
  }, [courseStructure, params.lessonId]);


 useEffect(() => {
    if (flatLessons.length > 0 && completedLessons.size >= 0) { 
      const newProgress = flatLessons.length > 0 ? Math.round((completedLessons.size / flatLessons.length) * 100) : 0;
      setCourseProgress(newProgress);
    } else {
      setCourseProgress(0);
    }
  }, [completedLessons, flatLessons]);


  const toggleLessonComplete = async () => {
    if (!currentUser || !currentLesson || !params.courseId || flatLessons.length === 0) return;
    
    setIsTogglingCompletion(true);
    try {
      // const idToken = await auth.currentUser?.getIdToken();
      // if (!idToken) throw new Error("User not authenticated");
      // --- API CALL COMMENTED OUT FOR SIMPLIFICATION ---
      // const response = await fetch(`/api/learn/progress/${params.courseId}/${currentLesson.id}`, { /* ... */ });
      // if (!response.ok) { /* ... */ }
      // const updatedProgressData: UserCourseProgressProperties = await response.json();
      // setCompletedLessons(new Set(updatedProgressData.lessonIdsCompletadas));
      // const newProgress = flatLessons.length > 0 ? Math.round((new Set(updatedProgressData.lessonIdsCompletadas).size / flatLessons.length) * 100) : 0;
      // setCourseProgress(newProgress);

      // --- SIMULATION OF PROGRESS UPDATE ---
      const newCompletedLessons = new Set(completedLessons);
      if (newCompletedLessons.has(currentLesson.id)) {
        newCompletedLessons.delete(currentLesson.id);
      } else {
        newCompletedLessons.add(currentLesson.id);
      }
      setCompletedLessons(newCompletedLessons);
      // Recalculate progress based on the new set
      const newProgressPercentage = flatLessons.length > 0 ? Math.round((newCompletedLessons.size / flatLessons.length) * 100) : 0;
      setCourseProgress(newProgressPercentage);
      // --- END SIMULATION ---

      toast({
        title: "Progreso Actualizado (Simulado)",
        description: `Lección "${currentLesson.nombre}" marcada como ${newCompletedLessons.has(currentLesson.id) ? 'completada' : 'no completada'}.`
      });

    } catch (err: any) {
      toast({ title: "Error al Actualizar Progreso", description: err.message, variant: "destructive" });
      console.error("Error toggling lesson completion:", err);
    } finally {
      setIsTogglingCompletion(false);
    }
  };
  
  const isCurrentLessonCompleted = currentLesson ? completedLessons.has(currentLesson.id) : false;

  const renderLessonContentPlayer = () => {
    if (isLoadingCourse && !currentLesson) {
        return <Skeleton className="aspect-video w-full rounded-lg" />;
    }
    if (!currentLesson || !currentLesson.contenidoPrincipal) {
        return <div className="p-6 bg-card rounded-lg shadow-md flex items-center justify-center text-muted-foreground h-full min-h-[300px] md:min-h-[400px] lg:min-h-[500px]">Contenido de lección no disponible (modo simplificado).</div>;
    }
    const { tipo, url, texto } = currentLesson.contenidoPrincipal;
    switch (tipo) {
      case 'video':
        if (!url) return <div className="p-6 bg-card rounded-lg shadow-md text-muted-foreground flex items-center justify-center h-full">URL del video no disponible.</div>;
        if (url.includes('youtube.com/embed') || url.includes('player.vimeo.com/video')) {
             return (
                <div className="aspect-video bg-black rounded-lg overflow-hidden shadow-xl">
                    <iframe width="100%" height="100%" src={url} title={currentLesson.nombre} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen className="border-0"></iframe>
                </div>
            );
        }
        return (
            <div className="aspect-video bg-black rounded-lg overflow-hidden shadow-xl">
                <video controls src={url} className="w-full h-full"><track kind="captions" /></video>
            </div>
        );
      case 'pdf': 
      case 'documento_pdf':
        if (!url) return <div className="p-6 bg-card rounded-lg shadow-md text-muted-foreground flex items-center justify-center h-full">URL del PDF no disponible.</div>;
        return (
          <div className="h-[60vh] md:h-[calc(100vh-280px)] bg-muted rounded-lg shadow-inner">
            <iframe src={url} width="100%" height="100%" className="border-0 rounded-lg" title={currentLesson.nombre}/>
          </div>
        );
      case 'audio':
        if (!url) return <div className="p-6 bg-card rounded-lg shadow-md text-muted-foreground flex items-center justify-center h-full">URL del audio no disponible.</div>;
        return (
          <div className="p-6 bg-card rounded-lg shadow-md flex flex-col items-center justify-center h-full">
             <h3 className="text-xl font-semibold mb-4">{currentLesson.nombre}</h3>
            <audio controls src={url} className="w-full max-w-md"><track kind="captions" /></audio>
          </div>
        );
      case 'texto_rico':
        if (!texto) return <div className="p-6 bg-card rounded-lg shadow-md text-muted-foreground flex items-center justify-center h-full">Contenido de texto no disponible.</div>;
        return (
          <Card className="h-full overflow-y-auto"> 
            <CardContent className="p-6 prose max-w-none" dangerouslySetInnerHTML={{ __html: texto }} />
          </Card>
        );
      case 'quiz':
         if (!texto) return <div className="p-6 bg-card rounded-lg shadow-md text-muted-foreground flex items-center justify-center h-full">Contenido del quiz no disponible.</div>;
         return (
          <Card className="h-full overflow-y-auto">
            <CardHeader><CardTitle>Quiz: {currentLesson.nombre}</CardTitle></CardHeader>
            <CardContent className="p-6 whitespace-pre-wrap bg-secondary/30 rounded-b-md">{texto}</CardContent>
          </Card>
        );
      default:
        return <div className="p-6 bg-card rounded-lg shadow-md flex items-center justify-center h-full">Contenido de la lección ({tipo}) no soportado o no disponible.</div>;
    }
  };
  
  const CourseNavigationSidebar = ({ onLessonClick }: { onLessonClick: () => void }) => (
    <ScrollArea className="h-full">
      <div className="p-4 sticky top-0 bg-card z-10 border-b">
        <Link href={`/courses/${courseStructure?.course.id}`} className="hover:text-primary block group">
          <h2 className="text-lg font-semibold mb-1 font-headline truncate group-hover:text-primary transition-colors" title={courseStructure?.course.nombre}>{courseStructure?.course.nombre || "Cargando curso..."}</h2>
        </Link>
        <p className="text-xs text-muted-foreground mb-1">{completedLessons.size} / {flatLessons.length} lecciones completadas</p>
        <Progress value={courseProgress} className="h-1.5 mb-2" />
      </div>
      <Accordion type="multiple" defaultValue={currentModule ? [`module-${currentModule.id}`] : []} className="w-full px-2 py-2">
        {courseStructure?.modules.map((moduleItem) => (
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
                {moduleItem.lessons.length === 0 && <p className="text-xs text-muted-foreground p-3 text-center">No hay lecciones en este módulo.</p>}
              </ul>
            </AccordionContent>
          </AccordionItem>
        ))}
         {(!courseStructure || courseStructure.modules.length === 0) && !isLoadingCourse &&
            <p className="p-4 text-sm text-muted-foreground text-center">Este curso no tiene módulos definidos (modo simplificado).</p>
         }
      </Accordion>
    </ScrollArea>
  );

  if (isLoadingCourse || (isLoadingProgress && !courseStructure) ) {
    return (
      <div className="flex h-screen md:h-[calc(100vh-theme(spacing.16))] bg-background overflow-hidden">
        <div className="w-72 lg:w-80 border-r bg-card hidden md:flex flex-col p-0"> 
            <div className="p-4 border-b"> 
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-2 w-full mb-1" />
                <Skeleton className="h-2 w-5/6 mb-2" />
            </div>
            <div className="p-2 space-y-2 flex-1"> 
                {[...Array(3)].map((_, i) => ( 
                    <div key={i} className="space-y-1">
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-7 w-5/6 ml-3" />
                        <Skeleton className="h-7 w-5/6 ml-3" />
                    </div>
                ))}
            </div>
        </div>
        <div className="flex-1 flex flex-col">
            <header className="md:hidden flex items-center justify-between p-4 border-b bg-card">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-8 w-8 rounded-md" />
            </header>
            <div className="flex-1 p-4 sm:p-6 md:p-8 space-y-4">
                <Skeleton className="h-8 w-2/3" />
                <Skeleton className="h-4 w-1/2 mb-4" />
                <Skeleton className="aspect-video w-full rounded-lg" />
                <div className="flex justify-between items-center mt-4">
                    <Skeleton className="h-10 w-28 rounded-md" />
                    <Skeleton className="h-10 w-40 rounded-md" /> 
                </div>
            </div>
        </div>
      </div>
    );
  }

  if (error && !courseStructure) {
    return (
        <div className="container mx-auto py-12 px-4 md:px-6 text-center min-h-screen flex items-center justify-center">
            <Card className="max-w-md mx-auto shadow-lg p-6 rounded-xl bg-card">
                <CardHeader className="p-0 mb-4">
                     <div className="mx-auto p-3 bg-destructive/10 rounded-full w-fit">
                        <AlertTriangle className="h-12 w-12 text-destructive" />
                    </div>
                    <CardTitle className="text-2xl text-destructive mt-4">Error al Cargar el Curso</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <p className="text-muted-foreground mb-4">No pudimos cargar la estructura o tu progreso para este curso.</p>
                    <p className="text-sm text-destructive-foreground bg-destructive/10 p-3 rounded-md border border-destructive/30">{error}</p>
                </CardContent>
                <CardFooter className="p-0 mt-6 flex flex-col gap-3">
                     <Button onClick={() => { fetchCourseStructureData(); if (currentUser) fetchUserProgress(); }} variant="default" disabled={isLoadingCourse || isLoadingProgress} className="w-full">
                        {(isLoadingCourse || isLoadingProgress) ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
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

  if (!courseStructure || (!currentLesson && !isLoadingCourse) ) {
    return (
      <div className="container py-8 text-center min-h-screen flex items-center justify-center">
        <Card className="max-w-md mx-auto shadow-lg p-6 rounded-xl bg-card">
            <CardHeader className="p-0 mb-4">
                <div className="mx-auto p-3 bg-primary/10 rounded-full w-fit">
                    <HelpCircle className="h-12 w-12 text-primary" />
                </div>
                <CardTitle className="text-2xl mt-4">Lección no Encontrada</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <p className="text-muted-foreground">La lección que buscas no existe o el curso no es válido. Por favor, verifica la URL o vuelve al listado de cursos.</p>
            </CardContent>
            <CardFooter className="p-0 mt-6 flex flex-col gap-3">
                <Button variant="outline" asChild className="w-full">
                    <Link href="/dashboard/student">Mis Cursos</Link>
                </Button>
                <Button variant="default" asChild className="w-full">
                    <Link href="/courses">Explorar Cursos</Link>
                </Button>
            </CardFooter>
        </Card>
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
             <h1 className="text-md font-semibold truncate" title={currentLesson?.nombre || "Cargando..."}>{currentLesson?.nombre || "Cargando..."}</h1>
             <p className="text-xs text-muted-foreground truncate" title={courseStructure?.course.nombre || "..."}>{courseStructure?.course.nombre || "..."}</p>
           </div>
          <Sheet open={isMobileNavOpen} onOpenChange={setIsMobileNavOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0 flex flex-col"> 
              <CourseNavigationSidebar onLessonClick={() => setIsMobileNavOpen(false)} />
            </SheetContent>
          </Sheet>
        </header>

        <ScrollArea className="flex-1 bg-secondary/30"> 
          <div className="max-w-4xl mx-auto p-4 sm:p-6 md:p-8">
            <div className="mb-6 md:hidden"> 
                <h1 className="text-2xl font-bold font-headline mb-1 hidden md:block">{currentLesson?.nombre}</h1>
                <p className="text-sm text-muted-foreground hidden md:block">Módulo: {currentModule?.nombre} &bull; Duración: {currentLesson?.duracionEstimada}</p>
            </div>
            
            <div className="mb-6 min-h-[250px] md:min-h-[400px] lg:min-h-[500px] flex"> 
              {renderLessonContentPlayer()}
            </div>

            <div className="mt-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 py-4 border-t">
              <div className="flex gap-2 w-full md:w-auto">
                <Button 
                    variant="outline" 
                    className="flex-1 md:flex-none"
                    onClick={() => prevLesson && router.push(`/learn/${params.courseId}/${prevLesson.id}`)}
                    disabled={!prevLesson}
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" /> Anterior
                  </Button>
                <Button 
                    variant="default" 
                    className="flex-1 md:flex-none"
                    onClick={() => nextLesson && router.push(`/learn/${params.courseId}/${nextLesson.id}`)}
                    disabled={!nextLesson}
                  >
                    Siguiente <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
              </div>
              <Button 
                onClick={toggleLessonComplete}
                variant={isCurrentLessonCompleted ? "secondary" : "default"}
                className={`w-full md:w-auto min-w-[200px] ${isCurrentLessonCompleted ? 'bg-green-100 hover:bg-green-200 text-green-700 border border-green-300' : ''}`}
                disabled={isTogglingCompletion || !currentUser}
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
              <TabsContent value="description">
                <Card><CardContent className="p-4 md:p-6 text-sm text-foreground/80"><p>{currentLesson?.descripcionBreve || "No hay descripción disponible para esta lección (modo simplificado)."}</p></CardContent></Card>
              </TabsContent>
              <TabsContent value="materials">
                <Card>
                  <CardContent className="p-4 md:p-6">
                    {currentLesson?.materialesAdicionales && currentLesson.materialesAdicionales.length > 0 ? (
                      <ul className="space-y-2.5">
                        {currentLesson.materialesAdicionales.map((material, index) => (
                          <li key={material.id || index}>
                            <Button variant="link" asChild className="p-0 h-auto text-primary hover:underline text-sm">
                              <a href={material.url} download target="_blank" rel="noopener noreferrer">
                                <Download className="h-4 w-4 mr-2" /> {material.nombre}
                              </a>
                            </Button>
                          </li>
                        ))}
                      </ul>
                    ) : ( <p className="text-sm text-muted-foreground">No hay materiales adicionales.</p> )}
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="q&a">
                <Card>
                  <CardHeader className="pb-4"><CardTitle className="text-lg">Preguntas y Respuestas</CardTitle><CardDescription className="text-sm">Haz tus preguntas o revisa las de otros.</CardDescription></CardHeader>
                  <CardContent className="p-4 md:p-6"><Textarea placeholder="Escribe tu pregunta aquí..." className="mb-3 text-sm" /><Button size="sm">Enviar Pregunta</Button><p className="mt-3 text-xs text-muted-foreground">Aún no hay preguntas. ¡Sé el primero!</p></CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="comments">
                <Card>
                  <CardHeader className="pb-4"><CardTitle className="text-lg">Comentarios</CardTitle><CardDescription className="text-sm">Comparte tus pensamientos.</CardDescription></CardHeader>
                  <CardContent className="p-4 md:p-6">
                    <div className="space-y-4 mb-4 max-h-80 overflow-y-auto">
                      {lessonCommentsPlaceholder.map(comment => (
                        <div key={comment.id} className="flex gap-2.5 p-3 rounded-md border bg-background">
                          <Avatar className="h-9 w-9"><AvatarImage src={comment.user.avatar} alt={comment.user.name} data-ai-hint="user avatar comment" /><AvatarFallback>{comment.user.name.substring(0,1)}</AvatarFallback></Avatar>
                          <div className="flex-1"><div className="flex items-center justify-between"><span className="font-medium text-xs">{comment.user.name}</span><span className="text-xs text-muted-foreground">{comment.date}</span></div><p className="text-xs text-foreground/90 mt-0.5">{comment.text}</p></div>
                        </div>
                      ))}
                      {lessonCommentsPlaceholder.length === 0 && <p className="text-xs text-muted-foreground">Sin comentarios. ¡Sé el primero!</p>}
                    </div>
                    <Textarea placeholder="Escribe tu comentario..." className="mb-3 text-sm" /><Button size="sm">Publicar Comentario</Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
    
