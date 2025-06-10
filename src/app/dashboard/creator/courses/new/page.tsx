
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import type { CreateCourseDto } from '@/features/course/infrastructure/dto/create-course.dto';
import type { UpdateCourseDto } from '@/features/course/infrastructure/dto/update-course.dto';
import { type CourseAccessType, type CourseStatus, type CourseProperties } from '@/features/course/domain/entities/course.entity';
import type { ModuleProperties } from '@/features/course/domain/entities/module.entity';
import type { CreateModuleDto } from '@/features/course/infrastructure/dto/create-module.dto';
import type { CreateLessonDto } from '@/features/course/infrastructure/dto/create-lesson.dto';
import { type LessonProperties, type LessonContentType } from '@/features/course/domain/entities/lesson.entity';
import { ArrowRight, Loader2, Info, ListChecks, Settings, Image as ImageIcon, FileText, PlusCircle, UploadCloud, ChevronDown, Trash2, Edit } from 'lucide-react';
import { auth, storage } from '@/lib/firebase/config';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import Image from 'next/image';

// Step 1 Schema: Basic Course Information
const step1Schema = z.object({
  nombre: z.string().min(5, { message: 'El nombre del curso debe tener al menos 5 caracteres.' }),
  descripcionCorta: z.string().min(10, { message: 'La descripción corta es requerida (mín. 10 caracteres).' }).max(200, { message: 'Máximo 200 caracteres.'}),
  descripcionLarga: z.string().min(50, { message: 'La descripción larga es requerida (mín. 50 caracteres).' }),
  categoria: z.string().min(1, { message: 'La categoría es requerida.' }),
  tipoAcceso: z.enum(['unico', 'suscripcion'], { required_error: 'Debes seleccionar un tipo de acceso.' }),
  precio: z.coerce.number().min(0, { message: 'El precio debe ser 0 o mayor.' }),
  duracionEstimada: z.string().min(3, { message: 'La duración estimada es requerida.'}),
});
type Step1FormValues = z.infer<typeof step1Schema>;

// Step 2 Schema (for adding a module)
const moduleSchema = z.object({
  moduleName: z.string().min(3, { message: "El nombre del módulo debe tener al menos 3 caracteres."})
});
type ModuleFormValues = z.infer<typeof moduleSchema>;

// Step 2.5 Schema (for adding a lesson)
const lessonSchema = z.object({
  lessonName: z.string().min(3, "El nombre de la lección es requerido (mín. 3 caracteres)."),
  lessonContentType: z.enum(['video', 'documento_pdf', 'texto_rico', 'quiz', 'audio'], { required_error: "Debes seleccionar un tipo de contenido."}),
  lessonDuration: z.string().min(1, "La duración estimada es requerida."),
  lessonIsPreview: z.boolean().default(false),
});
type LessonFormValues = z.infer<typeof lessonSchema>;

const courseCategories = [
  "Desarrollo Web", "Desarrollo Móvil", "Data Science", "Marketing Digital", 
  "Diseño Gráfico", "Fotografía", "Negocios", "Finanzas Personales", 
  "Productividad", "Idiomas", "Música", "Salud y Bienestar"
];
const courseStatuses: CourseStatus[] = ['borrador', 'publicado', 'en_revision', 'archivado'];
const lessonContentTypes: LessonContentType[] = ['video', 'documento_pdf', 'texto_rico', 'quiz', 'audio'];


export default function NewCoursePage() {
  const { toast } = useToast();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<string>("info"); 
  const [isLoading, setIsLoading] = useState(false);
  
  const [createdCourseId, setCreatedCourseId] = useState<string | null>(null);
  const [courseDetails, setCourseDetails] = useState<CourseProperties | null>(null);
  
  // Modules state
  const [modules, setModules] = useState<ModuleProperties[]>([]);
  const [isModuleLoading, setIsModuleLoading] = useState(false);
  const [expandedModuleId, setExpandedModuleId] = useState<string | null>(null);
  const [moduleToDelete, setModuleToDelete] = useState<ModuleProperties | null>(null);
  const [showDeleteModuleDialog, setShowDeleteModuleDialog] = useState(false);


  // Lessons state
  const [lessonsByModule, setLessonsByModule] = useState<Record<string, LessonProperties[]>>({});
  const [isLessonLoading, setIsLessonLoading] = useState<Record<string, boolean>>({});

  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImagePreviewUrl, setCoverImagePreviewUrl] = useState<string | null>(null);
  const [videoTrailerUrlInput, setVideoTrailerUrlInput] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<CourseStatus>('borrador');
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  const formStep1 = useForm<Step1FormValues>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      nombre: '',
      descripcionCorta: '',
      descripcionLarga: '',
      categoria: '',
      tipoAcceso: undefined,
      precio: 0,
      duracionEstimada: '',
    },
  });

  const moduleForm = useForm<ModuleFormValues>({
    resolver: zodResolver(moduleSchema),
    defaultValues: { moduleName: '' }
  });
  
  const lessonForm = useForm<LessonFormValues>({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      lessonName: '',
      lessonContentType: undefined,
      lessonDuration: '',
      lessonIsPreview: false,
    }
  });


  useEffect(() => {
    if (courseDetails) {
      formStep1.reset({
        nombre: courseDetails.nombre || '',
        descripcionCorta: courseDetails.descripcionCorta || '',
        descripcionLarga: courseDetails.descripcionLarga || '',
        categoria: courseDetails.categoria || '',
        tipoAcceso: courseDetails.tipoAcceso,
        precio: courseDetails.precio ?? 0,
        duracionEstimada: courseDetails.duracionEstimada || '',
      });
      setCoverImagePreviewUrl(courseDetails.imagenPortadaUrl || null);
      setVideoTrailerUrlInput(courseDetails.videoTrailerUrl || '');
      setSelectedStatus(courseDetails.estado || 'borrador');
    }
  }, [courseDetails, formStep1]);


  const fetchModules = useCallback(async (courseId: string) => {
    if (!courseId) return;
    setIsModuleLoading(true);
    try {
      const response = await fetch(`/api/courses/${courseId}/modules`);
      if (!response.ok) throw new Error("Error al cargar módulos.");
      const data = await response.json();
      setModules(data.modules || []);
    } catch (error: any) {
      toast({ title: "Error al Cargar Módulos", description: error.message, variant: "destructive" });
    } finally {
      setIsModuleLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (createdCourseId) {
      fetchModules(createdCourseId);
    }
  }, [createdCourseId, fetchModules]);

  const fetchLessonsForModule = useCallback(async (courseId: string, moduleId: string) => {
    if (!courseId || !moduleId) return;
    setIsLessonLoading(prev => ({ ...prev, [moduleId]: true }));
    try {
      const response = await fetch(`/api/courses/${courseId}/modules/${moduleId}/lessons`);
      if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.details || errorData.error || "Error al cargar lecciones.");
      }
      const data = await response.json();
      setLessonsByModule(prev => ({ ...prev, [moduleId]: data.lessons || [] }));
    } catch (error: any) {
      toast({ title: `Error al Cargar Lecciones (Módulo ${moduleId})`, description: error.message, variant: "destructive" });
      setLessonsByModule(prev => ({ ...prev, [moduleId]: [] }));
    } finally {
      setIsLessonLoading(prev => ({ ...prev, [moduleId]: false }));
    }
  }, [toast]);

  const handleToggleModuleLessons = (moduleId: string) => {
    if (expandedModuleId === moduleId) {
      setExpandedModuleId(null);
    } else {
      setExpandedModuleId(moduleId);
      lessonForm.reset({ 
        lessonName: '',
        lessonContentType: undefined,
        lessonDuration: '',
        lessonIsPreview: false,
      }); 
      if (createdCourseId && (!lessonsByModule[moduleId] || lessonsByModule[moduleId]?.length === 0)) { 
        fetchLessonsForModule(createdCourseId, moduleId);
      }
    }
  };


  const onSubmitStep1 = async (values: Step1FormValues) => {
    if (!auth.currentUser) {
      toast({ title: "Error de autenticación", description: "Debes iniciar sesión.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const idToken = await auth.currentUser.getIdToken(true);
      const endpoint = createdCourseId ? `/api/courses/update/${createdCourseId}` : '/api/courses/create';
      const method = "POST";
      
      const dto: CreateCourseDto | UpdateCourseDto = { ...values, tipoAcceso: values.tipoAcceso as CourseAccessType };
      
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}`},
        body: JSON.stringify(dto),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Error al procesar la información del curso.');
      }

      const responseData = await response.json();
      if (responseData.course) {
        setCourseDetails(responseData.course);
      }
      if (responseData.courseId && !createdCourseId) {
         setCreatedCourseId(responseData.courseId);
      }
      toast({ 
        title: "Paso 1 Completado", 
        description: createdCourseId && method === "POST" && endpoint.includes("/update/") ? "Información del curso actualizada." : "Curso creado. Ahora define la estructura."
      });
      setCurrentStep("structure"); 
    } catch (error: any) {
      toast({ title: "Error Paso 1", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const onAddModule = async (values: ModuleFormValues) => {
    if (!createdCourseId || !auth.currentUser) { 
      toast({ title: "Error", description: "Curso no creado o usuario no autenticado.", variant: "destructive" });
      return; 
    }
    setIsModuleLoading(true);
    try {
      const idToken = await auth.currentUser.getIdToken(true);
      const dto: CreateModuleDto = { nombre: values.moduleName };
      const response = await fetch(`/api/courses/${createdCourseId}/modules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}`},
        body: JSON.stringify(dto),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || "Error al crear el módulo.");
      }
      toast({title: "Módulo Creado"});
      moduleForm.reset();
      await fetchModules(createdCourseId); 
    } catch (error: any) {
      toast({title: "Error al Añadir Módulo", description: error.message, variant: "destructive"});
    } finally {
      setIsModuleLoading(false);
    }
  };
  
  const onAddLesson = async (moduleId: string, values: LessonFormValues) => {
    if (!createdCourseId || !auth.currentUser) { 
      toast({ title: "Error", description: "Curso no creado o usuario no autenticado.", variant: "destructive" });
      return;
    }
    if (!values.lessonContentType) {
        toast({ title: "Campo Requerido", description: "Por favor, selecciona un tipo de contenido para la lección.", variant: "destructive" });
        lessonForm.setError("lessonContentType", { type: "manual", message: "Debes seleccionar un tipo de contenido." });
        return;
    }

    setIsLessonLoading(prev => ({ ...prev, [moduleId]: true }));
    try {
      const idToken = await auth.currentUser.getIdToken(true);
      const dto: CreateLessonDto = {
        nombre: values.lessonName,
        contenidoPrincipal: { tipo: values.lessonContentType as LessonContentType },
        duracionEstimada: values.lessonDuration,
        esVistaPrevia: values.lessonIsPreview,
      };
      const response = await fetch(`/api/courses/${createdCourseId}/modules/${moduleId}/lessons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}`},
        body: JSON.stringify(dto),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || "Error al crear la lección.");
      }
      toast({title: "Lección Creada", description: `Lección "${values.lessonName}" añadida al módulo.`});
      lessonForm.reset({ 
        lessonName: '',
        lessonContentType: undefined,
        lessonDuration: '',
        lessonIsPreview: false,
      }); 
      await fetchLessonsForModule(createdCourseId, moduleId);
    } catch (error: any) {
      toast({title: "Error al Añadir Lección", description: error.message, variant: "destructive"});
    } finally {
      setIsLessonLoading(prev => ({ ...prev, [moduleId]: false }));
    }
  };

  const handleDeleteModule = async () => {
    if (!moduleToDelete || !createdCourseId || !auth.currentUser) {
      toast({ title: "Error", description: "No se pudo determinar el módulo a eliminar o falta información del curso/usuario.", variant: "destructive" });
      setShowDeleteModuleDialog(false);
      return;
    }
    setIsModuleLoading(true);
    try {
      const idToken = await auth.currentUser.getIdToken(true);
      const response = await fetch(`/api/courses/${createdCourseId}/modules/${moduleToDelete.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${idToken}`},
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || "Error al eliminar el módulo.");
      }
      toast({ title: "Módulo Eliminado", description: `El módulo "${moduleToDelete.nombre}" ha sido eliminado.` });
      setModuleToDelete(null);
      await fetchModules(createdCourseId); 
      if (expandedModuleId === moduleToDelete.id) { // Collapse if the deleted module was open
        setExpandedModuleId(null);
      }
    } catch (error: any) {
      toast({ title: "Error al Eliminar Módulo", description: error.message, variant: "destructive" });
    } finally {
      setIsModuleLoading(false);
      setShowDeleteModuleDialog(false);
    }
  };


  const handleCoverImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "Archivo Demasiado Grande", description: "La imagen de portada no debe exceder los 5MB.", variant: "destructive"});
        return;
      }
      if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.type)) {
          toast({ title: "Tipo de Archivo Inválido", description: "Por favor, sube un archivo de imagen (PNG, JPG, WEBP, GIF).", variant: "destructive"});
          return;
      }
      setCoverImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImagePreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setCoverImageFile(null);
      setCoverImagePreviewUrl(courseDetails?.imagenPortadaUrl || null);
    }
  };

  const onSaveSettings = async () => {
    if (!createdCourseId || !auth.currentUser) {
      toast({title: "Error", description: "No hay curso creado o usuario no autenticado.", variant: "destructive"});
      return;
    }
    setIsSavingSettings(true);
    setIsUploadingCover(!!coverImageFile);

    let finalImageUrl = courseDetails?.imagenPortadaUrl || null;

    try {
      const idToken = await auth.currentUser.getIdToken(true);

      if (coverImageFile) {
        const fileExtension = coverImageFile.name.split('.').pop()?.toLowerCase() || 'png';
        const storagePath = `cursos/${createdCourseId}/portada/cover.${fileExtension}`;
        const imageRef = ref(storage, storagePath);
        
        await uploadBytes(imageRef, coverImageFile);
        finalImageUrl = await getDownloadURL(imageRef);
        setCoverImagePreviewUrl(finalImageUrl); 
        setCoverImageFile(null); 
        toast({title: "Imagen Subida", description: "La imagen de portada se ha subido."});
      }
      setIsUploadingCover(false);

      const dto: UpdateCourseDto = {
        imagenPortadaUrl: finalImageUrl,
        dataAiHintImagenPortada: finalImageUrl ? (courseDetails?.nombre.substring(0,20) || 'course cover') : null,
        videoTrailerUrl: videoTrailerUrlInput || null,
        estado: selectedStatus,
      };

      const response = await fetch(`/api/courses/update/${createdCourseId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}`},
        body: JSON.stringify(dto),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Error al guardar la configuración.');
      }
      const responseData = await response.json();
      if(responseData.course) {
        setCourseDetails(responseData.course); 
      }
      toast({ title: "Configuración Guardada", description: "Los ajustes de publicación se han actualizado."});

    } catch (error: any) {
      console.error("Error al guardar configuración:", error);
      toast({ title: "Error al Guardar", description: error.message, variant: "destructive" });
      setIsUploadingCover(false);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const getTabClass = (tabValue: string) => {
    let baseClass = "flex items-center gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-inner";
    if (tabValue === currentStep) return baseClass;
    
    if (currentStep === "structure" && tabValue === "info") return baseClass;
    if (currentStep === "settings" && (tabValue === "info" || tabValue === "structure")) return baseClass;

    if (tabValue === "structure" && !createdCourseId) return `${baseClass} opacity-50 cursor-not-allowed`;
    if (tabValue === "settings" && !createdCourseId) return `${baseClass} opacity-50 cursor-not-allowed`;
    
    return baseClass;
  };


  const handleNextStep = () => {
    if (currentStep === "info" && createdCourseId) setCurrentStep("structure");
    else if (currentStep === "structure" && createdCourseId) setCurrentStep("settings");
  };
  const handlePreviousStep = () => {
    if (currentStep === "settings") setCurrentStep("structure");
    else if (currentStep === "structure") setCurrentStep("info");
  };


  return (
    <div className="container mx-auto py-8 px-4 md:px:6">
      <Card className="max-w-4xl mx-auto shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-headline">{createdCourseId ? `Editando Curso: ${courseDetails?.nombre || ''}` : "Crear Nuevo Curso"}</CardTitle>
          <CardDescription>Completa los siguientes pasos para configurar tu curso.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={currentStep} onValueChange={(newStep) => {
            if (newStep === "info" || 
                (newStep === "structure" && createdCourseId) || 
                (newStep === "settings" && createdCourseId)) {
              setCurrentStep(newStep);
            } else {
              toast({title: "Paso Bloqueado", description: "Completa los pasos anteriores primero para habilitar esta sección.", variant: "default"});
            }
          }} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="info" className={getTabClass("info")} disabled={isLoading || isSavingSettings}>
                <Info className="h-5 w-5" /> Información
              </TabsTrigger>
              <TabsTrigger value="structure" className={getTabClass("structure")} disabled={isLoading || isSavingSettings || !createdCourseId}>
                <ListChecks className="h-5 w-5" /> Estructura y Contenido
              </TabsTrigger>
              <TabsTrigger value="settings" className={getTabClass("settings")} disabled={isLoading || isSavingSettings || !createdCourseId}>
                <Settings className="h-5 w-5" /> Publicación
              </TabsTrigger>
            </TabsList>

            <TabsContent value="info">
              <Card>
                <CardHeader>
                  <CardTitle>1. Información Básica del Curso</CardTitle>
                  <CardDescription>Define los detalles fundamentales de tu curso.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...formStep1}>
                    <form onSubmit={formStep1.handleSubmit(onSubmitStep1)} className="space-y-6">
                      <FormField control={formStep1.control} name="nombre" render={({ field }) => (<FormItem><FormLabel>Nombre del Curso</FormLabel><FormControl><Input placeholder="Ej: Curso Completo de Next.js y Firebase" {...field} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={formStep1.control} name="descripcionCorta" render={({ field }) => (<FormItem><FormLabel>Descripción Corta</FormLabel><FormControl><Input placeholder="Un resumen atractivo (máx. 200 caracteres)" {...field} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={formStep1.control} name="descripcionLarga" render={({ field }) => (<FormItem><FormLabel>Descripción Larga</FormLabel><FormControl><Textarea rows={6} placeholder="Describe en detalle tu curso..." {...field} /></FormControl><FormDescription>Puedes usar Markdown.</FormDescription><FormMessage /></FormItem>)} />
                      <div className="grid md:grid-cols-2 gap-6">
                        <FormField control={formStep1.control} name="categoria" render={({ field }) => (<FormItem><FormLabel>Categoría</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecciona categoría" /></SelectTrigger></FormControl><SelectContent>{courseCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                        <FormField control={formStep1.control} name="tipoAcceso" render={({ field }) => (<FormItem><FormLabel>Tipo de Acceso</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecciona tipo de acceso" /></SelectTrigger></FormControl><SelectContent><SelectItem value="unico">Pago Único</SelectItem><SelectItem value="suscripcion">Suscripción</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                      </div>
                      <div className="grid md:grid-cols-2 gap-6">
                        <FormField control={formStep1.control} name="precio" render={({ field }) => (<FormItem><FormLabel>Precio (USD)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="Ej: 49.99" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={formStep1.control} name="duracionEstimada" render={({ field }) => (<FormItem><FormLabel>Duración Estimada</FormLabel><FormControl><Input placeholder="Ej: 20 horas de video" {...field} /></FormControl><FormMessage /></FormItem>)} />
                      </div>
                      <div className="flex justify-end pt-4"><Button type="submit" disabled={isLoading}>{isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}{createdCourseId ? "Actualizar y Continuar" : "Guardar y Continuar"} <ArrowRight className="ml-2 h-4 w-4" /></Button></div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="structure">
              <Card>
                <CardHeader>
                  <CardTitle>2. Estructura y Contenido del Curso</CardTitle>
                  <CardDescription>Organiza los módulos y añade lecciones a tu curso.</CardDescription>
                </CardHeader>
                <CardContent>
                  {createdCourseId ? (
                    <>
                      <p className="mb-4 text-sm text-muted-foreground">Editando estructura para: {courseDetails?.nombre || `ID: ${createdCourseId}`}</p>
                      
                      <Form {...moduleForm}>
                        <form onSubmit={moduleForm.handleSubmit(onAddModule)} className="flex items-start gap-4 mb-6 p-4 border rounded-md shadow-sm">
                          <FormField control={moduleForm.control} name="moduleName" render={({ field }) => (<FormItem className="flex-grow"><FormLabel className="sr-only">Nombre del Módulo</FormLabel><FormControl><Input placeholder="Nombre del nuevo módulo" {...field} disabled={isModuleLoading} /></FormControl><FormMessage /></FormItem>)} />
                          <Button type="submit" disabled={isModuleLoading}>{isModuleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4"/>}Añadir Módulo</Button>
                        </form>
                      </Form>

                      {isModuleLoading && modules.length === 0 && <div className="text-center py-2"><Loader2 className="h-5 w-5 animate-spin inline-block mr-2" />Cargando módulos...</div>}
                      {!isModuleLoading && modules.length === 0 && (<p className="text-muted-foreground text-center py-4">Aún no has añadido módulos. Comienza creando uno.</p>)}
                      
                      {modules.length > 0 && (
                        <div className="space-y-4 mt-6">
                          <h4 className="text-lg font-semibold mb-2">Módulos del Curso:</h4>
                          <Accordion type="single" collapsible className="w-full" value={expandedModuleId || undefined} onValueChange={handleToggleModuleLessons}>
                            {modules.sort((a,b) => a.orden - b.orden).map(module => (
                              <AccordionItem value={module.id} key={module.id} className="border-b">
                                <AccordionTrigger className="hover:no-underline bg-secondary/50 px-4 py-3 rounded-md hover:bg-secondary/70 data-[state=open]:rounded-b-none">
                                  <div className="flex justify-between items-center w-full">
                                    <span className="font-medium text-left">{module.nombre}</span>
                                    <div className="flex items-center gap-1">
                                        <span className="text-xs text-muted-foreground">{lessonsByModule[module.id]?.length || 0} lecciones</span>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-60 hover:opacity-100" onClick={(e) => { e.stopPropagation(); /* TODO: Implement Edit Module */ toast({title: "Próximamente", description: "Edición de módulo aún no implementada."}) }}>
                                            <Edit className="h-3.5 w-3.5"/>
                                            <span className="sr-only">Editar módulo</span>
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/70 hover:text-destructive hover:bg-destructive/10 opacity-60 hover:opacity-100" 
                                            onClick={(e) => { 
                                                e.stopPropagation(); 
                                                setModuleToDelete(module); 
                                                setShowDeleteModuleDialog(true); 
                                            }}>
                                            <Trash2 className="h-3.5 w-3.5"/>
                                            <span className="sr-only">Eliminar módulo</span>
                                        </Button>
                                    </div>
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent className="pt-0 pb-2 px-2 border-x border-b rounded-b-md border-primary/20 ml-0">
                                  <Card className="shadow-none border-0 rounded-none">
                                    <CardHeader className="px-2 pt-3 pb-2">
                                      <CardTitle className="text-base">Lecciones del Módulo: {module.nombre}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="px-2 pb-2">
                                      <Form {...lessonForm}>
                                        <form onSubmit={lessonForm.handleSubmit((data) => onAddLesson(module.id, data))} className="space-y-4 mb-6 p-3 border rounded-md bg-background">
                                          <h5 className="font-medium text-sm">Añadir Nueva Lección</h5>
                                          <FormField control={lessonForm.control} name="lessonName" render={({ field }) => (<FormItem><FormLabel className="text-xs">Nombre Lección</FormLabel><FormControl><Input placeholder="Título de la lección" {...field} disabled={isLessonLoading[module.id]} /></FormControl><FormMessage /></FormItem>)} />
                                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <FormField control={lessonForm.control} name="lessonContentType" render={({ field }) => (<FormItem><FormLabel className="text-xs">Tipo Contenido</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={isLessonLoading[module.id]}><FormControl><SelectTrigger><SelectValue placeholder="Selecciona tipo" /></SelectTrigger></FormControl><SelectContent>{lessonContentTypes.map(type => <SelectItem key={type} value={type}>{type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                                            <FormField control={lessonForm.control} name="lessonDuration" render={({ field }) => (<FormItem><FormLabel className="text-xs">Duración Estimada</FormLabel><FormControl><Input placeholder="Ej: 10 min, 3 págs" {...field} disabled={isLessonLoading[module.id]} /></FormControl><FormMessage /></FormItem>)} />
                                          </div>
                                          <FormField control={lessonForm.control} name="lessonIsPreview" render={({ field }) => (<FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3 shadow-sm bg-background"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isLessonLoading[module.id]} /></FormControl><div className="space-y-1 leading-none"><FormLabel className="text-xs">¿Es vista previa gratuita?</FormLabel></div></FormItem>)} />
                                          <Button type="submit" size="sm" disabled={isLessonLoading[module.id] || !createdCourseId}>{isLessonLoading[module.id] ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}Añadir Lección</Button>
                                        </form>
                                      </Form>
                                      
                                      {isLessonLoading[module.id] && (!lessonsByModule[module.id] || lessonsByModule[module.id]?.length === 0) && <div className="text-xs text-muted-foreground text-center py-2"><Loader2 className="h-4 w-4 animate-spin inline-block mr-1" />Cargando lecciones...</div>}
                                      {!isLessonLoading[module.id] && (!lessonsByModule[module.id] || lessonsByModule[module.id]?.length === 0) && (<p className="text-xs text-muted-foreground text-center py-3">Aún no has añadido lecciones a este módulo.</p>)}
                                      
                                      {lessonsByModule[module.id] && lessonsByModule[module.id]!.length > 0 && (
                                        <div className="space-y-2 mt-4">
                                          <h6 className="text-xs font-semibold text-muted-foreground">Lecciones Existentes:</h6>
                                          <ul className="divide-y divide-border">
                                            {lessonsByModule[module.id]!.sort((a,b)=> a.orden - b.orden).map(lesson => (
                                              <li key={lesson.id} className="text-foreground/90 hover:bg-secondary/20 p-2 rounded-sm flex justify-between items-center text-sm">
                                                <div>
                                                    <span className="font-medium">{lesson.nombre}</span> <span className="text-xs text-muted-foreground">({lesson.contenidoPrincipal.tipo.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())})</span>
                                                    {lesson.esVistaPrevia && <Badge variant="outline" className="ml-2 text-xs">Vista Previa</Badge>}
                                                </div>
                                                <div className="flex items-center gap-0.5">
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-50 hover:opacity-100" onClick={() => toast({title: "Próximamente", description: "Edición de lección aún no implementada."})}>
                                                        <Edit className="h-3 w-3"/>
                                                        <span className="sr-only">Editar lección</span>
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive/60 hover:text-destructive hover:bg-destructive/10 opacity-50 hover:opacity-100" onClick={() => toast({title: "Próximamente", description: "Eliminación de lección aún no implementada."})}>
                                                        <Trash2 className="h-3 w-3"/>
                                                        <span className="sr-only">Eliminar lección</span>
                                                    </Button>
                                                </div>
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                    </CardContent>
                                  </Card>
                                </AccordionContent>
                              </AccordionItem>
                            ))}
                          </Accordion>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">Completa el paso de Información Básica primero para poder añadir módulos y lecciones.</p>
                  )}
                  <div className="flex justify-between pt-6 mt-4 border-t">
                      <Button type="button" variant="outline" onClick={handlePreviousStep} disabled={isLoading || isModuleLoading || isSavingSettings}>Anterior</Button>
                      <Button type="button" onClick={handleNextStep} disabled={isLoading || isModuleLoading || isSavingSettings || !createdCourseId}>Siguiente <ArrowRight className="ml-2 h-4 w-4" /></Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings">
               <Card>
                <CardHeader>
                  <CardTitle>3. Publicación y Configuración Adicional</CardTitle>
                  <CardDescription>Define la imagen de portada, video trailer y el estado de publicación.</CardDescription>
                </CardHeader>
                <CardContent>
                   {createdCourseId ? (
                    <div className="space-y-8">
                       <p className="mb-1 text-sm text-muted-foreground">Ajustes para: {courseDetails?.nombre || `ID: ${createdCourseId}`}</p>
                      <Card className="p-4 shadow-sm">
                          <div className="flex items-center gap-2 mb-3">
                              <ImageIcon className="h-5 w-5 text-primary"/>
                              <h4 className="font-semibold text-lg">Imagen de Portada</h4>
                          </div>
                          {coverImagePreviewUrl && (
                            <div className="mb-4 relative aspect-video max-w-sm mx-auto rounded-md overflow-hidden border">
                              <Image src={coverImagePreviewUrl} alt="Vista previa de portada" layout="fill" objectFit="cover" data-ai-hint="course cover preview"/>
                            </div>
                          )}
                          <div className="relative">
                            <Input 
                                id="coverImage"
                                type="file" 
                                accept="image/png, image/jpeg, image/webp, image/gif"
                                onChange={handleCoverImageChange} 
                                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
                                disabled={isSavingSettings || isUploadingCover}
                            />
                             <Button type="button" variant="outline" className="w-full pointer-events-none relative">
                                {isUploadingCover && <UploadCloud className="mr-2 h-4 w-4 animate-pulse" />}
                                {!isUploadingCover && <ImageIcon className="mr-2 h-4 w-4" />}
                                {isUploadingCover ? 'Subiendo...' : (coverImageFile ? (coverImageFile.name.length > 30 ? coverImageFile.name.substring(0,27) + '...' : coverImageFile.name) : 'Seleccionar Imagen de Portada')}
                            </Button>
                           </div>
                           <p className="mt-1 text-xs text-muted-foreground text-center">Sube una imagen atractiva (recomendado 1200x675px, máx 5MB).</p>
                      </Card>
                       <Card className="p-4 shadow-sm">
                          <div className="flex items-center gap-2 mb-3">
                              <FileText className="h-5 w-5 text-primary"/>
                              <h4 className="font-semibold text-lg">Video Trailer (Opcional)</h4>
                          </div>
                          <Input 
                            placeholder="URL de YouTube o Vimeo" 
                            value={videoTrailerUrlInput}
                            onChange={(e) => setVideoTrailerUrlInput(e.target.value)}
                            disabled={isSavingSettings}
                          />
                           <p className="mt-1 text-xs text-muted-foreground">Un video corto para promocionar tu curso.</p>
                      </Card>
                       <Card className="p-4 shadow-sm">
                          <div className="flex items-center gap-2 mb-3">
                              <Settings className="h-5 w-5 text-primary"/>
                              <h4 className="font-semibold text-lg">Estado de Publicación</h4>
                          </div>
                            <Select 
                                onValueChange={(value) => setSelectedStatus(value as CourseStatus)} 
                                value={selectedStatus}
                                disabled={isSavingSettings}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona un estado" />
                                </SelectTrigger>
                                <SelectContent>
                                {courseStatuses.map(status => (
                                    <SelectItem key={status} value={status}>
                                    {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                                    </SelectItem>
                                ))}
                                </SelectContent>
                            </Select>
                           <p className="mt-1 text-xs text-muted-foreground">Define si el curso es un borrador o está publicado.</p>
                      </Card>

                      <div className="flex justify-end pt-4">
                        <Button onClick={onSaveSettings} disabled={isSavingSettings || isUploadingCover}>
                          {isSavingSettings || isUploadingCover ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                          {isSavingSettings ? (isUploadingCover ? 'Subiendo imagen...' : 'Guardando...') : 'Guardar Cambios de Publicación'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">Completa los pasos anteriores para acceder a la configuración de publicación.</p>
                  )}
                   <div className="flex justify-between pt-6 mt-4 border-t">
                       <Button type="button" variant="outline" onClick={handlePreviousStep} disabled={isLoading || isSavingSettings || isModuleLoading}>Anterior</Button>
                       <Button 
                         type="button" 
                         onClick={() => {
                           if (createdCourseId) {
                             router.push(`/dashboard/creator/courses`); 
                           } else {
                             router.push('/dashboard/creator/courses');
                           }
                         }} 
                         disabled={isLoading || isSavingSettings || isModuleLoading || !createdCourseId}
                       >
                         {createdCourseId ? "Finalizar e Ir al Listado" : "Ir al Listado (Guarda primero)"}
                       </Button>
                    </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      <AlertDialog open={showDeleteModuleDialog} onOpenChange={setShowDeleteModuleDialog}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro de que quieres eliminar este módulo?</AlertDialogTitle>
            <AlertDialogDescription>
                Esta acción no se puede deshacer. Se eliminará el módulo <span className="font-semibold">"{moduleToDelete?.nombre}"</span> y todas las lecciones que contiene.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setModuleToDelete(null)} disabled={isModuleLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteModule} disabled={isModuleLoading} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                {isModuleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Eliminar Módulo
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
     </AlertDialog>
    </div>
  );
}

