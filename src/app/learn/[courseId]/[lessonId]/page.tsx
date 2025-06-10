'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CheckCircle, ChevronLeft, ChevronRight, Download, FileText, MessageSquare, PlayCircle, Info, HelpCircle } from 'lucide-react';

// Placeholder data (replace with actual data fetching)
const courseData = {
  id: '1',
  title: 'Desarrollo Web Avanzado con Next.js y GraphQL',
  modules: [
    {
      id: 'm1',
      title: 'Introducción a Next.js',
      lessons: [
        { id: 'l1a', title: '¿Qué es Next.js?', format: 'video' as const, duration: '10:32', contentUrl: 'https://www.youtube.com/embed/fmR_GMWNagk', description: 'Una visión general de Next.js, sus características principales y por qué es una excelente elección para el desarrollo web moderno.', materials: [{name: 'Presentación PDF', url: '#'}] },
        { id: 'l1b', title: 'Instalación y Configuración', format: 'video' as const, duration: '15:05', contentUrl: '#', description: 'Guía paso a paso para instalar Next.js y configurar tu primer proyecto.', materials: [] },
        { id: 'l1c', title: 'Estructura del Proyecto', format: 'pdf' as const, duration: 'N/A', contentUrl: 'https://placehold.co/800x1100.pdf', description: 'Entendiendo la organización de carpetas y archivos en un proyecto Next.js.', materials: [{name: 'Ejemplo de estructura', url: '#'}] },
      ],
    },
    {
      id: 'm2',
      title: 'GraphQL: Fundamentos',
      lessons: [
        { id: 'l2a', title: 'Conceptos de GraphQL', format: 'video' as const, duration: '12:50', contentUrl: '#', description: 'Introducción a los conceptos fundamentales de GraphQL, incluyendo queries, mutations y subscriptions.', materials: [] },
        { id: 'l2b', title: 'Esquemas y Tipos', format: 'video' as const, duration: '20:15', contentUrl: '#', description: 'Cómo definir esquemas y tipos de datos en GraphQL para modelar tu API.', materials: [] },
      ],
    },
  ],
};

// Dummy comments data
const lessonComments = [
  { id: 'c1', user: { name: 'Alice Wonder', avatar: 'https://placehold.co/40x40.png?text=AW' }, text: '¡Gran explicación! Me quedó todo muy claro.', date: 'Hace 2 días' },
  { id: 'c2', user: { name: 'Bob Builder', avatar: 'https://placehold.co/40x40.png?text=BB' }, text: '¿Podrías dar un ejemplo de cómo aplicar esto en un proyecto real con autenticación?', date: 'Hace 1 día' },
];


export default function LessonPage({ params }: { params: { courseId: string; lessonId: string } }) {
  // Find current lesson and module based on params
  const currentModule = courseData.modules.find(m => m.lessons.some(l => l.id === params.lessonId));
  const currentLesson = currentModule?.lessons.find(l => l.id === params.lessonId);

  const [isCompleted, setIsCompleted] = useState(false);

  if (!currentLesson || !currentModule) {
    return <div className="container py-8 text-center">Lección no encontrada.</div>;
  }

  const flatLessons = courseData.modules.flatMap(m => m.lessons);
  const currentIndex = flatLessons.findIndex(l => l.id === currentLesson.id);
  const prevLesson = currentIndex > 0 ? flatLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < flatLessons.length - 1 ? flatLessons[currentIndex + 1] : null;

  const renderContent = () => {
    switch (currentLesson.format) {
      case 'video':
        return (
          <div className="aspect-video bg-black rounded-lg overflow-hidden shadow-2xl">
            <iframe
              width="100%"
              height="100%"
              src={currentLesson.contentUrl || "https://www.youtube.com/embed/fmR_GMWNagk"} // Fallback video
              title={currentLesson.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="border-0"
            ></iframe>
          </div>
        );
      case 'pdf':
        return (
          <div className="h-[70vh] bg-muted rounded-lg shadow-inner">
            <iframe
              src={currentLesson.contentUrl}
              width="100%"
              height="100%"
              className="border-0 rounded-lg"
              title={currentLesson.title}
            />
          </div>
        );
      default:
        return <div className="p-6 bg-card rounded-lg shadow-md">Contenido de la lección ({currentLesson.format})</div>;
    }
  };

  return (
    <div className="flex h-[calc(100vh-theme(spacing.16))] bg-background">
      {/* Sidebar with Course Navigation */}
      <ScrollArea className="w-80 border-r bg-card hidden md:block">
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-1 font-headline">{courseData.title}</h2>
          <p className="text-xs text-muted-foreground mb-4">Tu Progreso: 30%</p> {/* Placeholder */}
          <div className="w-full bg-secondary rounded-full h-1.5 mb-4">
            <div className="bg-primary h-1.5 rounded-full" style={{ width: "30%" }}></div> {/* Placeholder */}
          </div>
        </div>
        <Accordion type="multiple" defaultValue={[`module-${currentModule.id}`]} className="w-full px-2">
          {courseData.modules.map((moduleItem) => (
            <AccordionItem value={`module-${moduleItem.id}`} key={moduleItem.id}>
              <AccordionTrigger className="px-2 py-3 text-sm font-semibold hover:no-underline hover:bg-secondary/50 rounded-md">
                {moduleItem.title}
              </AccordionTrigger>
              <AccordionContent className="pt-1">
                <ul className="space-y-1 pl-2 border-l-2 border-primary/20 ml-2">
                  {moduleItem.lessons.map((lesson) => (
                    <li key={lesson.id}>
                      <Link href={`/learn/${params.courseId}/${lesson.id}`} passHref>
                        <Button
                          variant="ghost"
                          className={`w-full justify-start text-left h-auto py-2 px-2 ${
                            lesson.id === currentLesson.id ? 'bg-primary/10 text-primary font-medium' : 'text-foreground/80 hover:bg-secondary/30'
                          }`}
                        >
                          {lesson.format === 'video' ? <PlayCircle className="h-4 w-4 mr-2 shrink-0" /> : <FileText className="h-4 w-4 mr-2 shrink-0" />}
                          <span className="flex-grow truncate">{lesson.title}</span>
                          {/* Add checkmark for completed lessons */}
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

      {/* Main Content Area */}
      <ScrollArea className="flex-1">
        <div className="p-6 md:p-8 lg:p-10">
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold font-headline mb-2">{currentLesson.title}</h1>
            <p className="text-sm text-muted-foreground">Módulo: {currentModule.title} &bull; Duración: {currentLesson.duration}</p>
          </div>

          {renderContent()}

          <div className="mt-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex gap-2">
              {prevLesson && (
                <Button variant="outline" asChild>
                  <Link href={`/learn/${params.courseId}/${prevLesson.id}`}>
                    <ChevronLeft className="h-4 w-4 mr-2" /> Anterior
                  </Link>
                </Button>
              )}
              {nextLesson && (
                <Button variant="outline" asChild>
                  <Link href={`/learn/${params.courseId}/${nextLesson.id}`}>
                    Siguiente <ChevronRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              )}
            </div>
            <Button 
              onClick={() => setIsCompleted(!isCompleted)}
              variant={isCompleted ? "default" : "secondary"}
              className="w-full md:w-auto"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {isCompleted ? 'Lección Completada' : 'Marcar como Completada'}
            </Button>
          </div>

          <Tabs defaultValue="description" className="mt-10">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-4">
              <TabsTrigger value="description"><Info className="h-4 w-4 mr-2 md:hidden lg:inline-block" />Descripción</TabsTrigger>
              <TabsTrigger value="materials"><Download className="h-4 w-4 mr-2 md:hidden lg:inline-block" />Materiales</TabsTrigger>
              <TabsTrigger value="q&a"><HelpCircle className="h-4 w-4 mr-2 md:hidden lg:inline-block" />Preguntas</TabsTrigger>
              <TabsTrigger value="comments"><MessageSquare className="h-4 w-4 mr-2 md:hidden lg:inline-block" />Comentarios</TabsTrigger>
            </TabsList>
            <TabsContent value="description">
              <Card>
                <CardContent className="p-6 text-foreground/80">
                  <p>{currentLesson.description || "No hay descripción disponible para esta lección."}</p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="materials">
              <Card>
                <CardContent className="p-6">
                  {currentLesson.materials && currentLesson.materials.length > 0 ? (
                    <ul className="space-y-3">
                      {currentLesson.materials.map((material, index) => (
                        <li key={index}>
                          <Button variant="link" asChild className="p-0 h-auto text-primary hover:underline">
                            <a href={material.url} download target="_blank" rel="noopener noreferrer">
                              <Download className="h-4 w-4 mr-2" /> {material.name}
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
                   {/* Q&A content placeholder */}
                  <Textarea placeholder="Escribe tu pregunta aquí..." className="mb-4" />
                  <Button>Enviar Pregunta</Button>
                  <p className="mt-4 text-muted-foreground">Aún no hay preguntas para esta lección.</p>
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
                  <div className="space-y-6 mb-6">
                    {lessonComments.map(comment => (
                      <div key={comment.id} className="flex gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={comment.user.avatar} alt={comment.user.name} data-ai-hint="user avatar" />
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
