
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import type { CreateCourseDto } from '@/backend/course/infrastructure/dto/create-course.dto';
import type { UpdateCourseDto } from '@/backend/course/infrastructure/dto/update-course.dto';
import { type CourseAccessType, type CourseStatus, type CourseProperties } from '@/backend/course/domain/entities/course.entity';
import type { ModuleEntity, ModuleProperties } from '@/backend/course/domain/entities/module.entity';
import type { CreateModuleDto } from '@/backend/course/infrastructure/dto/create-module.dto';
import type { UpdateModuleDto } from '@/backend/course/infrastructure/dto/update-module.dto';
import type { CreateLessonDto } from '@/backend/course/infrastructure/dto/create-lesson.dto';
import type { UpdateLessonDto } from '@/backend/course/infrastructure/dto/update-lesson.dto';
import { type LessonProperties, type LessonContentType } from '@/backend/course/domain/entities/lesson.entity';
import { MiniStudioDialog } from '@/components/dashboard/courses/MiniStudioDialog';
import { CourseCoverManager } from '@/components/dashboard/courses/CourseCoverManager';
import { ReferralPolicySelector } from '@/components/dashboard/ReferralPolicySelector';
import { ArrowRight, Loader2, Info, ListChecks, Settings, Image as ImageIcon, FileText, PlusCircle, UploadCloud, GripVertical, Trash2, Edit, Rocket, Eye, Percent, Wand2, Sparkles, Brain } from 'lucide-react';
import { auth, storage } from '@/lib/firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Image from 'next/image';
import { DragDropContext, Droppable, Draggable, type OnDragEndResponder, type DropResult } from 'react-beautiful-dnd';
import { Badge } from '@/components/ui/badge';


// Step 1 Schema: Basic Course Information
const step1Schema = z.object({
  nombre: z.string().min(5, { message: 'El nombre del curso debe tener al menos 5 caracteres.' }),
  descripcionCorta: z.string().min(10, { message: 'La descripción corta es requerida (mín. 10 caracteres).' }).max(200, { message: 'Máximo 200 caracteres.'}),
  descripcionLarga: z.string().min(50, { message: 'La descripción larga es requerida (mín. 50 caracteres).' }),
  categoria: z.string().min(1, { message: 'La categoría es requerida.' }),
  tipoAcceso: z.enum(['unico', 'suscripcion'], { required_error: 'Debes seleccionar un tipo de acceso.' }),
  precio: z.coerce.number().min(0, { message: 'El precio debe ser 0 o mayor.' }),
  duracionEstimada: z.string().min(3, { message: 'La duración estimada es requerida.'}),
  referralPolicyId: z.string().optional().nullable(),
});
type Step1FormValues = z.infer<typeof step1Schema>;

const moduleSchema = z.object({
  moduleName: z.string().min(3, { message: "El nombre del módulo debe tener al menos 3 caracteres."}),
  moduleDescription: z.string().optional(),
});
type ModuleFormValues = z.infer<typeof moduleSchema>;

const editModuleSchema = z.object({
  moduleName: z.string().min(3, { message: "El nombre del módulo debe tener al menos 3 caracteres."}),
  moduleDescription: z.string().optional(),
});
type EditModuleFormValues = z.infer<typeof editModuleSchema>;

const lessonSchema = z.object({
  lessonName: z.string().min(3, "El nombre de la lección es requerido (mín. 3 caracteres)."),
  lessonContentType: z.enum(['video', 'documento_pdf', 'texto_rico', 'quiz', 'audio'], { required_error: "Debes seleccionar un tipo de contenido."}),
  lessonDuration: z.string().min(1, "La duración estimada es requerida."),
  lessonIsPreview: z.boolean().default(false),
  lessonContentText: z.string().optional(), 
});
type LessonFormValues = z.infer<typeof lessonSchema>;

const editLessonSchema = z.object({
  lessonName: z.string().min(3, "El nombre de la lección es requerido (mín. 3 caracteres)."),
  lessonContentType: z.enum(['video', 'documento_pdf', 'texto_rico', 'quiz', 'audio'], { required_error: "Debes seleccionar un tipo de contenido."}),
  lessonDuration: z.string().min(1, "La duración estimada es requerida."),
  lessonIsPreview: z.boolean().default(false),
  lessonContentText: z.string().optional(),
});
type EditLessonFormValues = z.infer<typeof editLessonSchema>;


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
  
  const [modules, setModules] = useState<ModuleProperties[]>([]);
  const [isModuleLoading, setIsModuleLoading] = useState(false);
  const [expandedModuleId, setExpandedModuleId] = useState<string | null>(null);
  const [moduleToDelete, setModuleToDelete] = useState<ModuleProperties | null>(null);
  const [showDeleteModuleDialog, setShowDeleteModuleDialog] = useState(false);
  const [currentEditingModule, setCurrentEditingModule] = useState<ModuleProperties | null>(null);
  const [showEditModuleDialog, setShowEditModuleDialog] = useState(false);
  const [isEditingModule, setIsEditingModule] = useState(false);
  const [isReorderingModules, setIsReorderingModules] = useState(false);


  const [lessonsByModule, setLessonsByModule] = useState<Record<string, LessonProperties[]>>({});
  const [isLessonLoading, setIsLessonLoading] = useState<Record<string, boolean>>({}); 
  const [currentEditingLesson, setCurrentEditingLesson] = useState<LessonProperties | null>(null);
  const [showEditLessonDialog, setShowEditLessonDialog] = useState(false);
  const [isEditingLesson, setIsEditingLesson] = useState(false);
  const [lessonToDelete, setLessonToDelete] = useState<LessonProperties | null>(null);
  const [showDeleteLessonDialog, setShowDeleteLessonDialog] = useState(false);
  const [isDeletingLesson, setIsDeletingLesson] = useState(false);
  const [isReorderingLessons, setIsReorderingLessons] = useState<Record<string, boolean>>({});

  const [isPreviewLessonDialogOpen, setIsPreviewLessonDialogOpen] = useState(false);
  const [lessonToPreview, setLessonToPreview] = useState<LessonProperties | null>(null);


  const [lessonContentFile, setLessonContentFile] = useState<File | null>(null);
  const [isUploadingContent, setIsUploadingContent] = useState(false);
  const [selectedLessonContentType, setSelectedLessonContentType] = useState<LessonContentType | undefined>(undefined);


  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImagePreviewUrl, setCoverImagePreviewUrl] = useState<string | null>(null);
  const [videoTrailerUrlInput, setVideoTrailerUrlInput] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<CourseStatus>('borrador');
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  const [aiPrompt, setAiPrompt] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);

  const handleGenerateAiStructure = async () => {
    if (!createdCourseId) {
      toast({ title: "Primero crea el curso", description: "Guarda la información básica antes de usar el Asistente AI.", variant: "destructive" });
      return;
    }
    if (!aiPrompt.trim()) return;

    setIsAiLoading(true);
    try {
      const user = auth.currentUser;
      const idToken = await user?.getIdToken();
      const response = await fetch(`/api/courses/${createdCourseId}/ai-structure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify({ prompt: aiPrompt }),
      });
      
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || errData.details || "Falló la generación");
      }
      
      toast({ title: "¡Estructura Generada!", description: "El Asistente Consciousness ha construido tus módulos." });
      setAiPrompt("");
      // Refresh local state by refetching structure
      if (typeof fetchCourseStructure === 'function') {
        await fetchCourseStructure(createdCourseId);
      }
    } catch (error: any) {
      toast({ title: "Error AI", description: error.message, variant: "destructive" });
    } finally {
      setIsAiLoading(false);
    }
  };

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
      referralPolicyId: null,
    },
  });

  const moduleForm = useForm<ModuleFormValues>({
    resolver: zodResolver(moduleSchema),
    defaultValues: { moduleName: '', moduleDescription: '' }
  });

  const editModuleForm = useForm<EditModuleFormValues>({
    resolver: zodResolver(editModuleSchema),
    defaultValues: { moduleName: '', moduleDescription: '' }
  });
  
  const lessonForm = useForm<LessonFormValues>({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      lessonName: '',
      lessonContentType: undefined,
      lessonDuration: '',
      lessonIsPreview: false,
      lessonContentText: '',
    }
  });

  const editLessonForm = useForm<EditLessonFormValues>({
    resolver: zodResolver(editLessonSchema),
    defaultValues: {
      lessonName: '',
      lessonContentType: undefined,
      lessonDuration: '',
      lessonIsPreview: false,
      lessonContentText: '',
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
        referralPolicyId: courseDetails.referralPolicyId === undefined ? null : courseDetails.referralPolicyId,
      });
      setCoverImagePreviewUrl(courseDetails.imagenPortadaUrl || null);
      setVideoTrailerUrlInput(courseDetails.videoTrailerUrl || '');
      setSelectedStatus(courseDetails.estado || 'borrador');
    }
  }, [courseDetails, formStep1]);

  useEffect(() => {
    if (currentEditingModule && showEditModuleDialog) {
      editModuleForm.reset({
        moduleName: currentEditingModule.nombre,
        moduleDescription: currentEditingModule.descripcion || ''
      });
    }
  }, [currentEditingModule, showEditModuleDialog, editModuleForm]);

   useEffect(() => {
    if (currentEditingLesson && showEditLessonDialog) {
      editLessonForm.reset({
        lessonName: currentEditingLesson.nombre,
        lessonContentType: currentEditingLesson.contenidoPrincipal.tipo,
        lessonDuration: currentEditingLesson.duracionEstimada,
        lessonIsPreview: currentEditingLesson.esVistaPrevia,
        lessonContentText: currentEditingLesson.contenidoPrincipal.tipo === 'texto_rico' || currentEditingLesson.contenidoPrincipal.tipo === 'quiz' 
                           ? currentEditingLesson.contenidoPrincipal.texto || '' 
                           : '',
      });
      setSelectedLessonContentType(currentEditingLesson.contenidoPrincipal.tipo);
      setLessonContentFile(null); 
    }
  }, [currentEditingLesson, showEditLessonDialog, editLessonForm]);

  const fetchCourseStructure = useCallback(async (courseId: string) => {
    if (!courseId) return;
    setIsModuleLoading(true);
    let currentCourseData: CourseProperties | null = null;

    try {
      const courseDetailsResponse = await fetch(`/api/courses/${courseId}`);
      if (!courseDetailsResponse.ok) {
        const errorData = await courseDetailsResponse.json();
        toast({ title: "Error al Cargar Detalles del Curso", description: errorData.details || errorData.error || "No se pudieron cargar los detalles del curso.", variant: "destructive" });
        setCourseDetails(null); 
        setModules([]);
        throw new Error("Failed to fetch course details: " + (errorData.details || errorData.error));
      }
      const courseDataJson = await courseDetailsResponse.json();
      currentCourseData = courseDataJson.course;

      if (currentCourseData) {
        setCourseDetails(currentCourseData);
      } else {
        toast({ title: "Error", description: "Detalles del curso no encontrados.", variant: "destructive" });
        setCourseDetails(null);
        setModules([]);
        throw new Error("Course details not found.");
      }
      
      const modulesResponse = await fetch(`/api/courses/${courseId}/modules`);
      if (!modulesResponse.ok) {
        const errorData = await modulesResponse.json();
        toast({ title: "Error al Cargar Módulos", description: errorData.details || errorData.error || "Error al cargar módulos.", variant: "destructive" });
        setModules([]); 
        throw new Error("Failed to fetch modules: " + (errorData.details || errorData.error));
      }
      const modulesData = await modulesResponse.json();
      let fetchedModules: ModuleProperties[] = modulesData.modules || [];

      if (currentCourseData && currentCourseData.ordenModulos && currentCourseData.ordenModulos.length > 0) {
        const orderMap = new Map(currentCourseData.ordenModulos.map((id: string, index: number) => [id, index]));
        fetchedModules.sort((a, b) => {
          const orderA = orderMap.get(a.id);
          const orderB = orderMap.get(b.id);
          if (orderA !== undefined && orderB !== undefined) return orderA - orderB;
          if (orderA !== undefined) return -1;
          if (orderB !== undefined) return 1;
          return (a.orden ?? 0) - (b.orden ?? 0); 
        });
      } else {
        fetchedModules.sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0)); 
      }
      setModules(fetchedModules);

    } catch (error: any) {
      if (!toast.toString().includes(error.message)) { 
        toast({ title: "Error General al Cargar Estructura del Curso", description: error.message, variant: "destructive" });
      }
       setModules([]); 
    } finally {
      setIsModuleLoading(false);
    }
  }, [toast]); 


  useEffect(() => {
    if (createdCourseId) {
      fetchCourseStructure(createdCourseId);
    }
  }, [createdCourseId, fetchCourseStructure]);


  const fetchLessonsForModule = useCallback(async (courseId: string, moduleId: string, moduleData?: ModuleProperties) => {
    if (!courseId || !moduleId) return;
    setIsLessonLoading(prev => ({ ...prev, [moduleId]: true }));
    try {
      const response = await fetch(`/api/courses/${courseId}/modules/${moduleId}/lessons`);
      if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.details || errorData.error || "Error al cargar lecciones.");
      }
      const data = await response.json();
      let fetchedLessons: LessonProperties[] = data.lessons || [];
      
      const currentModule = moduleData || modules.find(m => m.id === moduleId);

      if (currentModule && currentModule.ordenLecciones && currentModule.ordenLecciones.length > 0) {
        const orderMap = new Map(currentModule.ordenLecciones.map((id, index) => [id, index]));
        fetchedLessons.sort((a,b) => {
            const orderA = orderMap.get(a.id);
            const orderB = orderMap.get(b.id);
            if (orderA !== undefined && orderB !== undefined) return orderA - orderB;
            if (orderA !== undefined) return -1;
            if (orderB !== undefined) return 1;
            return (a.orden ?? 0) - (b.orden ?? 0);
        });
      } else {
        fetchedLessons.sort((a,b) => (a.orden ?? 0) - (b.orden ?? 0));
      }

      setLessonsByModule(prev => ({ ...prev, [moduleId]: fetchedLessons }));
    } catch (error: any) {
      toast({ title: `Error al Cargar Lecciones (Módulo ${moduleData?.nombre || moduleId})`, description: error.message, variant: "destructive" });
      setLessonsByModule(prev => ({ ...prev, [moduleId]: [] }));
    } finally {
      setIsLessonLoading(prev => ({ ...prev, [moduleId]: false }));
    }
  }, [toast, modules]); 

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
        lessonContentText: '',
      }); 
      setLessonContentFile(null);
      setSelectedLessonContentType(undefined);
      if (createdCourseId && (!lessonsByModule[moduleId] || lessonsByModule[moduleId]?.length === 0)) { 
        const moduleData = modules.find(m => m.id === moduleId);
        fetchLessonsForModule(createdCourseId, moduleId, moduleData);
      }
    }
  };


  const onErrorStep1 = (errors: any) => {
    console.log("[DEBUG] FormStep1 Validation Errors:", errors);
    toast({ title: "Campos Incompletos", description: "Por favor, revisa y completa los campos marcados en rojo en Información General.", variant: "destructive" });
  };

  const onSubmitStep1 = async (values: Step1FormValues) => {
    console.log("[DEBUG] onSubmitStep1 Fired! Captured values:", values);
    if (!auth.currentUser) {
      toast({ title: "Error de autenticación", description: "Debes iniciar sesión.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const idToken = await auth.currentUser.getIdToken(true);
      const endpoint = createdCourseId ? `/api/courses/update/${createdCourseId}` : '/api/courses/create';
      const method = "POST";
      
      const dto: CreateCourseDto | UpdateCourseDto = { 
        ...values, 
        precio: Number(values.precio),
        tipoAcceso: values.tipoAcceso as CourseAccessType,
        referralPolicyId: values.referralPolicyId === undefined ? null : values.referralPolicyId
      };
      
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
      const dto: CreateModuleDto = { nombre: values.moduleName, descripcion: values.moduleDescription };
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
      await fetchCourseStructure(createdCourseId); 
    } catch (error: any) {
      toast({title: "Error al Añadir Módulo", description: error.message, variant: "destructive"});
    } finally {
      setIsModuleLoading(false);
    }
  };

  const onEditModuleSubmit = async (values: EditModuleFormValues) => {
    if (!createdCourseId || !currentEditingModule || !auth.currentUser) {
      toast({ title: "Error", description: "No se pudo determinar el módulo a editar o falta información.", variant: "destructive" });
      return;
    }
    setIsEditingModule(true);
    try {
      const idToken = await auth.currentUser.getIdToken(true);
      const dto: UpdateModuleDto = { nombre: values.moduleName, descripcion: values.moduleDescription };
      const response = await fetch(`/api/courses/${createdCourseId}/modules/${currentEditingModule.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify(dto),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || "Error al actualizar el módulo.");
      }

      toast({ title: "Módulo Actualizado" });
      setShowEditModuleDialog(false);
      setCurrentEditingModule(null);
      await fetchCourseStructure(createdCourseId); 
    } catch (error: any) {
      toast({ title: "Error al Actualizar Módulo", description: error.message, variant: "destructive" });
    } finally {
      setIsEditingModule(false);
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

    const isFileType = ['video', 'audio', 'documento_pdf'].includes(values.lessonContentType);
    if (isFileType && lessonContentFile) {
        toast({
            title: "Subida Pendiente (Solo en Edición)",
            description: `Para nuevas lecciones con archivo, primero crea la lección. Luego, edítala para subir "${lessonContentFile.name}".`,
            duration: 7000,
        });
    }

    setIsLessonLoading(prev => ({ ...prev, [moduleId]: true }));
    try {
      const idToken = await auth.currentUser.getIdToken(true);
      const dto: CreateLessonDto = {
        nombre: values.lessonName,
        contenidoPrincipal: { 
            tipo: values.lessonContentType as LessonContentType,
            url: null, 
            texto: (values.lessonContentType === 'texto_rico' || values.lessonContentType === 'quiz') ? values.lessonContentText || null : null,
        }, 
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
      const responseData = await response.json();
      const createdLesson = responseData.lesson;
      
      toast({title: "Lección Creada", description: `Lección "${values.lessonName}" añadida. Edítala para subir archivos si es necesario.`});
      lessonForm.reset({ 
        lessonName: '',
        lessonContentType: undefined,
        lessonDuration: '',
        lessonIsPreview: false,
        lessonContentText: '',
      }); 
      setLessonContentFile(null);
      setSelectedLessonContentType(undefined);
      
      const moduleToUpdateLessons = modules.find(m => m.id === moduleId);
      await fetchLessonsForModule(createdCourseId, moduleId, moduleToUpdateLessons);
    } catch (error: any) {
      toast({title: "Error al Añadir Lección", description: error.message, variant: "destructive"});
    } finally {
      setIsLessonLoading(prev => ({ ...prev, [moduleId]: false }));
    }
  };

  const onEditLessonSubmit = async (values: EditLessonFormValues) => {
    if (!createdCourseId || !currentEditingLesson || !auth.currentUser) {
      toast({ title: "Error", description: "No se pudo determinar la lección a editar o falta información.", variant: "destructive" });
      return;
    }
    setIsEditingLesson(true);
    setIsUploadingContent(false); 

    let downloadURL: string | null = currentEditingLesson.contenidoPrincipal.url || null;
    let contentText: string | null = currentEditingLesson.contenidoPrincipal.texto || null;

    try {
      const idToken = await auth.currentUser.getIdToken(true);
      const isFileType = ['video', 'audio', 'documento_pdf'].includes(values.lessonContentType);

      if (isFileType && lessonContentFile) {
        setIsUploadingContent(true);
        const storagePath = `cursos/${createdCourseId}/modulos/${currentEditingLesson.moduleId}/lecciones/${currentEditingLesson.id}/contenido/${lessonContentFile.name}`;
        const fileRef = ref(storage, storagePath);
        await uploadBytes(fileRef, lessonContentFile);
        downloadURL = await getDownloadURL(fileRef);
        contentText = null; 
        toast({ title: "Archivo Subido", description: "El contenido de la lección se ha actualizado."});
        setIsUploadingContent(false);
      } else if (values.lessonContentType === 'texto_rico' || values.lessonContentType === 'quiz') {
        contentText = values.lessonContentText || null;
        downloadURL = null; 
      } else if (isFileType && !lessonContentFile) {
        if (currentEditingLesson.contenidoPrincipal.tipo !== values.lessonContentType) {
            downloadURL = null; 
            contentText = null;
        }
      }


      const dto: UpdateLessonDto = {
        nombre: values.lessonName,
        contenidoPrincipal: { 
            tipo: values.lessonContentType as LessonContentType,
            url: downloadURL,
            texto: contentText,
        },
        duracionEstimada: values.lessonDuration,
        esVistaPrevia: values.lessonIsPreview,
      };
      
      const response = await fetch(`/api/courses/${createdCourseId}/modules/${currentEditingLesson.moduleId}/lessons/${currentEditingLesson.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify(dto),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || "Error al actualizar la lección.");
      }
      toast({ title: "Lección Actualizada" });
      setShowEditLessonDialog(false);
      setLessonContentFile(null);
      const moduleToUpdateLessons = modules.find(m => m.id === currentEditingLesson!.moduleId);
      await fetchLessonsForModule(createdCourseId, currentEditingLesson.moduleId, moduleToUpdateLessons);
    } catch (error: any) {
      toast({ title: "Error al Actualizar Lección", description: error.message, variant: "destructive" });
    } finally {
      setIsEditingLesson(false);
      setIsUploadingContent(false);
    }
  };

  const handleDeleteModule = async () => {
    if (!moduleToDelete || !createdCourseId || !auth.currentUser) {
      toast({ title: "Error", description: "No se pudo determinar el módulo a eliminar.", variant: "destructive" });
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
      await fetchCourseStructure(createdCourseId); 
      if (expandedModuleId === moduleToDelete.id) { 
        setExpandedModuleId(null);
      }
    } catch (error: any) {
      toast({ title: "Error al Eliminar Módulo", description: error.message, variant: "destructive" });
    } finally {
      setIsModuleLoading(false);
      setShowDeleteModuleDialog(false);
    }
  };

  const handleDeleteLesson = async () => {
    if (!lessonToDelete || !createdCourseId || !auth.currentUser) {
      toast({ title: "Error", description: "No se pudo determinar la lección a eliminar.", variant: "destructive" });
      setShowDeleteLessonDialog(false);
      return;
    }
    setIsDeletingLesson(true);
    try {
      const idToken = await auth.currentUser.getIdToken(true);
      const response = await fetch(`/api/courses/${createdCourseId}/modules/${lessonToDelete.moduleId}/lessons/${lessonToDelete.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${idToken}`},
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || "Error al eliminar la lección.");
      }
      toast({ title: "Lección Eliminada", description: `La lección "${lessonToDelete.nombre}" ha sido eliminada.` });
      
      setLessonToDelete(null);
      const moduleToUpdateLessons = modules.find(m => m.id === lessonToDelete!.moduleId);
      await fetchLessonsForModule(createdCourseId, lessonToDelete.moduleId, moduleToUpdateLessons); 
    } catch (error: any) {
      toast({ title: "Error al Eliminar Lección", description: error.message, variant: "destructive" });
    } finally {
      setIsDeletingLesson(false);
      setShowDeleteLessonDialog(false);
    }
  };

  const handleLessonFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2048 * 1024 * 1024) { 
        toast({ title: "Archivo Demasiado Grande", description: "El archivo de la lección no debe exceder los 2GB.", variant: "destructive"});
        event.target.value = ''; 
        setLessonContentFile(null);
        return;
      }
      setLessonContentFile(file);
    } else {
      setLessonContentFile(null);
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

  const renderLessonContentField = (formInstance: typeof lessonForm | typeof editLessonForm, currentContentType: LessonContentType | undefined, disabled: boolean) => {
    const isFileType = currentContentType && ['video', 'audio', 'documento_pdf'].includes(currentContentType);
    const isTextType = currentContentType && ['texto_rico', 'quiz'].includes(currentContentType);
    const currentFileUrl = formInstance === editLessonForm && currentEditingLesson?.contenidoPrincipal.tipo === currentContentType && currentEditingLesson?.contenidoPrincipal.url;
    const currentFileName = currentFileUrl ? decodeURIComponent(currentFileUrl.split('/').pop()?.split('?')[0] || 'archivo_existente') : null;

    return (
      <>
        {isFileType && (
          <FormItem>
            <FormLabel className="text-xs">Archivo de Contenido</FormLabel>
            <FormControl>
              <Input 
                type="file" 
                onChange={handleLessonFileChange} 
                disabled={disabled || isUploadingContent}
                className="text-xs file:text-xs file:font-medium file:text-primary file:bg-primary/10 hover:file:bg-primary/20"
              />
            </FormControl>
            {lessonContentFile && <FormDescription className="text-xs">Nuevo archivo: {lessonContentFile.name}</FormDescription>}
            {currentFileName && !lessonContentFile && 
                <FormDescription className="text-xs text-muted-foreground">
                    Archivo actual: <a href={currentFileUrl!} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate max-w-xs inline-block">{currentFileName}</a>
                </FormDescription>
            }
            {!currentFileName && !lessonContentFile && formInstance === editLessonForm &&
                 <FormDescription className="text-xs text-muted-foreground">No hay archivo asociado actualmente.</FormDescription>
            }
            {(formInstance === lessonForm && lessonContentFile) && 
                <FormDescription className="text-xs text-accent">El archivo se subirá cuando edites esta lección después de crearla.</FormDescription>
            }
             {formInstance === editLessonForm && lessonContentFile && 
                <FormDescription className="text-xs text-accent">El nuevo archivo reemplazará al actual al guardar.</FormDescription>
            }
            <FormMessage />
          </FormItem>
        )}
        {isTextType && (
          <FormField
            control={formInstance.control as any}
            name="lessonContentText"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Contenido Textual</FormLabel>
                <FormControl>
                  <Textarea placeholder="Escribe el contenido aquí..." {...field} rows={5} disabled={disabled || isUploadingContent} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </>
    );
  };
  
  const onDragEnd: OnDragEndResponder = async (result: DropResult) => {
    const { source, destination, type } = result;
    if (!destination || !createdCourseId || !auth.currentUser) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const idToken = await auth.currentUser.getIdToken(true);

    if (type === 'MODULE') {
        setIsReorderingModules(true);
        const reorderedModules = Array.from(modules);
        const [movedModule] = reorderedModules.splice(source.index, 1);
        reorderedModules.splice(destination.index, 0, movedModule);
        
        setModules(reorderedModules); 

        const orderedModuleIds = reorderedModules.map(mod => mod.id);
        try {
            const response = await fetch(`/api/courses/${createdCourseId}/modules/reorder`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
                body: JSON.stringify({ orderedModuleIds }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.details || errorData.error || "No se pudo actualizar el orden de los módulos.");
            }
            const updatedCourseData = await response.json();
            if (updatedCourseData.course) {
                setCourseDetails(updatedCourseData.course);
                
                const newOrderMap = new Map(updatedCourseData.course.ordenModulos.map((id: string, index: number) => [id, index]));
                setModules(prevModules => [...prevModules].sort((a, b) => {
                    const orderA = newOrderMap.get(a.id);
                    const orderB = newOrderMap.get(b.id);
                    if (orderA !== undefined && orderB !== undefined) return orderA - orderB;
                    if (orderA !== undefined) return -1;
                    if (orderB !== undefined) return 1;
                    return (a.orden ?? 0) - (b.orden ?? 0);
                }));
            }
            toast({ title: "Módulos Reordenados", description: "El orden de los módulos ha sido actualizado." });
        } catch (error: any) {
            toast({ title: "Error al Reordenar Módulos", description: error.message, variant: "destructive" });
            await fetchCourseStructure(createdCourseId); 
        } finally {
            setIsReorderingModules(false);
        }
    } else if (type === 'LESSON') {
        const sourceModuleId = source.droppableId.replace('lessons-', '');
        const destModuleId = destination.droppableId.replace('lessons-', '');

        if (sourceModuleId !== destModuleId) {
            toast({ title: "Reordenamiento no Soportado", description: "Las lecciones solo pueden reordenarse dentro del mismo módulo.", variant: "default" });
            return;
        }

        const moduleId = sourceModuleId;
        setIsReorderingLessons(prev => ({...prev, [moduleId]: true}));
        
        const lessonsInModule = lessonsByModule[moduleId] ? [...lessonsByModule[moduleId]] : [];
        if (lessonsInModule.length === 0) {
            setIsReorderingLessons(prev => ({...prev, [moduleId]: false}));
            return;
        }

        const [movedLesson] = lessonsInModule.splice(source.index, 1);
        lessonsInModule.splice(destination.index, 0, movedLesson);

        setLessonsByModule(prev => ({ ...prev, [moduleId]: lessonsInModule })); 

        const orderedLessonIds = lessonsInModule.map(lesson => lesson.id);

        try {
            const response = await fetch(`/api/courses/${createdCourseId}/modules/${moduleId}/lessons/reorder`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
                body: JSON.stringify({ orderedLessonIds }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.details || errorData.error || "No se pudo actualizar el orden de las lecciones.");
            }
            const updatedModuleData = await response.json();
            if (updatedModuleData.module) {
                setModules(prevModules => prevModules.map(m => 
                    m.id === moduleId ? updatedModuleData.module : m
                ));
                 await fetchLessonsForModule(createdCourseId, moduleId, updatedModuleData.module);
            }
             toast({ title: "Lecciones Reordenadas", description: `El orden de las lecciones en el módulo ha sido actualizado.` });
        } catch (error: any) {
            toast({ title: "Error al Reordenar Lecciones", description: error.message, variant: "destructive" });
            const originalModule = modules.find(m => m.id === moduleId);
            await fetchLessonsForModule(createdCourseId, moduleId, originalModule);
        } finally {
            setIsReorderingLessons(prev => ({...prev, [moduleId]: false}));
        }
    }
  };

  const renderLessonPreviewContent = () => {
    if (!lessonToPreview) return <p className="text-muted-foreground">No hay lección seleccionada para vista previa.</p>;

    const { tipo, url, texto } = lessonToPreview.contenidoPrincipal;

    switch (tipo) {
      case 'video':
        if (!url) return <p className="text-muted-foreground">URL del video no disponible.</p>;
        if (url.includes('youtube.com/embed') || url.includes('player.vimeo.com/video')) {
          return (
            <div className="aspect-video">
              <iframe
                src={url}
                width="100%"
                height="100%"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="rounded-md border"
                title={`Vista previa: ${lessonToPreview.nombre}`}
              ></iframe>
            </div>
          );
        }
        return <video controls src={url} className="w-full rounded-md aspect-video bg-black"><track kind="captions" /></video>;
      case 'documento_pdf':
        if (!url) return <p className="text-muted-foreground">URL del PDF no disponible.</p>;
        return <iframe src={url} className="w-full h-[70vh] rounded-md border" title={`Vista previa: ${lessonToPreview.nombre}`}></iframe>;
      case 'audio':
        if (!url) return <p className="text-muted-foreground">URL del audio no disponible.</p>;
        return <audio controls src={url} className="w-full"><track kind="captions" /></audio>;
      case 'texto_rico':
        if (!texto) return <p className="text-muted-foreground">Contenido de texto no disponible.</p>;
        return <div className="prose max-w-none p-4 border rounded-md bg-secondary/30" dangerouslySetInnerHTML={{ __html: texto }} />;
      case 'quiz':
        if (!texto) return <p className="text-muted-foreground">Contenido del quiz no disponible.</p>;
        return <div className="p-4 border rounded-md bg-secondary/30 whitespace-pre-wrap">{texto}</div>;
      default:
        return <p className="text-muted-foreground">Tipo de contenido no soportado para vista previa.</p>;
    }
  };


  return (
    <div className="space-y-6 max-w-4xl mx-auto px-4 sm:px-6 md:px-8 pb-12 pt-4">
      <div className="px-1 mb-2">
        <h1 className="text-largeTitle font-bold text-foreground">{createdCourseId ? `Editar: ${courseDetails?.nombre || ''}` : "Crear Curso"}</h1>
        <p className="text-subheadline text-secondary-foreground mt-1">Completa los siguientes pasos para configurar tu curso.</p>
      </div>
      <div>
        <Tabs value={currentStep} onValueChange={(newStep) => {
            if (newStep === "info" || 
                (newStep === "structure" && createdCourseId) || 
                (newStep === "settings" && createdCourseId)) {
              setCurrentStep(newStep);
            } else {
              toast({title: "Paso Bloqueado", description: "Completa los pasos anteriores primero para habilitar esta sección.", variant: "default"});
            }
          }} className="w-full">
            <TabsList className="flex flex-col sm:flex-row w-full h-auto sm:h-10 mb-8 sm:mb-6 gap-2">
              <TabsTrigger value="info" className={getTabClass("info")} disabled={isLoading || isSavingSettings}>
                <Info className="h-5 w-5" /> Información
              </TabsTrigger>
              <TabsTrigger value="structure" className={getTabClass("structure")} disabled={isLoading || isSavingSettings || !createdCourseId || isReorderingModules}>
                <ListChecks className="h-5 w-5" /> Estructura y Contenido
              </TabsTrigger>
              <TabsTrigger value="settings" className={getTabClass("settings")} disabled={isLoading || isSavingSettings || !createdCourseId}>
                <Settings className="h-5 w-5" /> Publicación
              </TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="mt-6">
                <div className="space-y-6">
                  <Form {...formStep1}>
                    <form onSubmit={formStep1.handleSubmit(onSubmitStep1, onErrorStep1)} className="space-y-6">
                      <h2 className="text-footnote text-secondary-foreground uppercase pl-4 mb-2 tracking-wider font-medium">Información General</h2>
                      <div className="ios-list">
                        <div className="ios-list-item min-h-[44px] flex-col items-start !items-stretch py-3">
                            <FormField control={formStep1.control} name="nombre" render={({ field }) => (<FormItem><FormLabel className="text-body font-medium mb-1 block">Nombre del Curso</FormLabel><FormControl><Input className="border-0 bg-secondary/30 dark:bg-secondary/50 rounded-md px-3 py-2 text-body focus-visible:ring-1 focus-visible:ring-primary/20 placeholder:text-muted-foreground" placeholder="Ej: Curso Completo de Next.js y Firebase" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        </div>
                        <div className="ios-list-item min-h-[44px] flex-col items-start !items-stretch py-3">
                           <FormField control={formStep1.control} name="descripcionCorta" render={({ field }) => (<FormItem><FormLabel className="text-body font-medium mb-1 block">Descripción Corta</FormLabel><FormControl><Input className="border-0 bg-secondary/30 dark:bg-secondary/50 rounded-md px-3 py-2 text-body focus-visible:ring-1 focus-visible:ring-primary/20 placeholder:text-muted-foreground" placeholder="Un resumen atractivo" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        </div>
                        <div className="ios-list-item min-h-[44px] flex-col items-start !items-stretch py-3">
                           <FormField control={formStep1.control} name="descripcionLarga" render={({ field }) => (<FormItem><FormLabel className="text-body font-medium mb-1 block">Descripción Larga</FormLabel><FormControl><Textarea className="border-0 bg-secondary/30 dark:bg-secondary/50 rounded-md px-3 py-2 text-body focus-visible:ring-1 focus-visible:ring-primary/20 placeholder:text-muted-foreground resize-none" rows={6} placeholder="Describe en detalle tu curso..." {...field} /></FormControl><FormDescription className="text-xs text-secondary-foreground mt-2">Puedes usar Markdown.</FormDescription><FormMessage /></FormItem>)} />
                        </div>
                      </div>

                      <h2 className="text-footnote text-secondary-foreground uppercase pl-4 mb-2 tracking-wider font-medium mt-6">Categoría y Precios</h2>
                      <div className="ios-list">
                        <div className="ios-list-item flex flex-col sm:flex-row sm:items-center py-2 min-h-[44px] gap-2 md:gap-4">
                           <div className="flex-1 w-full"><FormField control={formStep1.control} name="categoria" render={({ field }) => (<FormItem className="flex items-center justify-between m-0 space-y-0"><FormLabel className="text-body font-medium flex-shrink-0 m-0">Categoría</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="w-auto border-0 focus:ring-0 shadow-none bg-secondary/20 rounded-md px-3 py-2 text-secondary-foreground sm:text-right h-auto gap-2 [&>svg]:opacity-50"><SelectValue placeholder="Seleccionar" /></SelectTrigger></FormControl><SelectContent>{courseCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent></Select></FormItem>)} /></div>
                        </div>
                        <div className="ios-list-item flex flex-col sm:flex-row sm:items-center py-2 min-h-[44px] gap-2 md:gap-4">
                           <div className="flex-1 w-full"><FormField control={formStep1.control} name="tipoAcceso" render={({ field }) => (<FormItem className="flex items-center justify-between m-0 space-y-0"><FormLabel className="text-body font-medium flex-shrink-0 m-0">Tipo de Acceso</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="w-auto border-0 focus:ring-0 shadow-none bg-secondary/20 rounded-md px-3 py-2 text-secondary-foreground sm:text-right h-auto gap-2 [&>svg]:opacity-50"><SelectValue placeholder="Seleccionar" /></SelectTrigger></FormControl><SelectContent><SelectItem value="unico">Pago Único</SelectItem><SelectItem value="suscripcion">Suscripción</SelectItem></SelectContent></Select></FormItem>)} /></div>
                        </div>
                        <div className="ios-list-item flex flex-col sm:flex-row sm:items-center py-2 min-h-[44px] gap-2 md:gap-4">
                           <div className="flex-1 w-full"><FormField control={formStep1.control} name="precio" render={({ field }) => (<FormItem className="flex items-center justify-between m-0 space-y-0"><FormLabel className="text-body font-medium flex-shrink-0 m-0">Precio (€)</FormLabel><FormControl><Input className="w-28 sm:text-right border-0 bg-secondary/20 rounded-md focus-visible:ring-0 px-3 py-2 h-auto text-secondary-foreground" type="number" step="0.01" placeholder="Ej: 49.99" {...field} /></FormControl></FormItem>)} /></div>
                        </div>
                        <div className="ios-list-item flex flex-col sm:flex-row sm:items-center py-2 min-h-[44px] gap-2 md:gap-4">
                           <div className="flex-1 w-full"><FormField control={formStep1.control} name="duracionEstimada" render={({ field }) => (<FormItem className="flex items-center justify-between m-0 space-y-0"><FormLabel className="text-body font-medium flex-shrink-0 m-0">Duración Est.</FormLabel><FormControl><Input className="w-36 sm:text-right border-0 bg-secondary/20 rounded-md focus-visible:ring-0 px-3 py-2 h-auto text-secondary-foreground" placeholder="Ej: 20 horas" {...field} /></FormControl></FormItem>)} /></div>
                        </div>
                      </div>

                      <h2 className="text-footnote text-secondary-foreground uppercase pl-4 mb-2 tracking-wider font-medium mt-6">Afiliados</h2>
                      <div className="ios-list">
                        <div className="ios-list-item flex flex-col sm:flex-row sm:items-center py-2 min-h-[44px] gap-2 md:gap-4">
                           <div className="flex-1 w-full"><FormField control={formStep1.control} name="referralPolicyId" render={({ field }) => (<FormItem className="flex items-center justify-between m-0 space-y-0"><FormLabel className="text-body font-medium flex-shrink-0 m-0">Política de Referidos</FormLabel><FormControl><ReferralPolicySelector value={field.value as string | null} onChange={field.onChange} /></FormControl></FormItem>)} /></div>
                        </div>
                      </div>
                      
                      <div className="flex justify-end pt-4"><Button type="submit" disabled={isLoading} className="ios-button rounded-full px-6">{isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}{createdCourseId ? "Actualizar y Continuar" : "Guardar y Continuar"} <ArrowRight className="ml-2 h-4 w-4" /></Button></div>
                    </form>
                  </Form>
              </div>
            </TabsContent>

            <TabsContent value="structure" className="mt-6">
              <div className="space-y-6">
                  <h2 className="text-footnote text-secondary-foreground uppercase pl-4 mb-2 tracking-wider font-medium">Estructura y Contenido</h2>
                  {createdCourseId ? (
                     <DragDropContext onDragEnd={onDragEnd}>
                      
                      {/* AI Course Builder Card */}
                      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 mb-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                        <div className="relative z-10 flex flex-col gap-3">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                              <Sparkles className="h-4 w-4" />
                            </div>
                            <h3 className="text-headline font-semibold flex items-center text-primary">
                              Asistente Consciousness
                            </h3>
                          </div>
                          <p className="text-body text-secondary-foreground">
                            ¿Bloqueo de creador? Cuéntale a nuestra IA de qué trata tu curso, cuántas lecciones quieres y deja que estructure el esqueleto mágicamente.
                          </p>
                          <Textarea 
                            className="w-full bg-background mt-2 mb-2 focus-visible:ring-primary/50 text-body resize-none" 
                            rows={3} 
                            placeholder="Ej: Crea un curso de 3 módulos sobre meditación vipassana para principiantes..."
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            disabled={isAiLoading || isReorderingModules}
                          />
                          <div className="flex justify-end">
                            <Button 
                              onClick={handleGenerateAiStructure} 
                              disabled={isAiLoading || !aiPrompt.trim()} 
                              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full font-medium shadow-sm transition-all"
                            >
                              {isAiLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Wand2 className="h-4 w-4 mr-2" />}
                              {isAiLoading ? 'Estructurando con IA...' : 'Generar Estructura'}
                            </Button>
                          </div>
                        </div>
                      </div>

                      <p className="mb-4 text-sm text-muted-foreground">Editando estructura para: {courseDetails?.nombre || `ID: ${createdCourseId}`}</p>
                      
                      <Form {...moduleForm}>
                        <form onSubmit={moduleForm.handleSubmit(onAddModule, (e) => { toast({title: "Incompleto", description: "Revisa el nombre del módulo."}) })} className="space-y-4 mb-6">
                           <div className="ios-list">
                             <div className="ios-list-item min-h-[44px] flex-col items-start !items-stretch py-3">
                                <FormField control={moduleForm.control} name="moduleName" render={({ field }) => (<FormItem className="flex-grow"><FormLabel className="text-body font-medium mb-1 block">Nombre del Módulo</FormLabel><FormControl><Input className="border-0 bg-secondary/30 dark:bg-secondary/50 rounded-md px-3 py-2 text-body focus-visible:ring-1 focus-visible:ring-primary/20 placeholder:text-muted-foreground" placeholder="Ej: Introducción a..." {...field} disabled={isModuleLoading || isReorderingModules} /></FormControl><FormMessage /></FormItem>)} />
                             </div>
                             <div className="ios-list-item min-h-[44px] flex-col items-start !items-stretch py-3">
                                <FormField control={moduleForm.control} name="moduleDescription" render={({ field }) => (<FormItem className="flex-grow"><FormLabel className="text-body font-medium mb-1 block">Descripción (Opcional)</FormLabel><FormControl><Textarea className="border-0 bg-secondary/30 dark:bg-secondary/50 rounded-md px-3 py-2 text-body focus-visible:ring-1 focus-visible:ring-primary/20 placeholder:text-muted-foreground resize-none" placeholder="Breve descripción del módulo" {...field} disabled={isModuleLoading || isReorderingModules} rows={2} /></FormControl><FormMessage /></FormItem>)} />
                             </div>
                           </div>
                          <div className="flex justify-end pt-1"><Button type="submit" className="ios-button rounded-full" size="sm" disabled={isModuleLoading || isReorderingModules}>{isModuleLoading || isReorderingModules ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4"/>}Añadir Módulo</Button></div>
                        </form>
                      </Form>

                      { (isModuleLoading && modules.length === 0) && 
                        <div className="text-center py-2"><Loader2 className="h-5 w-5 animate-spin inline-block mr-2" />Cargando módulos...</div>
                      }
                      { !isModuleLoading && modules.length === 0 && !isReorderingModules &&
                        (<p className="text-muted-foreground text-center py-4">Aún no has añadido módulos. Comienza creando uno.</p>)
                      }

                      {modules.length > 0 && (
                        <div className="space-y-1 mt-6">
                          <h4 className="text-lg font-semibold mb-2">Módulos del Curso:</h4>
                          <Droppable
                            droppableId="modules-droppable"
                            type="MODULE"
                            isDropDisabled={isReorderingModules} 
                            isCombineEnabled={false}
                            ignoreContainerClipping={false} 
                          >
                            {(providedDroppableModules) => (
                              <div {...providedDroppableModules.droppableProps} ref={providedDroppableModules.innerRef}>
                                <Accordion 
                                  type="single" 
                                  collapsible 
                                  className="ios-list w-full" 
                                  value={expandedModuleId || undefined} 
                                  onValueChange={(value) => {
                                    handleToggleModuleLessons(value);
                                    lessonForm.reset({ lessonName: '', lessonContentType: undefined, lessonDuration: '', lessonIsPreview: false, lessonContentText: '' });
                                    setLessonContentFile(null);
                                    setSelectedLessonContentType(undefined);
                                }}>
                                  {modules.map((module, index) => (
                                    <Draggable key={module.id} draggableId={module.id} index={index} isDragDisabled={isReorderingModules} type="MODULE">
                                      {(providedDraggableModule) => (
                                        <div
                                          ref={providedDraggableModule.innerRef}
                                          {...providedDraggableModule.draggableProps}
                                        >
                                          <AccordionItem value={module.id} className="ios-list-item flex-col items-stretch !p-0 border-b last:border-b-0 border-border !min-h-[44px] bg-transparent">
                                            <div className="flex items-center justify-between w-full transition-colors pr-2 h-auto">
                                              <div {...providedDraggableModule.dragHandleProps} className="p-3 cursor-grab opacity-30 hover:opacity-100 text-muted-foreground mr-1">
                                                  <GripVertical className="h-5 w-5" />
                                              </div>
                                              <AccordionTrigger className="flex-grow text-left hover:no-underline py-3 px-1 group outline-none [&[data-state=open]>svg]:rotate-180">
                                                <div className="flex justify-between items-center w-full">
                                                  <div>
                                                    <span className="font-medium">{module.nombre}</span>
                                                    {module.descripcion && <p className="text-xs text-muted-foreground font-normal mt-0.5">{module.descripcion}</p>}
                                                  </div>
                                                  <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors mr-2">
                                                    {(lessonsByModule[module.id]?.length || 0) + (isLessonLoading[module.id] ? " (cargando...)" : " lecciones")}
                                                  </span>
                                                </div>
                                              </AccordionTrigger>
                                              <div className="flex items-center gap-1 pl-2">
                                                  <Button variant="ghost" size="icon" className="h-7 w-7 opacity-60 hover:opacity-100 hover:bg-primary/10 focus-visible:ring-offset-secondary/60" 
                                                    onClick={(e) => { 
                                                      e.stopPropagation();
                                                      setCurrentEditingModule(module);
                                                      setShowEditModuleDialog(true);
                                                    }}
                                                    disabled={isReorderingModules || isReorderingLessons[module.id]}
                                                    >
                                                      <Edit className="h-3.5 w-3.5"/>
                                                      <span className="sr-only">Editar módulo</span>
                                                  </Button>
                                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/70 hover:text-destructive hover:bg-destructive/10 opacity-60 hover:opacity-100 focus-visible:ring-offset-secondary/60" 
                                                      onClick={(e) => { 
                                                          e.stopPropagation(); 
                                                          setModuleToDelete(module); 
                                                          setShowDeleteModuleDialog(true);
                                                      }}
                                                      disabled={isReorderingModules || isReorderingLessons[module.id]}
                                                    >
                                                      <Trash2 className="h-3.5 w-3.5"/>
                                                      <span className="sr-only">Eliminar módulo</span>
                                                  </Button>
                                              </div>
                                            </div>
                                          <AccordionContent className="pt-0 pb-0 ml-0 overflow-hidden bg-secondary/5 dark:bg-white/5 border-t border-border">
                                            <div className="px-4 py-3">
                                              <div className="mb-3">
                                                <h4 className="text-sm font-medium text-secondary-foreground mb-1">Lecciones del Módulo: {module.nombre}</h4>
                                              </div>
                                                <Form {...lessonForm}>
                                                  <form onSubmit={lessonForm.handleSubmit((data) => onAddLesson(module.id, data), (e) => toast({title: "Incompleto", description: "Revisa los campos de la lección", variant: "destructive"}))} className="space-y-4 mb-6 pt-2">
                                                    <div className="ios-list">
                                                      <div className="ios-list-item min-h-[44px] flex-col items-start !items-stretch py-3">
                                                         <FormField control={lessonForm.control} name="lessonName" render={({ field }) => (<FormItem><FormLabel className="text-xs font-medium mb-1 block">Nombre Lección</FormLabel><FormControl><Input className="border-0 bg-secondary/30 dark:bg-secondary/50 rounded-md px-3 py-2 text-xs focus-visible:ring-1 focus-visible:ring-primary/20 placeholder:text-muted-foreground" placeholder="Título de la lección" {...field} disabled={isLessonLoading[module.id] || isUploadingContent || isReorderingLessons[module.id]} /></FormControl><FormMessage /></FormItem>)} />
                                                      </div>
                                                      <div className="ios-list-item flex flex-col sm:flex-row sm:items-center py-2 min-h-[44px] gap-2 md:gap-4">
                                                         <div className="flex-1 w-full">
                                                           <FormField control={lessonForm.control} name="lessonContentType" render={({ field }) => ( <FormItem className="flex items-center justify-between m-0 space-y-0"><FormLabel className="text-xs font-medium flex-shrink-0 m-0">Tipo Contenido</FormLabel><Select onValueChange={(value) => { field.onChange(value); setSelectedLessonContentType(value as LessonContentType); setLessonContentFile(null); lessonForm.setValue('lessonContentText', ''); }} value={field.value} disabled={isLessonLoading[module.id] || isUploadingContent || isReorderingLessons[module.id]}><FormControl><SelectTrigger className="w-auto border-0 focus:ring-0 shadow-none bg-secondary/20 rounded-md px-3 py-2 text-xs h-auto gap-2 text-secondary-foreground"><SelectValue placeholder="Selecciona" /></SelectTrigger></FormControl><SelectContent>{lessonContentTypes.map(type => <SelectItem key={type} value={type}>{type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</SelectItem>)}</SelectContent></Select></FormItem>)} />
                                                         </div>
                                                      </div>
                                                      <div className="ios-list-item flex flex-col sm:flex-row sm:items-center py-2 min-h-[44px] gap-2 md:gap-4">
                                                          <div className="flex-1 w-full"><FormField control={lessonForm.control} name="lessonDuration" render={({ field }) => (<FormItem className="flex items-center justify-between m-0 space-y-0"><FormLabel className="text-xs font-medium flex-shrink-0 m-0">Duración Estimada</FormLabel><FormControl><Input className="w-32 sm:text-right border-0 bg-secondary/20 rounded-md px-3 py-2 text-xs focus-visible:ring-0 h-auto" placeholder="Ej: 10 min, 3 págs" {...field} disabled={isLessonLoading[module.id] || isUploadingContent || isReorderingLessons[module.id]} /></FormControl></FormItem>)} /></div>
                                                      </div>
                                                    </div>
                                                    {renderLessonContentField(lessonForm, lessonForm.watch('lessonContentType'), !!(isLessonLoading[module.id] || isUploadingContent || isReorderingLessons[module.id]))}
                                                    <FormField control={lessonForm.control} name="lessonIsPreview" render={({ field }) => (<FormItem className="flex flex-row items-center space-x-3 space-y-0 p-3 bg-secondary/20 rounded-md mb-2 mt-2"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isLessonLoading[module.id] || isUploadingContent || isReorderingLessons[module.id]} /></FormControl><div className="space-y-1 leading-none"><FormLabel className="text-xs font-medium">¿Es vista previa gratuita?</FormLabel></div></FormItem>)} />
                                                    <div className="flex justify-end pt-1"><Button type="submit" size="sm" className="ios-button rounded-full text-xs px-4" disabled={isLessonLoading[module.id] || !createdCourseId || isUploadingContent || isReorderingLessons[module.id]}>{isLessonLoading[module.id] || isUploadingContent || isReorderingLessons[module.id] ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-3 w-3" />}Añadir Lección</Button></div>
                                                  </form>
                                                </Form>
                                                
                                                {isLessonLoading[module.id] && (!lessonsByModule[module.id] || lessonsByModule[module.id]?.length === 0) && <div className="text-xs text-muted-foreground text-center py-2"><Loader2 className="h-4 w-4 animate-spin inline-block mr-1" />Cargando lecciones...</div>}
                                                {!isLessonLoading[module.id] && (!lessonsByModule[module.id] || lessonsByModule[module.id]?.length === 0) && (<p className="text-xs text-muted-foreground text-center py-3">Aún no has añadido lecciones a este módulo.</p>)}
                                                
                                                {lessonsByModule[module.id] && lessonsByModule[module.id]!.length > 0 && (
                                                  <div className="space-y-2 mt-4">
                                                    <h6 className="text-xs font-semibold text-muted-foreground">Lecciones Existentes:</h6>
                                                     <Droppable 
                                                          droppableId={`lessons-${module.id}`} 
                                                          type="LESSON"
                                                          isDropDisabled={!!(isLessonLoading[module.id] || isReorderingLessons[module.id])}
                                                          isCombineEnabled={false}
                                                          ignoreContainerClipping={false}
                                                      >
                                                          {(providedDroppableLessons) => (
                                                              <ul {...providedDroppableLessons.droppableProps} ref={providedDroppableLessons.innerRef} className="ios-list my-2 bg-background border border-border shadow-sm">
                                                                  {(lessonsByModule[module.id] || []).map((lesson, lessonIndex) => (
                                                                      <Draggable key={lesson.id} draggableId={lesson.id} index={lessonIndex} isDragDisabled={!!(isLessonLoading[module.id] || isReorderingLessons[module.id])} type="LESSON">
                                                                          {(providedDraggableLesson) => (
                                                                              <li
                                                                                  ref={providedDraggableLesson.innerRef}
                                                                                  {...providedDraggableLesson.draggableProps}
                                                                                  className="ios-list-item min-h-[44px] flex justify-between items-center bg-transparent py-2 border-b last:border-b-0 border-border"
                                                                              >
                                                                                  <div className="flex items-center">
                                                                                      <div {...providedDraggableLesson.dragHandleProps} className="mr-2 p-1 cursor-grab opacity-50 hover:opacity-100">
                                                                                          <GripVertical className="h-4 w-4"/>
                                                                                      </div>
                                                                                      <div>
                                                                                          <span className="font-medium">{lesson.nombre}</span> <span className="text-xs text-muted-foreground">({lesson.contenidoPrincipal.tipo.replace('_', ' ').replace(/\\b\\w/g, l => l.toUpperCase())})</span>
                                                                                          {lesson.esVistaPrevia && <Badge variant="outline" className="ml-2 text-xs border-accent text-accent">Vista Previa</Badge>}
                                                                                      </div>
                                                                                  </div>
                                                                                  <div className="flex items-center gap-0.5">
                                                                                       <Button variant="ghost" size="icon" className="h-6 w-6 opacity-50 hover:opacity-100 focus-visible:ring-offset-secondary/20"
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            setLessonToPreview(lesson);
                                                                                            setIsPreviewLessonDialogOpen(true);
                                                                                        }}
                                                                                        disabled={!!(isLessonLoading[module.id] || isReorderingLessons[module.id])}
                                                                                        title="Vista Previa Lección"
                                                                                        >
                                                                                            <Eye className="h-3 w-3"/>
                                                                                            <span className="sr-only">Vista Previa lección</span>
                                                                                        </Button>
                                                                                      <Button variant="ghost" size="icon" className="h-6 w-6 opacity-50 hover:opacity-100 focus-visible:ring-offset-secondary/20" 
                                                                                      onClick={(e) => { 
                                                                                          e.stopPropagation(); 
                                                                                          setCurrentEditingLesson(lesson); 
                                                                                          setShowEditLessonDialog(true); 
                                                                                      }}
                                                                                      disabled={!!(isLessonLoading[module.id] || isReorderingLessons[module.id])}
                                                                                      title="Editar Lección"
                                                                                      >
                                                                                          <Edit className="h-3 w-3"/>
                                                                                          <span className="sr-only">Editar lección</span>
                                                                                      </Button>
                                                                                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive/60 hover:text-destructive hover:bg-destructive/10 opacity-50 hover:opacity-100 focus-visible:ring-offset-secondary/20" 
                                                                                      onClick={(e) => { 
                                                                                          e.stopPropagation(); 
                                                                                          setLessonToDelete(lesson); 
                                                                                          setShowDeleteLessonDialog(true);
                                                                                      }}
                                                                                      disabled={!!(isLessonLoading[module.id] || isReorderingLessons[module.id])}
                                                                                      title="Eliminar Lección"
                                                                                      >
                                                                                          <Trash2 className="h-3 w-3"/>
                                                                                          <span className="sr-only">Eliminar lección</span>
                                                                                      </Button>
                                                                                  </div>
                                                                              </li>
                                                                          )}
                                                                      </Draggable>
                                                                  ))}
                                                                  {providedDroppableLessons.placeholder}
                                                              </ul>
                                                          )}
                                                      </Droppable>
                                                  </div>
                                                )}
                                            </div>
                                          </AccordionContent>
                                          </AccordionItem>
                                        </div>
                                      )}
                                    </Draggable>
                                  ))}
                                  {providedDroppableModules.placeholder}
                                </Accordion>
                              </div>
                            )}
                          </Droppable>
                        </div>
                      )}
                    </DragDropContext>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">Completa el paso de Información Básica primero para poder añadir módulos y lecciones.</p>
                  )}
                  <div className="flex justify-between pt-6 mt-4 border-t">
                      <Button type="button" variant="outline" onClick={handlePreviousStep} disabled={isLoading || isModuleLoading || isSavingSettings || isEditingModule || isEditingLesson || isDeletingLesson || isUploadingContent || isReorderingModules || Object.values(isReorderingLessons).some(v => v) }>Anterior</Button>
                      <Button type="button" onClick={handleNextStep} disabled={isLoading || isModuleLoading || isSavingSettings || isEditingModule || isEditingLesson || isDeletingLesson || isUploadingContent || !createdCourseId || isReorderingModules || Object.values(isReorderingLessons).some(v => v) }>Siguiente <ArrowRight className="ml-2 h-4 w-4" /></Button>
                  </div>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="mt-6">
               <div className="space-y-6">
                  <h2 className="text-footnote text-secondary-foreground uppercase pl-4 mb-2 tracking-wider font-medium">Publicación y Media</h2>
                   {createdCourseId ? (
                    <div className="space-y-8">
                       <p className="mb-1 text-sm text-muted-foreground">Ajustes para: {courseDetails?.nombre || `ID: ${createdCourseId}`}</p>
                      <div className="ios-list">
                         <CourseCoverManager 
                             courseId={createdCourseId}
                             courseContext={courseDetails?.descripcionCorta || courseDetails?.nombre || ''}
                             previewUrl={coverImagePreviewUrl}
                             fileName={coverImageFile?.name}
                             isUploading={isUploadingCover}
                             disabled={isSavingSettings}
                             onFileSelect={(e) => {
                               handleCoverImageChange(e);
                             }}
                             onAiSuccess={(url) => {
                               setCoverImagePreviewUrl(url);
                               setCoverImageFile(null); // clears manual selection
                             }}
                         />
                         <div className="ios-list-item min-h-[44px] flex-col items-start !items-stretch py-3">
                             <div className="flex items-center gap-2 mb-3"><FileText className="h-5 w-5 text-primary"/><h4 className="font-semibold text-sm">Video Trailer (Opcional)</h4></div>
                             <Input className="border-0 bg-secondary/30 dark:bg-secondary/50 rounded-md px-3 py-2 text-body focus-visible:ring-1 focus-visible:ring-primary/20 placeholder:text-muted-foreground" placeholder="URL de YouTube o Vimeo" value={videoTrailerUrlInput} onChange={(e) => setVideoTrailerUrlInput(e.target.value)} disabled={isSavingSettings} />
                             <p className="mt-2 text-xs text-muted-foreground">Un video corto para promocionar tu curso.</p>
                         </div>
                         <div className="ios-list-item flex flex-col sm:flex-row sm:items-center py-3 min-h-[44px] gap-2 md:gap-4">
                             <div className="flex-1 w-full"><div className="flex items-center justify-between m-0 space-y-0"><div className="flex items-center gap-2 flex-shrink-0 m-0"><Settings className="h-5 w-5 text-primary"/><h4 className="text-body font-medium">Estado de Publicación</h4></div><Select onValueChange={(value) => setSelectedStatus(value as CourseStatus)} value={selectedStatus} disabled={isSavingSettings}><SelectTrigger className="w-auto border-0 focus:ring-0 shadow-none bg-secondary/20 rounded-md px-3 py-2 text-secondary-foreground sm:text-right h-auto gap-2 [&>svg]:opacity-50"><SelectValue placeholder="Selecciona un estado" /></SelectTrigger><SelectContent>{courseStatuses.map(status => (<SelectItem key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}</SelectItem>))}</SelectContent></Select></div></div>
                         </div>
                      </div>

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
                       <Button type="button" variant="outline" onClick={handlePreviousStep} disabled={isLoading || isSavingSettings || isModuleLoading || isEditingModule || isEditingLesson || isDeletingLesson || isUploadingContent || isReorderingModules || Object.values(isReorderingLessons).some(v => v) }>Anterior</Button>
                       <Button 
                         type="button" 
                         onClick={() => {
                           if (createdCourseId) {
                             router.push(`/dashboard/courses`); 
                           } else {
                             router.push('/dashboard/courses');
                           }
                         }} 
                         disabled={isLoading || isSavingSettings || isModuleLoading || isEditingModule || isEditingLesson || isDeletingLesson || isUploadingContent || !createdCourseId || isReorderingModules || Object.values(isReorderingLessons).some(v => v)}
                       >
                         {createdCourseId ? "Finalizar e Ir al Listado" : "Ir al Listado (Guarda primero)"}
                       </Button>
                    </div>
               </div>
            </TabsContent>
          </Tabs>
      </div>

      {/* Delete Module Confirmation Dialog */}
        <AlertDialog open={showDeleteModuleDialog} onOpenChange={setShowDeleteModuleDialog}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>¿Estás seguro de que quieres eliminar este módulo?</AlertDialogTitle>
                <AlertDialogDescription>
                    Esta acción no se puede deshacer. Se eliminará el módulo <span className="font-semibold">"{moduleToDelete?.nombre}"</span> y todas las lecciones que contiene.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <Button variant="outline" onClick={() => {setModuleToDelete(null); setShowDeleteModuleDialog(false);}} disabled={isModuleLoading}>Cancelar</Button>
                <Button onClick={handleDeleteModule} disabled={isModuleLoading} variant="destructive">
                    {isModuleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Eliminar Módulo
                </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

    {/* Edit Module Dialog */}
    <Dialog open={showEditModuleDialog} onOpenChange={(isOpen) => {
        setShowEditModuleDialog(isOpen);
        if (!isOpen) {
            setCurrentEditingModule(null);
            editModuleForm.reset();
        }
    }}>
        <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
                <DialogTitle>Editar Módulo: {currentEditingModule?.nombre}</DialogTitle>
                <DialogDescription>Realiza los cambios necesarios en el nombre y la descripción del módulo.</DialogDescription>
            </DialogHeader>
            <Form {...editModuleForm}>
                <form onSubmit={editModuleForm.handleSubmit(onEditModuleSubmit)} className="space-y-6 py-4">
                    <FormField
                        control={editModuleForm.control}
                        name="moduleName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nombre del Módulo</FormLabel>
                                <FormControl>
                                    <Input placeholder="Nombre del módulo" {...field} disabled={isEditingModule} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={editModuleForm.control}
                        name="moduleDescription"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Descripción del Módulo (Opcional)</FormLabel>
                                <FormControl>
                                    <Textarea rows={3} placeholder="Descripción breve del módulo" {...field} disabled={isEditingModule} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="outline" disabled={isEditingModule}>Cancelar</Button>
                        </DialogClose>
                        <Button type="submit" disabled={isEditingModule}>
                            {isEditingModule ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Guardar Cambios
                        </Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
    </Dialog>

    {/* Edit Lesson Dialog */}
    <Dialog open={showEditLessonDialog} onOpenChange={(isOpen) => {
        setShowEditLessonDialog(isOpen);
        if (!isOpen) {
            setCurrentEditingLesson(null);
            editLessonForm.reset();
            setLessonContentFile(null);
            setSelectedLessonContentType(undefined);
        }
    }}>
        <DialogContent className="sm:max-w-[520px]">
            <DialogHeader>
                <DialogTitle>Editar Lección: {currentEditingLesson?.nombre}</DialogTitle>
                <DialogDescription>Modifica los detalles de esta lección.</DialogDescription>
            </DialogHeader>
            <Form {...editLessonForm}>
                <form onSubmit={editLessonForm.handleSubmit(onEditLessonSubmit)} className="space-y-6 py-4">
                    <FormField control={editLessonForm.control} name="lessonName" render={({ field }) => (<FormItem><FormLabel>Nombre Lección</FormLabel><FormControl><Input placeholder="Título de la lección" {...field} disabled={isEditingLesson || isUploadingContent} /></FormControl><FormMessage /></FormItem>)} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField 
                            control={editLessonForm.control} 
                            name="lessonContentType" 
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tipo Contenido</FormLabel>
                                    <Select 
                                        onValueChange={(value) => {
                                            field.onChange(value);
                                            setSelectedLessonContentType(value as LessonContentType);
                                            setLessonContentFile(null); 
                                            editLessonForm.setValue('lessonContentText', currentEditingLesson?.contenidoPrincipal.tipo === value && (value === 'texto_rico' || value === 'quiz') ? currentEditingLesson?.contenidoPrincipal.texto || '' : ''); 
                                        }} 
                                        value={field.value} 
                                        disabled={isEditingLesson || isUploadingContent}
                                    >
                                        <FormControl><SelectTrigger><SelectValue placeholder="Selecciona tipo" /></SelectTrigger></FormControl>
                                        <SelectContent>{lessonContentTypes.map(type => <SelectItem key={type} value={type}>{type.replace('_', ' ').replace(/\\b\\w/g, l => l.toUpperCase())}</SelectItem>)}</SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} 
                        />
                        <FormField control={editLessonForm.control} name="lessonDuration" render={({ field }) => (<FormItem><FormLabel>Duración Estimada</FormLabel><FormControl><Input placeholder="Ej: 10 min, 3 págs" {...field} disabled={isEditingLesson || isUploadingContent} /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                    {renderLessonContentField(editLessonForm, editLessonForm.watch('lessonContentType'), !!(isEditingLesson || isUploadingContent))}
                    <FormField control={editLessonForm.control} name="lessonIsPreview" render={({ field }) => (<FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3 shadow-sm"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isEditingLesson || isUploadingContent} /></FormControl><div className="space-y-1 leading-none"><FormLabel>¿Es vista previa gratuita?</FormLabel></div></FormItem>)} />
                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="outline" disabled={isEditingLesson || isUploadingContent}>Cancelar</Button></DialogClose>
                        <Button type="submit" disabled={isEditingLesson || isUploadingContent}>
                            {isEditingLesson || isUploadingContent ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            {isUploadingContent ? 'Subiendo...' : (isEditingLesson ? 'Guardando...' : 'Guardar Cambios')}
                        </Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
    </Dialog>

    {/* Delete Lesson Confirmation Dialog */}
    <AlertDialog open={showDeleteLessonDialog} onOpenChange={setShowDeleteLessonDialog}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro de que quieres eliminar esta lección?</AlertDialogTitle>
            <AlertDialogDescription>
                Esta acción no se puede deshacer. Se eliminará la lección <span className="font-semibold">"{lessonToDelete?.nombre}"</span>.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <Button variant="outline" onClick={() => {setLessonToDelete(null); setShowDeleteLessonDialog(false);}} disabled={isDeletingLesson}>Cancelar</Button>
            <Button onClick={handleDeleteLesson} disabled={isDeletingLesson} variant="destructive">
                {isDeletingLesson ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Eliminar Lección
            </Button>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>

    {/* Preview Lesson Dialog */}
    <Dialog open={isPreviewLessonDialogOpen} onOpenChange={(isOpen) => {
        setIsPreviewLessonDialogOpen(isOpen);
        if (!isOpen) {
            setLessonToPreview(null);
        }
    }}>
        <DialogContent className="sm:max-w-[700px] md:max-w-[80vw] lg:max-w-[60vw] max-h-[90vh] flex flex-col">
            <DialogHeader>
                <DialogTitle className="truncate">Vista Previa: {lessonToPreview?.nombre || 'Lección'}</DialogTitle>
                <DialogDescription>
                    Tipo: {lessonToPreview?.contenidoPrincipal.tipo.replace('_', ' ').replace(/\\b\\w/g, l => l.toUpperCase())} | Duración: {lessonToPreview?.duracionEstimada}
                </DialogDescription>
            </DialogHeader>
            <div className="flex-grow overflow-y-auto py-4">
                {renderLessonPreviewContent()}
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="outline">Cerrar</Button>
                </DialogClose>
            </DialogFooter>
        </DialogContent>
    </Dialog>

    </div>
  );
}
