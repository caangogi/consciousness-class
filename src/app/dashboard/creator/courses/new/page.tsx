
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import type { CreateCourseDto } from '@/features/course/infrastructure/dto/create-course.dto';
import type { UpdateCourseDto } from '@/features/course/infrastructure/dto/update-course.dto';
import { type CourseAccessType, type CourseStatus, type CourseProperties } from '@/features/course/domain/entities/course.entity';
import type { ModuleProperties } from '@/features/course/domain/entities/module.entity';
import type { CreateModuleDto } from '@/features/course/infrastructure/dto/create-module.dto';
import { ArrowRight, Loader2, Info, ListChecks, Settings, Image as ImageIcon, FileText, PlusCircle, UploadCloud } from 'lucide-react';
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


const courseCategories = [
  "Desarrollo Web", "Desarrollo Móvil", "Data Science", "Marketing Digital", 
  "Diseño Gráfico", "Fotografía", "Negocios", "Finanzas Personales", 
  "Productividad", "Idiomas", "Música", "Salud y Bienestar"
];

const courseStatuses: CourseStatus[] = ['borrador', 'publicado', 'en_revision', 'archivado'];


export default function NewCoursePage() {
  const { toast } = useToast();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<string>("info"); 
  const [isLoading, setIsLoading] = useState(false);
  const [isModuleLoading, setIsModuleLoading] = useState(false);
  const [createdCourseId, setCreatedCourseId] = useState<string | null>(null);
  const [courseDetails, setCourseDetails] = useState<CourseProperties | null>(null);
  const [modules, setModules] = useState<ModuleProperties[]>([]);

  // State for Step 3 - Publication Settings
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
    defaultValues: {
      moduleName: '',
    }
  });

  // Load existing course details into Step 3 form states
  useEffect(() => {
    if (courseDetails) {
      setCoverImagePreviewUrl(courseDetails.imagenPortadaUrl || null);
      setVideoTrailerUrlInput(courseDetails.videoTrailerUrl || '');
      setSelectedStatus(courseDetails.estado || 'borrador');
    }
  }, [courseDetails]);


  const fetchModules = useCallback(async (courseId: string) => {
    if (!courseId) return;
    setIsModuleLoading(true);
    try {
      const response = await fetch(`/api/courses/${courseId}/modules`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || "Error al cargar módulos.");
      }
      const data = await response.json();
      setModules(data.modules || []);
    } catch (error: any) {
      toast({ title: "Error al Cargar Módulos", description: error.message, variant: "destructive" });
      setModules([]);
    } finally {
      setIsModuleLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (createdCourseId) {
      fetchModules(createdCourseId);
    }
  }, [createdCourseId, fetchModules]);

  const handleNextStep = () => {
    if (currentStep === "info" && createdCourseId) setCurrentStep("structure");
    else if (currentStep === "structure" && createdCourseId) setCurrentStep("settings");
  };
  
  const handlePreviousStep = () => {
    if (currentStep === "settings") setCurrentStep("structure");
    else if (currentStep === "structure") setCurrentStep("info");
  }

  const onSubmitStep1 = async (values: Step1FormValues) => {
    if (!auth.currentUser) {
      toast({ title: "Error de autenticación", description: "Debes iniciar sesión para crear/actualizar un curso.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const idToken = await auth.currentUser.getIdToken(true);
      
      let response;
      let successMessage = "";
      let endpoint = "";
      let method = "POST";

      if (createdCourseId) {
        endpoint = `/api/courses/update/${createdCourseId}`;
        const dto: UpdateCourseDto = { ...values, tipoAcceso: values.tipoAcceso as CourseAccessType };
        response = await fetch(endpoint, {
          method,
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}`},
          body: JSON.stringify(dto),
        });
        successMessage = "Información básica del curso actualizada.";
      } else {
        endpoint = '/api/courses/create';
        const dto: CreateCourseDto = { ...values, tipoAcceso: values.tipoAcceso as CourseAccessType };
        response = await fetch(endpoint, {
          method,
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}`},
          body: JSON.stringify(dto),
        });
        successMessage = "Información básica del curso guardada.";
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Error al procesar la información del curso.');
      }

      const responseData = await response.json();
      setCourseDetails(responseData.course); // Store full course details
      
      if (!createdCourseId && responseData.courseId) {
        setCreatedCourseId(responseData.courseId);
      }

      toast({ title: "Paso 1 Completado", description: successMessage });
      setCurrentStep("structure"); 
    } catch (error: any) {
      console.error("Error procesando curso:", error);
      toast({ title: "Error", description: error.message || "No se pudo procesar el curso.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const onAddModule = async (values: ModuleFormValues) => {
    if (!createdCourseId || !auth.currentUser) {
      toast({ title: "Error", description: "Se requiere un curso creado e iniciar sesión.", variant: "destructive"});
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
      
      toast({title: "Módulo Creado", description: `El módulo "${values.moduleName}" ha sido añadido.`});
      moduleForm.reset();
      await fetchModules(createdCourseId); 

    } catch (error: any) {
      console.error("Error añadiendo módulo:", error);
      toast({title: "Error al Añadir Módulo", description: error.message, variant: "destructive"});
    } finally {
      setIsModuleLoading(false);
    }
  };

  const handleCoverImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
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
      toast({ title: "Error", description: "Se requiere un curso e iniciar sesión.", variant: "destructive" });
      return;
    }
    setIsSavingSettings(true);
    setIsUploadingCover(!!coverImageFile);

    let uploadedImageUrl: string | null = courseDetails?.imagenPortadaUrl || null;

    try {
      const idToken = await auth.currentUser.getIdToken(true);

      if (coverImageFile) {
        const fileExtension = coverImageFile.name.split('.').pop();
        const storageRef = ref(storage, `cursos/${createdCourseId}/portada/cover.${fileExtension}`);
        
        // If there was a previous image, attempt to delete it (optional, depends on desired behavior)
        // For simplicity, we might just overwrite or rely on unique names if versions are needed
        // If previous URL is known and different, one might delete:
        // if (courseDetails?.imagenPortadaUrl) { try { await deleteObject(ref(storage, courseDetails.imagenPortadaUrl)); } catch (e) { console.warn("Old image not found or delete failed", e)} }

        await uploadBytes(storageRef, coverImageFile);
        uploadedImageUrl = await getDownloadURL(storageRef);
        setCoverImagePreviewUrl(uploadedImageUrl); // Update preview with final URL
        setCoverImageFile(null); // Clear the file state
        setIsUploadingCover(false);
      }

      const dto: UpdateCourseDto = {
        imagenPortadaUrl: uploadedImageUrl,
        videoTrailerUrl: videoTrailerUrlInput || null,
        estado: selectedStatus,
      };

      const response = await fetch(`/api/courses/update/${createdCourseId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify(dto),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || "Error al guardar la configuración de publicación.");
      }
      const responseData = await response.json();
      setCourseDetails(responseData.course); // Update local course details

      toast({ title: "Configuración Guardada", description: "Los cambios de publicación han sido guardados." });
    } catch (error: any) {
      console.error("Error guardando configuración de publicación:", error);
      toast({ title: "Error al Guardar", description: error.message, variant: "destructive" });
      setIsUploadingCover(false);
    } finally {
      setIsSavingSettings(false);
    }
  };
  
  const getTabClass = (tabValue: string) => {
    let baseClass = "flex items-center gap-2";
    if (tabValue === currentStep) {
      return `${baseClass} data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary`;
    }
    if (tabValue === "info" && (currentStep === "structure" || currentStep === "settings") && createdCourseId) return baseClass;
    if (tabValue === "structure" && currentStep === "settings" && createdCourseId) return baseClass;
    if ((tabValue === "structure" || tabValue === "settings") && !createdCourseId) return `${baseClass} text-muted-foreground cursor-not-allowed`;
    
    return baseClass;
  };


  return (
    <div className="container mx-auto py-8 px-4 md:px:6">
      <Card className="max-w-4xl mx-auto shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-headline">{createdCourseId ? "Editar Curso" : "Crear Nuevo Curso"}</CardTitle>
          <CardDescription>Completa los siguientes pasos para configurar tu curso.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={currentStep} onValueChange={(newStep) => {
            if (newStep === "info" || (newStep === "structure" && createdCourseId) || (newStep === "settings" && createdCourseId)) {
              setCurrentStep(newStep);
            } else {
              toast({title: "Paso Bloqueado", description: "Completa los pasos anteriores primero.", variant: "default"});
            }
          }} 
          className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="info" className={getTabClass("info")} disabled={isLoading || isSavingSettings}>
                <Info className="h-5 w-5" /> Información
              </TabsTrigger>
              <TabsTrigger value="structure" className={getTabClass("structure")} disabled={isLoading || isSavingSettings || !createdCourseId}>
                <ListChecks className="h-5 w-5" /> Estructura
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
                      <FormField
                        control={formStep1.control}
                        name="nombre"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre del Curso</FormLabel>
                            <FormControl><Input placeholder="Ej: Curso Completo de Next.js y Firebase" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={formStep1.control}
                        name="descripcionCorta"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Descripción Corta (Subtítulo)</FormLabel>
                            <FormControl><Input placeholder="Un resumen atractivo de tu curso (máx. 200 caracteres)" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={formStep1.control}
                        name="descripcionLarga"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Descripción Larga</FormLabel>
                            <FormControl><Textarea rows={6} placeholder="Describe en detalle tu curso: qué aprenderán, para quién es, etc." {...field} /></FormControl>
                            <FormDescription>Puedes usar Markdown para formatear el texto.</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid md:grid-cols-2 gap-6">
                        <FormField
                          control={formStep1.control}
                          name="categoria"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Categoría</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger><SelectValue placeholder="Selecciona una categoría" /></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {courseCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={formStep1.control}
                          name="tipoAcceso"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tipo de Acceso</FormLabel>
                               <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger><SelectValue placeholder="Selecciona tipo de acceso" /></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="unico">Pago Único</SelectItem>
                                  <SelectItem value="suscripcion">Suscripción / Membresía</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid md:grid-cols-2 gap-6">
                        <FormField
                          control={formStep1.control}
                          name="precio"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Precio (USD)</FormLabel>
                              <FormControl><Input type="number" step="0.01" placeholder="Ej: 49.99" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                         <FormField
                          control={formStep1.control}
                          name="duracionEstimada"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Duración Estimada</FormLabel>
                              <FormControl><Input placeholder="Ej: 20 horas de video" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={isLoading}>
                          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                          {createdCourseId ? "Actualizar y Continuar" : "Guardar y Continuar"} <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="structure">
              <Card>
                <CardHeader>
                  <CardTitle>2. Estructura del Curso</CardTitle>
                  <CardDescription>Organiza los módulos y lecciones de tu curso.</CardDescription>
                </CardHeader>
                <CardContent>
                  {createdCourseId ? (
                    <>
                      <p className="mb-4 text-sm text-muted-foreground">Curso: {courseDetails?.nombre || `ID: ${createdCourseId}`}</p>
                      
                      <Form {...moduleForm}>
                        <form onSubmit={moduleForm.handleSubmit(onAddModule)} className="flex items-start gap-4 mb-6">
                          <FormField
                            control={moduleForm.control}
                            name="moduleName"
                            render={({ field }) => (
                              <FormItem className="flex-grow">
                                <FormLabel className="sr-only">Nombre del Módulo</FormLabel>
                                <FormControl>
                                  <Input placeholder="Nombre del nuevo módulo" {...field} disabled={isModuleLoading} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button type="submit" disabled={isModuleLoading}>
                            {isModuleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4"/>}
                            Añadir Módulo
                          </Button>
                        </form>
                      </Form>

                      {isModuleLoading && modules.length === 0 && <p className="text-muted-foreground text-center py-2">Cargando módulos...</p>}
                      {!isModuleLoading && modules.length === 0 && (
                        <p className="text-muted-foreground text-center py-4">Aún no has añadido módulos a este curso.</p>
                      )}
                      {modules.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-lg font-semibold mb-2">Módulos del Curso:</h4>
                          <ul className="list-disc list-inside pl-4 space-y-1 bg-secondary/30 p-4 rounded-md">
                            {modules.sort((a,b) => a.orden - b.orden).map(module => (
                              <li key={module.id} className="text-foreground/90">{module.nombre}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">Completa el paso de Información Básica primero.</p>
                  )}
                   <div className="flex justify-between pt-6 mt-4 border-t">
                      <Button type="button" variant="outline" onClick={handlePreviousStep} disabled={isLoading || isModuleLoading || isSavingSettings}>
                        Anterior
                      </Button>
                      <Button type="button" onClick={handleNextStep} disabled={isLoading || isModuleLoading || isSavingSettings || !createdCourseId}>
                         Siguiente <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
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
                       <p className="mb-1 text-sm text-muted-foreground">Curso: {courseDetails?.nombre || `ID: ${createdCourseId}`}</p>
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
                          <p className="mt-2 text-xs text-muted-foreground text-center">Sube una imagen atractiva (recomendado 1200x675px, máx. 5MB).</p>
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
                           <p className="mt-2 text-xs text-muted-foreground">Un video corto para promocionar tu curso.</p>
                      </Card>
                       <Card className="p-4 shadow-sm">
                          <div className="flex items-center gap-2 mb-3">
                              <Settings className="h-5 w-5 text-primary"/>
                              <h4 className="font-semibold text-lg">Estado de Publicación</h4>
                          </div>
                            <Select 
                                onValueChange={(value) => setSelectedStatus(value as CourseStatus)} 
                                defaultValue={selectedStatus}
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
                           <p className="mt-2 text-xs text-muted-foreground">Define si el curso es un borrador o está publicado.</p>
                      </Card>

                      <div className="flex justify-end pt-4">
                        <Button onClick={onSaveSettings} disabled={isSavingSettings || isUploadingCover}>
                          {isSavingSettings ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                          {isSavingSettings ? (isUploadingCover ? 'Subiendo imagen...' : 'Guardando...') : 'Guardar Cambios de Publicación'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">Completa los pasos anteriores primero.</p>
                  )}
                   <div className="flex justify-between pt-6 mt-4 border-t">
                       <Button type="button" variant="outline" onClick={handlePreviousStep} disabled={isLoading || isSavingSettings}>
                        Anterior
                      </Button>
                      <Button type="button" onClick={() => router.push(`/dashboard/creator/courses`)} disabled={isLoading || isSavingSettings || !createdCourseId}>
                        Finalizar e Ir al Listado
                      </Button>
                    </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
