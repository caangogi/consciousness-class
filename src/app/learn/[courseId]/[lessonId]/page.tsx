
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
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

interface ModuleWithLessons extends ModuleProperties {
  lessons: LessonProperties[];
}

interface CourseStructureData {
  course: CourseProperties;
  modules: ModuleWithLessons[];
}

// Minimal placeholder data for the simplified version
const simplifiedPlaceholderCourse: CourseProperties = {
    id: "simCourse1",
    nombre: "Curso Simplificado de Prueba",
    descripcionCorta: "Curso simple para depuración.",
    descripcionLarga: "<p>Contenido de la descripción larga.</p>",
    precio: 0,
    tipoAcceso: 'unico',
    duracionEstimada: "N/A",
    categoria: "Depuración",
    creadorUid: "testUser",
    estado: 'publicado',
    imagenPortadaUrl: null,
    fechaCreacion: new Date().toISOString(),
    fechaActualizacion: new Date().toISOString(),
    ordenModulos: ["simModule1"]
};

const simplifiedPlaceholderModule: ModuleWithLessons = {
    id: "simModule1",
    courseId: "simCourse1",
    nombre: "Módulo Único Simplificado",
    orden: 1,
    fechaCreacion: new Date().toISOString(),
    fechaActualizacion: new Date().toISOString(),
    lessons: [
        { id: "lesson1", moduleId: "simModule1", courseId: "simCourse1", nombre: "Lección 1: Intro", descripcionBreve: "Introducción al curso simplificado.", duracionEstimada: "5m", esVistaPrevia: false, orden: 1, contenidoPrincipal: { tipo: 'texto_rico', texto: "<p>Este es el <strong>contenido de la Lección 1</strong>. Bienvenida al curso de depuración.</p>" }, fechaCreacion: new Date().toISOString(), fechaActualizacion: new Date().toISOString() },
        { id: "lesson2", moduleId: "simModule1", courseId: "simCourse1", nombre: "Lección 2: Video de Ejemplo", descripcionBreve: "Un video de demostración.", duracionEstimada: "10m", esVistaPrevia: true, orden: 2, contenidoPrincipal: { tipo: 'video', url: "https://www.w3schools.com/html/mov_bbb.mp4" }, fechaCreacion: new Date().toISOString(), fechaActualizacion: new Date().toISOString() },
        { id: "lesson3", moduleId: "simModule1", courseId: "simCourse1", nombre: "Lección 3: Documento PDF", descripcionBreve: "Un PDF para revisar.", duracionEstimada: "3 págs", esVistaPrevia: false, orden: 3, contenidoPrincipal: { tipo: 'documento_pdf', url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" }, fechaCreacion: new Date().toISOString(), fechaActualizacion: new Date().toISOString() },
    ],
    ordenLecciones: ["lesson1", "lesson2", "lesson3"]
};

const simplifiedCourseStructure: CourseStructureData = {
    course: simplifiedPlaceholderCourse,
    modules: [simplifiedPlaceholderModule]
};


export default function LessonPage() {
  const params = useParams<{ courseId: string; lessonId: string }>();
  const router = useRouter();
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [currentLessonId, setCurrentLessonId] = useState<string | null>(null); // Will be set by useEffect

  // Derived state from params and static placeholder data
  const allLessons = simplifiedCourseStructure.modules.flatMap(m => m.lessons);
  const currentLessonIndex = allLessons.findIndex(l => l.id === currentLessonId);
  const currentLesson = currentLessonIndex !== -1 ? allLessons[currentLessonIndex] : null;
  const prevLesson = currentLessonIndex > 0 ? allLessons[currentLessonIndex - 1] : null;
  const nextLesson = currentLessonIndex < allLessons.length - 1 && currentLessonIndex !== -1 ? allLessons[currentLessonIndex + 1] : null;
  
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [isTogglingCompletion, setIsTogglingCompletion] = useState(false);
  
  useEffect(() => {
    console.log("LessonPage mounted or params changed. Current params.lessonId:", params.lessonId);
    if (params.lessonId) {
      setCurrentLessonId(params.lessonId);
    } else if (allLessons.length > 0) {
      // Fallback if no lessonId in URL, go to first lesson of the placeholder
      // This might not be hit if the route always provides lessonId
      router.replace(`/learn/${params.courseId || simplifiedCourseStructure.course.id}/${allLessons[0].id}`);
      setCurrentLessonId(allLessons[0].id);
    }
  }, [params.courseId, params.lessonId, router, allLessons]);

  const toggleLessonComplete = async () => {
    if (!currentUser || !currentLessonId) return;
    setIsTogglingCompletion(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 300));
    setCompletedLessons(prev => {
      const newSet = new Set(prev);
      if (newSet.has(currentLessonId)) {
        newSet.delete(currentLessonId);
      } else {
        newSet.add(currentLessonId);
      }
      return newSet;
    });
    toast({
      title: "Progreso Actualizado (Simulado)",
      description: `Lección "${currentLesson?.nombre || currentLessonId}" marcada.`
    });
    setIsTogglingCompletion(false);
  };

  const isCurrentLessonCompleted = currentLessonId ? completedLessons.has(currentLessonId) : false;
  const courseProgress = allLessons.length > 0 ? Math.round((completedLessons.size / allLessons.length) * 100) : 0;

  const renderLessonContentPlayer = () => {
    if (!currentLesson) {
      return <div className="p-6 bg-card rounded-lg shadow-md flex items-center justify-center text-muted-foreground h-full min-h-[300px] md:min-h-[400px] lg:min-h-[500px]">Cargando lección...</div>;
    }
    const { tipo, url, texto } = currentLesson.contenidoPrincipal;
    switch (tipo) {
      case 'video':
        if (!url) return <div className="p-6 bg-card rounded-lg shadow-md text-muted-foreground flex items-center justify-center h-full">URL del video no disponible.</div>;
        return <div className="aspect-video bg-black rounded-lg overflow-hidden shadow-xl"><video key={url} controls src={url} className="w-full h-full"><track kind="captions" /></video></div>;
      case 'documento_pdf':
        if (!url) return <div className="p-6 bg-card rounded-lg shadow-md text-muted-foreground flex items-center justify-center h-full">URL del PDF no disponible.</div>;
        return <div className="h-[60vh] md:h-[calc(100vh-280px)] bg-muted rounded-lg shadow-inner"><iframe key={url} src={url} width="100%" height="100%" className="border-0 rounded-lg" title={currentLesson.nombre}/></div>;
      case 'texto_rico':
        if (!texto) return <div className="p-6 bg-card rounded-lg shadow-md text-muted-foreground flex items-center justify-center h-full">Contenido de texto no disponible.</div>;
        return <Card className="h-full overflow-y-auto"><CardContent className="p-6 prose max-w-none" dangerouslySetInnerHTML={{ __html: texto }} /></Card>;
      default:
        return <div className="p-6 bg-card rounded-lg shadow-md flex items-center justify-center h-full">Contenido no disponible para tipo: {tipo}.</div>;
    }
  };

  const CourseNavigationSidebar = ({ onLessonClick }: { onLessonClick?: () => void }) => (
    <ScrollArea className="h-full">
      <div className="p-4 sticky top-0 bg-card z-10 border-b">
        <Link href={`/courses/${simplifiedCourseStructure.course.id}`} className="hover:text-primary block group">
          <h2 className="text-lg font-semibold mb-1 font-headline truncate group-hover:text-primary transition-colors" title={simplifiedCourseStructure.course.nombre}>{simplifiedCourseStructure.course.nombre}</h2>
        </Link>
        <p className="text-xs text-muted-foreground mb-1">{completedLessons.size} / {allLessons.length} lecciones completadas</p>
        <Progress value={courseProgress} className="h-1.5 mb-2" />
      </div>
      <Accordion type="multiple" defaultValue={[`module-${simplifiedPlaceholderModule.id}`]} className="w-full px-2 py-2">
        {simplifiedCourseStructure.modules.map((moduleItem) => (
          <AccordionItem value={`module-${moduleItem.id}`} key={moduleItem.id} className="border-b-0 mb-1 rounded-md overflow-hidden bg-secondary/30 hover:bg-secondary/50 transition-colors">
            <AccordionTrigger className="px-3 py-2.5 text-sm font-medium hover:no-underline text-left group data-[state=open]:bg-secondary data-[state=open]:text-primary">
              <span className="truncate flex-1">{moduleItem.nombre}</span>
            </AccordionTrigger>
            <AccordionContent className="pt-0 pb-0 bg-card">
              <ul className="space-y-px py-1">
                {moduleItem.lessons.map((lesson) => (
                  <li key={lesson.id}>
                    <Link
                        href={`/learn/${params.courseId || simplifiedCourseStructure.course.id}/${lesson.id}`}
                        onClick={onLessonClick}
                        className={`flex items-center w-full justify-start text-left h-auto py-2.5 px-3 text-xs group
                        ${lesson.id === currentLessonId ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground/80 hover:bg-primary/5 hover:text-primary/90'}
                        ${completedLessons.has(lesson.id) && lesson.id !== currentLessonId ? 'text-muted-foreground/70 line-through' : ''}`}
                    >
                      {lesson.contenidoPrincipal.tipo === 'video' ? <PlayCircle className="h-4 w-4 mr-2.5 shrink-0 opacity-70 group-hover:opacity-100" /> : <FileText className="h-4 w-4 mr-2.5 shrink-0 opacity-70 group-hover:opacity-100" />}
                      <span className="flex-grow truncate mr-2">{lesson.nombre}</span>
                      {completedLessons.has(lesson.id) && <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />}
                    </Link>
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </ScrollArea>
  );

  // Fallback for initial render or if params are somehow missing (should not happen on a valid route)
  if (!currentLessonId) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Cargando datos de la lección...</p>
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
             <h1 className="text-md font-semibold truncate" title={currentLesson?.nombre || "..."}>{currentLesson?.nombre || "Lección Actual"}</h1>
             <p className="text-xs text-muted-foreground truncate" title={simplifiedCourseStructure.course.nombre}>{simplifiedCourseStructure.course.nombre}</p>
           </div>
          <Sheet open={isMobileNavOpen} onOpenChange={setIsMobileNavOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon"> <Menu className="h-5 w-5" /> </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0 flex flex-col">
              <CourseNavigationSidebar onLessonClick={() => setIsMobileNavOpen(false)} />
            </SheetContent>
          </Sheet>
        </header>

        <ScrollArea className="flex-1 bg-secondary/30">
          {/* Key for the content area based on lessonId to force re-render of iframe/video if URL changes */}
          <div key={currentLessonId} className="max-w-4xl mx-auto p-4 sm:p-6 md:p-8">
            <div className="mb-4 hidden md:block">
                 <h1 className="text-2xl font-bold font-headline mb-1">{currentLesson?.nombre || `Lección ${currentLessonId}`}</h1>
                 <p className="text-sm text-muted-foreground">Del curso: {simplifiedCourseStructure.course.nombre}</p>
            </div>
            <div className="mb-6 min-h-[250px] md:min-h-[400px] lg:min-h-[500px] flex">
              {renderLessonContentPlayer()}
            </div>

            <div className="mt-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 py-4 border-t">
              <div className="flex gap-2 w-full md:w-auto">
                <Button variant="outline" className="flex-1 md:flex-none" onClick={() => prevLesson && router.push(`/learn/${params.courseId || simplifiedCourseStructure.course.id}/${prevLesson.id}`)} disabled={!prevLesson}>
                    <ChevronLeft className="h-4 w-4 mr-2" /> Anterior
                </Button>
                <Button variant="default" className="flex-1 md:flex-none" onClick={() => nextLesson && router.push(`/learn/${params.courseId || simplifiedCourseStructure.course.id}/${nextLesson.id}`)} disabled={!nextLesson}>
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
              <TabsContent value="description"><Card><CardContent className="p-4 md:p-6 text-sm text-foreground/80"><p>{currentLesson?.descripcionBreve || "Descripción no disponible (simplificado)."}</p></CardContent></Card></TabsContent>
              <TabsContent value="materials"><Card><CardContent className="p-4 md:p-6 text-sm text-muted-foreground">No hay materiales (simplificado).</CardContent></Card></TabsContent>
              <TabsContent value="q&a"><Card><CardHeader className="pb-4"><CardTitle className="text-lg">Preguntas</CardTitle></CardHeader><CardContent className="p-4 md:p-6"><Textarea placeholder="Escribe tu pregunta..." className="mb-3 text-sm" /><Button size="sm">Enviar</Button></CardContent></Card></TabsContent>
              <TabsContent value="comments"><Card><CardHeader className="pb-4"><CardTitle className="text-lg">Comentarios</CardTitle></CardHeader><CardContent className="p-4 md:p-6"><Textarea placeholder="Escribe tu comentario..." className="mb-3 text-sm" /><Button size="sm">Publicar</Button></CardContent></Card></TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
    
