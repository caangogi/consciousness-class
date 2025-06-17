
'use client';

import { useState, useEffect, useCallback, useMemo }
from 'react';
import Link from 'next/link';
import { useParams, useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
    CheckCircle, ChevronLeft, ChevronRight, Download, FileText, MessageSquare, PlayCircle, 
    Info, HelpCircle, Loader2, AlertTriangle, Menu, Send, StarIcon, Trash2, Edit, CornerDownRight, Reply
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import type { CourseProperties } from '@/features/course/domain/entities/course.entity';
import type { ModuleProperties } from '@/features/course/domain/entities/module.entity';
import type { LessonProperties } from '@/features/course/domain/entities/lesson.entity';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"; // AlertDialogTrigger no es necesario si se abre programáticamente
import { auth } from '@/lib/firebase/config';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';

interface ModuleWithLessons extends ModuleProperties {
  lessons: LessonProperties[];
}

interface CourseStructureData {
  course: CourseProperties;
  modules: ModuleWithLessons[];
}

export interface QnAItem {
  id: string;
  userId: string;
  userDisplayName: string;
  userPhotoURL: string | null;
  texto: string;
  createdAt: Date; 
  updatedAt?: Date | null; 
  parentId: string | null;
  courseId: string;
  moduleId: string;
  lessonId: string;
  replies?: QnAItem[]; 
}


export default function LessonPage() {
  const params = useParams<{ courseId: string; lessonId: string }>();
  const router = useRouter();
  const pathname = usePathname();
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

  const [allQuestionsAndAnswers, setAllQuestionsAndAnswers] = useState<QnAItem[]>([]);
  const [newQuestionText, setNewQuestionText] = useState('');
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [isPostingQuestion, setIsPostingQuestion] = useState(false);

  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);
  const [replyingToUsername, setReplyingToUsername] = useState<string | null>(null);

  const [commentToDelete, setCommentToDelete] = useState<QnAItem | null>(null);
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false);
  const [isDeletingComment, setIsDeletingComment] = useState(false);

  const getFlatLessons = useCallback((structure: CourseStructureData | null): LessonProperties[] => {
    if (!structure) return [];
    return structure.modules.reduce((acc, moduleItem) => acc.concat(moduleItem.lessons), [] as LessonProperties[]);
  }, []);

  const fetchCourseStructureData = useCallback(async (courseIdToFetch: string) => {
    if (!courseIdToFetch) return;
    try {
      const response = await fetch(`/api/learn/course-structure/${courseIdToFetch}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Error al cargar la estructura del curso');
      }
      const data: CourseStructureData = await response.json();
      setCourseStructure(data);
      setCourseLoadError(null); 
    } catch (err: any) {
      setCourseLoadError(err.message);
      setCourseStructure(null); 
      toast({ title: "Error Estructura Curso", description: err.message, variant: "destructive" });
    }
  }, [toast]);

  const fetchUserProgress = useCallback(async (courseIdToFetch: string) => {
    if (!currentUser || !courseIdToFetch || !auth.currentUser) return;
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
      toast({ title: "Error al Cargar Progreso", description: err.message, variant: "destructive" });
    }
  }, [currentUser, toast]);

  const fetchQuestionsAndAnswers = useCallback(async () => {
    if (!params.courseId || !currentModule?.id || !currentLesson?.id) return;
    setIsLoadingQuestions(true);
    try {
      const response = await fetch(`/api/courses/${params.courseId}/modules/${currentModule.id}/lessons/${currentLesson.id}/comments`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Error al cargar preguntas y respuestas.');
      }
      const data = await response.json();
      setAllQuestionsAndAnswers(data.comments.map((q: any) => ({
          ...q, 
          createdAt: new Date(q.createdAt),
          updatedAt: q.updatedAt ? new Date(q.updatedAt) : null,
        })));
    } catch (err: any) {
      toast({ title: 'Error al Cargar Q&A', description: err.message, variant: 'destructive' });
      setAllQuestionsAndAnswers([]);
    } finally {
      setIsLoadingQuestions(false);
    }
  }, [params.courseId, currentModule?.id, currentLesson?.id, toast]);

  useEffect(() => {
    if (currentLesson?.id && currentModule?.id) { 
      fetchQuestionsAndAnswers();
    } else {
      setAllQuestionsAndAnswers([]);
    }
  }, [currentLesson?.id, currentModule?.id, fetchQuestionsAndAnswers]);


  useEffect(() => {
    if (params.courseId) {
      setIsInitialCourseLoad(true);
      setCourseLoadError(null);    
      setCourseStructure(null);    
      setCurrentLesson(null);      
      setCompletedLessons(new Set());
      setAllQuestionsAndAnswers([]); 
      setReplyingToCommentId(null);
      setReplyingToUsername(null);

      fetchCourseStructureData(params.courseId);
      if (currentUser) {
        fetchUserProgress(params.courseId);
      }
    }
  }, [params.courseId, currentUser, fetchCourseStructureData, fetchUserProgress]);

  useEffect(() => {
    if (courseStructure !== null || courseLoadError !== null) {
      if(isInitialCourseLoad){
        setIsInitialCourseLoad(false);
      }
    }
  }, [courseStructure, courseLoadError, isInitialCourseLoad]);

  useEffect(() => {
    if (isInitialCourseLoad || !courseStructure || !params.lessonId) {
      if (!isInitialCourseLoad && courseStructure && !params.lessonId && currentLesson !== null) {
          setCurrentLesson(null); 
      }
      return;
    }
    
    setIsLoadingLessonContent(true);
    const flatLessonsArray = getFlatLessons(courseStructure);
    let foundCurrentModule: ModuleWithLessons | null = null;
    let foundCurrentLessonProp: LessonProperties | null = null;

    for (const moduleItem of courseStructure.modules) {
      const lesson = moduleItem.lessons.find(l => l.id === params.lessonId);
      if (lesson) {
        foundCurrentLessonProp = lesson;
        foundCurrentModule = moduleItem;
        break; 
      }
    }
    
    setCurrentModule(foundCurrentModule);
    setCurrentLesson(foundCurrentLessonProp);

    if (foundCurrentLessonProp) {
      const currentIndex = flatLessonsArray.findIndex(l => l.id === foundCurrentLessonProp!.id);
      setPrevLesson(currentIndex > 0 ? flatLessonsArray[currentIndex - 1] : null);
      setNextLesson(currentIndex < flatLessonsArray.length - 1 ? flatLessonsArray[currentIndex + 1] : null);
    } else {
      // toast({ title: "Lección no Encontrada", description: `No se pudo encontrar la lección con ID ${params.lessonId}`, variant: "destructive" }); // Comentado para evitar spam de toasts en carga inicial
      setCurrentLesson(null);
      setPrevLesson(null);
      setNextLesson(null);
    }
    
    setIsLoadingLessonContent(false);
    setReplyingToCommentId(null); 
    setReplyingToUsername(null);

  }, [params.lessonId, courseStructure, isInitialCourseLoad, getFlatLessons]);


  const toggleLessonComplete = async () => {
    if (!currentUser || !currentLesson || !courseStructure || !auth.currentUser) return;
    setIsTogglingCompletion(true);
    try {
      const idToken = await auth.currentUser?.getIdToken(true);
      if (!idToken) throw new Error("Token de autenticación no disponible.");
      const totalLessonsInCourse = getFlatLessons(courseStructure).length;
      const response = await fetch(`/api/learn/progress/${params.courseId}/${currentLesson.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify({ totalLessonsInCourse }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || "Error al actualizar el progreso.");
      }
      const updatedProgressData = await response.json();
      setCompletedLessons(prev => {
        const newSet = new Set(prev);
        if (updatedProgressData.lessonIdsCompletadas.includes(currentLesson!.id)) newSet.add(currentLesson!.id);
        else newSet.delete(currentLesson!.id);
        return newSet;
      });
      toast({ title: "Progreso Actualizado", description: `Lección "${currentLesson.nombre}" marcada.` });
    } catch (err: any) {
      toast({ title: "Error al Marcar Lección", description: err.message, variant: "destructive" });
    } finally {
      setIsTogglingCompletion(false);
    }
  };

  const handlePostQuestionOrReply = async () => {
    if (!currentUser || !currentLesson || !currentModule || newQuestionText.trim() === '' || !auth.currentUser) return;
    setIsPostingQuestion(true);
    try {
      const idToken = await auth.currentUser?.getIdToken(true);
      if (!idToken) throw new Error("Token de autenticación no disponible.");

      const payload = {
        texto: newQuestionText,
        parentId: replyingToCommentId, 
      };

      const response = await fetch(`/api/courses/${params.courseId}/modules/${currentModule.id}/lessons/${currentLesson.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Error al publicar.');
      }
      
      await fetchQuestionsAndAnswers();
      setNewQuestionText('');
      setReplyingToCommentId(null);
      setReplyingToUsername(null);
      toast({ title: replyingToCommentId ? "Respuesta Publicada" : "Pregunta Publicada" });
    } catch (err: any) {
      toast({ title: "Error al Publicar", description: err.message, variant: "destructive" });
    } finally {
      setIsPostingQuestion(false);
    }
  };

  const handleDeleteComment = async () => {
    if (!commentToDelete || !currentUser || !auth.currentUser) return;
    setIsDeletingComment(true);
    try {
      const idToken = await auth.currentUser.getIdToken(true);
      const response = await fetch(`/api/courses/${commentToDelete.courseId}/modules/${commentToDelete.moduleId}/lessons/${commentToDelete.lessonId}/comments/${commentToDelete.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${idToken}` },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Error al eliminar.');
      }
      toast({ title: 'Eliminado Correctamente' });
      setAllQuestionsAndAnswers(prev => prev.filter(q => q.id !== commentToDelete.id));
    } catch (err: any) {
      toast({ title: 'Error al Eliminar', description: err.message, variant: 'destructive' });
    } finally {
      setIsDeletingComment(false);
      setShowDeleteConfirmDialog(false);
      setCommentToDelete(null);
    }
  };
  
  const isCurrentLessonCompleted = currentLesson ? completedLessons.has(currentLesson.id) : false;
  const flatLessonsForProgress = getFlatLessons(courseStructure);
  const courseProgress = flatLessonsForProgress.length > 0 ? Math.round((completedLessons.size / flatLessonsForProgress.length) * 100) : 0;

  const organizedQnA = useMemo(() => {
    const roots: QnAItem[] = [];
    const map: Record<string, QnAItem> = {};
    
    allQuestionsAndAnswers.forEach(item => {
      map[item.id] = { ...item, replies: [] };
    });
    
    allQuestionsAndAnswers.forEach(item => {
      if (item.parentId && map[item.parentId]) {
        if (!map[item.parentId].replies) { // Defensive check
            map[item.parentId].replies = [];
        }
        map[item.parentId].replies!.push(map[item.id]);
      } else {
        roots.push(map[item.id]);
      }
    });
    return roots;
  }, [allQuestionsAndAnswers]);


  const RenderQnAItem = ({ item, level = 0 }: { item: QnAItem, level?: number }) => {
    const isInstructor = item.userId === courseStructure?.course.creadorUid;
    const canDelete = currentUser && (currentUser.uid === item.userId || currentUser.uid === courseStructure?.course.creadorUid);

    return (
      <Card className={`shadow-sm ${isInstructor ? 'bg-primary/5 border-primary/20' : ''} ${level > 0 ? 'ml-4 sm:ml-8' : ''}`}>
        <CardContent className="p-3 sm:p-4 flex gap-3">
          <Avatar className="h-8 w-8 sm:h-10 sm:w-10 mt-1">
            <AvatarImage src={item.userPhotoURL || `https://placehold.co/40x40.png?text=${item.userDisplayName.substring(0,1)}`} alt={item.userDisplayName} data-ai-hint="user avatar q&a" />
            <AvatarFallback>{item.userDisplayName.substring(0,1)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 mb-0.5 sm:mb-0">
                <span className="font-semibold text-sm">{item.userDisplayName}</span>
                {isInstructor && (
                  <Badge variant="default" className="h-5 px-1.5 py-0 text-xs">
                    <StarIcon className="h-3 w-3 mr-1"/> Instructor
                  </Badge>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true, locale: es })}
                {item.updatedAt && new Date(item.updatedAt).getTime() !== new Date(item.createdAt).getTime() && ` (editado)`}
              </span>
            </div>
            <p className="text-sm text-foreground/80 mt-0.5 whitespace-pre-wrap">{item.texto}</p>
            <div className="mt-2 flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs h-auto px-2 py-1"
                onClick={() => {
                  setReplyingToCommentId(item.id);
                  setReplyingToUsername(item.userDisplayName);
                  const textarea = document.getElementById('qna-textarea') as HTMLTextAreaElement;
                  if (textarea) textarea.focus();
                }}
                disabled={!currentUser || isPostingQuestion}
              >
                <Reply className="h-3 w-3 mr-1"/> Responder
              </Button>
              {canDelete && (
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs h-auto px-2 py-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => { setCommentToDelete(item); setShowDeleteConfirmDialog(true);}}
                    disabled={isDeletingComment}
                >
                    <Trash2 className="h-3 w-3 mr-1"/> Eliminar
                </Button>
              )}
            </div>
            {item.replies && item.replies.length > 0 && (
              <div className={`mt-3 space-y-3 ${level === 0 ? 'border-l-2 border-primary/30 pl-3 sm:pl-4' : 'pl-0'}`}>
                {item.replies.map(reply => <RenderQnAItem key={reply.id} item={reply} level={level + 1} />)}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderLessonContentPlayer = () => {
    if (isLoadingLessonContent) {
        return <Skeleton className="aspect-video w-full rounded-lg shadow-inner" />;
    }
    if (!currentLesson) {
      return <div className="p-6 bg-card rounded-lg shadow-md text-muted-foreground flex items-center justify-center h-full">{(isInitialCourseLoad || !courseStructure) ? 'Cargando lección...' : 'Lección no encontrada o selecciona una para comenzar.'}</div>;
    }
    const { tipo, url, texto } = currentLesson.contenidoPrincipal;
    switch (tipo) {
      case 'video':
        if (!url) return <div className="p-6 bg-card rounded-lg shadow-md text-muted-foreground flex items-center justify-center h-full">URL del video no disponible.</div>;
        return <div className="aspect-video bg-black rounded-lg overflow-hidden shadow-xl"><video key={currentLesson.id + (url || '')} controls src={url} className="w-full h-full"><track kind="captions" /></video></div>;
      case 'documento_pdf':
        if (!url) return <div className="p-6 bg-card rounded-lg shadow-md text-muted-foreground flex items-center justify-center h-full">URL del PDF no disponible.</div>;
        return <div className="h-[60vh] md:h-[calc(100vh-280px)] bg-muted rounded-lg shadow-inner"><iframe key={currentLesson.id + (url || '')} src={url} width="100%" height="100%" className="border-0 rounded-lg" title={currentLesson.nombre}/></div>;
      case 'texto_rico':
        if (!texto) return <div className="p-6 bg-card rounded-lg shadow-md text-muted-foreground flex items-center justify-center h-full">Contenido de texto no disponible.</div>;
        return <Card className="h-full overflow-y-auto shadow-sm"><CardContent className="p-6"><div key={currentLesson.id + (texto || '')} className="prose max-w-none" dangerouslySetInnerHTML={{ __html: texto }} /></CardContent></Card>;
      default:
        return <div className="p-6 bg-card rounded-lg shadow-md flex items-center justify-center h-full">Contenido no disponible para tipo: {tipo}.</div>;
    }
  };

  const CourseNavigationSidebar = ({ onLessonClick }: { onLessonClick?: () => void }) => {
    if (!courseStructure) { 
      return (
         <div className="p-4">
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2 mb-4" />
            <Skeleton className="h-2 w-full mb-4" />
             {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-2 mb-3">
                <Skeleton className="h-8 w-full" />
                </div>
            ))}
        </div>
      );
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
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Cargando datos del curso...</p>
      </div>
    );
  }
  

const headerContent = (
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
);

const lessonPlayerSection = (
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
    </div>
);

const tabsSection = (
    <Tabs defaultValue="q&a" className="mt-8">
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-3 mb-4 bg-card shadow-sm">
        <TabsTrigger value="description" className="text-xs sm:text-sm"><Info className="h-4 w-4 mr-1 md:mr-2" />Descrip.</TabsTrigger>
        <TabsTrigger value="materials" className="text-xs sm:text-sm"><Download className="h-4 w-4 mr-1 md:mr-2" />Materiales</TabsTrigger>
        <TabsTrigger value="q&a" className="text-xs sm:text-sm"><HelpCircle className="h-4 w-4 mr-1 md:mr-2" />Preguntas y Respuestas</TabsTrigger>
        </TabsList>
        <TabsContent value="description"><Card><CardContent className="p-4 md:p-6 text-sm text-foreground/80"><p>{currentLesson?.descripcionBreve || "Descripción no disponible."}</p></CardContent></Card></TabsContent>
        <TabsContent value="materials"><Card><CardContent className="p-4 md:p-6 text-sm text-muted-foreground">No hay materiales adicionales para esta lección.</CardContent></Card></TabsContent>
        <TabsContent value="q&a">
        <Card>
            <CardHeader className="pb-4">
            <CardTitle className="text-lg font-headline">Preguntas y Respuestas</CardTitle>
            <CardDescription>Haz preguntas sobre esta lección o ayuda a otros estudiantes.</CardDescription>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
            <div className="mb-6">
                {replyingToCommentId && (
                <div className="mb-2 p-2 text-xs bg-primary/10 text-primary rounded-md flex justify-between items-center">
                    <span>Respondiendo a: <span className="font-semibold">@{replyingToUsername || 'Usuario'}</span></span>
                    <Button variant="ghost" size="sm" className="h-auto p-1 text-primary" onClick={() => { setReplyingToCommentId(null); setReplyingToUsername(null); }}>Cancelar</Button>
                </div>
                )}
                <Textarea 
                id="qna-textarea"
                placeholder={replyingToCommentId ? "Escribe tu respuesta aquí..." : "Escribe tu pregunta aquí..."}
                className="mb-2 text-sm" 
                value={newQuestionText}
                onChange={(e) => setNewQuestionText(e.target.value)}
                rows={3}
                disabled={isPostingQuestion || !currentUser}
                />
                <Button 
                size="sm" 
                onClick={handlePostQuestionOrReply}
                disabled={isPostingQuestion || !newQuestionText.trim() || !currentUser}
                >
                {isPostingQuestion ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                {replyingToCommentId ? "Publicar Respuesta" : "Publicar Pregunta"}
                </Button>
                {!currentUser && <p className="text-xs text-muted-foreground mt-1">Debes <Link href={`/login?redirect=${pathname}`} className="text-primary underline">iniciar sesión</Link> para preguntar o responder.</p>}
            </div>
            {isLoadingQuestions ? (
                <div className="flex items-center justify-center py-6"><Loader2 className="mr-2 h-5 w-5 animate-spin"/> Cargando...</div>
            ) : organizedQnA.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Sé el primero en hacer una pregunta sobre esta lección.</p>
            ) : (
                <div className="space-y-4">
                {organizedQnA.map((qna) => <RenderQnAItem key={qna.id} item={qna} />)}
                </div>
            )}
            </CardContent>
        </Card>
        </TabsContent>
    </Tabs>
);

return (
    <div className="flex h-screen md:h-[calc(100vh-theme(spacing.16))] bg-background overflow-hidden">
      <aside className="w-72 lg:w-80 border-r bg-card hidden md:flex flex-col">
        <CourseNavigationSidebar onLessonClick={() => {}} />
      </aside>
      <div className="flex-1 flex flex-col overflow-hidden">
        {headerContent}
        <ScrollArea className="flex-1 bg-secondary/30">
          <div className="max-w-4xl mx-auto">
            {lessonPlayerSection}
            <div className="px-4 sm:px-6 md:px-8 pb-8"> {/* Added pb-8 for spacing */}
                {tabsSection}
            </div>
          </div>
        </ScrollArea>
      </div>
      <AlertDialog open={showDeleteConfirmDialog} onOpenChange={setShowDeleteConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmar Eliminación?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. ¿Estás seguro de que quieres eliminar esta publicación?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCommentToDelete(null)} disabled={isDeletingComment}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteComment} disabled={isDeletingComment} className="bg-destructive hover:bg-destructive/90">
              {isDeletingComment ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
