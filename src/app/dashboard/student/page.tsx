
'use client'; 

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import Image from 'next/image';
import { BookOpen, UserCircle, Gift, Copy, Edit, Award, Camera, UploadCloud, Rocket, Loader2, AlertTriangle, Info, Link as LinkIcon, Share2, ExternalLink, DollarSign } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton"; 
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { auth, storage } from '@/lib/firebase/config'; 
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import type { CourseProperties } from '@/features/course/domain/entities/course.entity';
import type { UserCourseProgressProperties } from '@/features/progress/domain/entities/user-course-progress.entity';

interface EnrolledCourseApiData extends CourseProperties {
  progress?: UserCourseProgressProperties;
}

interface PromotableCourseData {
  id: string;
  nombre: string;
  imagenPortadaUrl: string | null;
  dataAiHintImagenPortada?: string | null;
  comisionReferidoPorcentaje: number | null;
  precio: number;
  categoria: string;
}

const profileFormSchema = z.object({
  nombre: z.string().min(1, { message: "El nombre es requerido." }),
  apellido: z.string().min(1, { message: "El apellido es requerido." }),
});
type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function StudentDashboardPage() {
  const { currentUser, userRole, loading: authLoading, refreshUserProfile } = useAuth();
  const { toast } = useToast();
  
  const [enrolledCoursesApiData, setEnrolledCoursesApiData] = useState<EnrolledCourseApiData[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [coursesError, setCoursesError] = useState<string | null>(null);

  const [promotableCourses, setPromotableCourses] = useState<PromotableCourseData[]>([]);
  const [isLoadingPromotableCourses, setIsLoadingPromotableCourses] = useState(true);
  const [promotableCoursesError, setPromotableCoursesError] = useState<string | null>(null);
  
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRequestingCreatorRole, setIsRequestingCreatorRole] = useState(false);
  const [showBecomeCreatorDialog, setShowBecomeCreatorDialog] = useState(false);
  const [baseUrl, setBaseUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setBaseUrl(window.location.origin);
    }
  }, []);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      nombre: '',
      apellido: '',
    },
  });

  const fetchEnrolledCourses = useCallback(async () => {
    if (!currentUser || !auth.currentUser) {
      setIsLoadingCourses(false);
      return;
    }
    setIsLoadingCourses(true);
    setCoursesError(null);
    try {
      const idToken = await auth.currentUser.getIdToken(true);
      const response = await fetch('/api/student/my-courses', {
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Error al cargar los cursos inscritos.');
      }
      const data = await response.json();
      setEnrolledCoursesApiData(data.enrolledCourses || []);
    } catch (err: any) {
      setCoursesError(err.message);
      toast({ title: "Error al Cargar Cursos", description: err.message, variant: "destructive" });
    } finally {
      setIsLoadingCourses(false);
    }
  }, [currentUser, toast]); 

  const fetchPromotableCourses = useCallback(async () => {
    setIsLoadingPromotableCourses(true);
    setPromotableCoursesError(null);
    try {
      const response = await fetch('/api/courses/promotable');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Error al cargar cursos promocionables.');
      }
      const data = await response.json();
      setPromotableCourses(data.courses || []);
    } catch (err: any) {
      setPromotableCoursesError(err.message);
      toast({ title: "Error Cursos Promocionables", description: err.message, variant: "destructive"});
    } finally {
      setIsLoadingPromotableCourses(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!authLoading && currentUser?.uid) {
      fetchEnrolledCourses();
      fetchPromotableCourses();
    } else if (!authLoading && !currentUser) {
      setEnrolledCoursesApiData([]);
      setIsLoadingCourses(false); 
      setPromotableCourses([]);
      setIsLoadingPromotableCourses(false);
    }
  }, [authLoading, currentUser?.uid, fetchEnrolledCourses, fetchPromotableCourses]);


  useEffect(() => {
    if (currentUser && isEditDialogOpen) {
      form.reset({
        nombre: currentUser.nombre || '',
        apellido: currentUser.apellido || '',
      });
      setImagePreviewUrl(currentUser.photoURL || null); 
      setImageFile(null); 
    }
  }, [currentUser, isEditDialogOpen, form]);


  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImageFile(null);
      setImagePreviewUrl(currentUser?.photoURL || null); 
    }
  };

  async function onSubmitProfile(values: ProfileFormValues) {
    if (!auth.currentUser) {
      toast({ title: "Error de Autenticación", description: "Usuario no autenticado. Por favor, inicia sesión de nuevo.", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }
    const activeUser = auth.currentUser; 

    setIsSubmitting(true);
    let uploadedPhotoURL: string | null = currentUser?.photoURL || null;

    try {
      if (imageFile) {
        setIsUploadingImage(true);
        const originalFileName = imageFile.name;
        const lastDot = originalFileName.lastIndexOf('.');
        const fileExtension = lastDot > -1 ? originalFileName.substring(lastDot + 1).toLowerCase() : 'png';
        
        const finalFileNameInStorage = `profile.${fileExtension}`; 
        const storagePath = `users/${activeUser.uid}/${finalFileNameInStorage}`;
        
        const fileMetadata = {
          contentType: imageFile.type
        };

        const storageRefInstance = ref(storage, storagePath);

        try {
            await uploadBytes(storageRefInstance, imageFile, fileMetadata);
            uploadedPhotoURL = await getDownloadURL(storageRefInstance);
        } catch (uploadError: any) {
            toast({
                title: "Error al Subir Imagen",
                description: `Storage: ${uploadError.message || 'Error desconocido.'}. Ver consola para detalles.`,
                variant: "destructive",
            });
            setIsUploadingImage(false);
            setIsSubmitting(false); 
            return; 
        }
        setIsUploadingImage(false);
      }
      
      const idToken = await activeUser.getIdToken(true);
      const updateDto = {
        nombre: values.nombre,
        apellido: values.apellido,
        photoURL: uploadedPhotoURL,
      };

      const response = await fetch('/api/users/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify(updateDto),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || "Error al actualizar el perfil.");
      }

      await refreshUserProfile(); 
      toast({ title: "Perfil Actualizado", description: "Tu información ha sido actualizada." });
      setIsEditDialogOpen(false);

    } catch (error: any) {
      toast({ title: "Error de Actualización", description: error.message || "No se pudo actualizar el perfil.", variant: "destructive" });
      setIsUploadingImage(false);
    } finally {
      setIsSubmitting(false);
    }
  }
  
  const handleCopyReferralCode = () => {
    if (currentUser?.referralCodeGenerated) {
        navigator.clipboard.writeText(currentUser.referralCodeGenerated)
        .then(() => {
            toast({ title: "Código Copiado", description: "Tu código de referido ha sido copiado al portapapeles."});
        })
        .catch(err => {
            toast({ title: "Error al Copiar", description: "No se pudo copiar el código.", variant: "destructive"});
        });
    } else {
        toast({ title: "Error", description: "No hay código de referido para copiar.", variant: "destructive"});
    }
  };

  const handleCopyReferralLink = (type: 'signup' | 'home' | 'course', courseId?: string) => {
    if (currentUser?.referralCodeGenerated && baseUrl) {
        let path = '';
        let messageType = '';
        if (type === 'signup') {
            path = '/signup';
            messageType = 'registro';
        } else if (type === 'home') {
            path = '/';
            messageType = 'la página principal';
        } else if (type === 'course' && courseId) {
            path = `/courses/${courseId}`;
            messageType = `el curso específico`;
        } else {
             toast({ title: "Error", description: "Información incompleta para generar enlace de referido.", variant: "destructive"});
            return;
        }

        const link = `${baseUrl}${path}?ref=${currentUser.referralCodeGenerated}`;
        navigator.clipboard.writeText(link)
        .then(() => {
            toast({ title: "Enlace Copiado", description: `Tu enlace de referido a ${messageType} ha sido copiado.`});
        })
        .catch(err => {
            toast({ title: "Error al Copiar Enlace", description: "No se pudo copiar el enlace.", variant: "destructive"});
        });
    } else {
        toast({ title: "Error", description: "No se pudo generar el enlace de referido (código o URL base faltante).", variant: "destructive"});
    }
  };

  const handleRequestCreatorRole = async () => {
    if (!auth.currentUser) {
      toast({ title: "Error de Autenticación", variant: "destructive" });
      return;
    }
    setIsRequestingCreatorRole(true);
    setShowBecomeCreatorDialog(false);
    try {
      const idToken = await auth.currentUser.getIdToken(true);
      const response = await fetch('/api/users/request-creator-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || "Error al solicitar rol de creador.");
      }
      
      await refreshUserProfile();
      toast({ title: "¡Rol Actualizado!", description: "Ahora eres un Creator. Explora las nuevas opciones en tu dashboard." });
    } catch (error: any) {
      toast({ title: "Error al Cambiar Rol", description: error.message, variant: "destructive" });
    } finally {
      setIsRequestingCreatorRole(false);
    }
  };

  const getInitials = (name?: string | null, surname?: string | null) => {
    if (name && surname) return `${name[0]}${surname[0]}`.toUpperCase();
    if (name) return name.substring(0, 2).toUpperCase();
    return 'MB'; 
  };

  if (authLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-1/3" />
        <Card className="shadow-lg">
          <CardHeader><Skeleton className="h-8 w-1/3 mb-2" /><Skeleton className="h-4 w-1/2" /></CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="w-full aspect-[16/10]" />
                  <CardContent className="p-4 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-2 w-full" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-9 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
        <div className="grid md:grid-cols-2 gap-8">
            <Card className="shadow-lg"><CardHeader><Skeleton className="h-6 w-1/4" /></CardHeader><CardContent className="space-y-3"><Skeleton className="h-5 w-3/5" /><Skeleton className="h-5 w-4/5" /><Skeleton className="h-9 w-1/3" /></CardContent></Card>
            <Card className="shadow-lg"><CardHeader><Skeleton className="h-6 w-1/3" /></CardHeader><CardContent className="space-y-3"><Skeleton className="h-10 w-full" /><Skeleton className="h-5 w-1/2" /><Skeleton className="h-5 w-2/3" /></CardContent></Card>
        </div>
        <Card className="shadow-lg"><CardHeader><Skeleton className="h-6 w-1/3" /></CardHeader><CardContent><Skeleton className="h-10 w-full" /></CardContent></Card>
      </div>
    );
  }
  
  if (!currentUser) {
    return <p className="text-center text-lg">Por favor, <Link href="/login" className="text-primary hover:underline">inicia sesión</Link> para ver tu panel.</p>;
  }

  const referralCode = currentUser.referralCodeGenerated || 'GENERANDO...';
  const successfulReferrals = currentUser.referidosExitosos || 0;
  const pendingCommissions = `${(currentUser.balanceComisionesPendientes || 0).toFixed(2)} €`;
  const generalCredits = `${(currentUser.balanceCredito || 0).toFixed(2)} €`;


  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold font-headline">Panel de Estudiante</h1>

      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <CardTitle className="text-2xl font-headline">Mis Cursos</CardTitle>
          </div>
          <CardDescription>Continúa tu aprendizaje donde lo dejaste.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingCourses ? (
             <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="w-full aspect-[16/10]" />
                  <CardContent className="p-4 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-2 w-full" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-9 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : coursesError ? (
             <div className="text-center py-6">
                <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-3" />
                <h3 className="text-lg font-semibold text-destructive">Error al Cargar Cursos</h3>
                <p className="text-muted-foreground text-sm mb-3">{coursesError}</p>
                <Button onClick={fetchEnrolledCourses} variant="outline" size="sm" disabled={isLoadingCourses}>
                    {isLoadingCourses ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Reintentar
                </Button>
            </div>
          ) : enrolledCoursesApiData.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {enrolledCoursesApiData.map(course => (
                <Card key={course.id} className="overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                  <Link href={`/courses/${course.id}`} className="block relative aspect-[16/10] w-full">
                    <Image 
                      src={course.imagenPortadaUrl || 'https://placehold.co/300x180.png'} 
                      alt={course.nombre} 
                      fill
                      className="object-cover" 
                      data-ai-hint={course.dataAiHintImagenPortada || 'course student dashboard'}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </Link>
                  <CardContent className="p-4 flex-grow">
                    <h3 className="font-semibold mb-1 truncate text-md leading-tight">{course.nombre}</h3>
                    {course.progress !== undefined && (
                      <>
                        <Progress value={course.progress.porcentajeCompletado} className="mb-1 h-1.5" />
                        <p className="text-xs text-muted-foreground mb-3">{course.progress.porcentajeCompletado}% completado</p>
                      </>
                    )}
                     {course.progress === undefined && (
                        <p className="text-xs text-muted-foreground mb-3">Progreso no disponible</p>
                     )}
                  </CardContent>
                  <CardFooter className="p-4 border-t">
                     <Button variant="default" size="sm" asChild className="w-full">
                      <Link href={`/learn/${course.id}/${course.modules && course.modules.length > 0 && course.modules[0].lessons && course.modules[0].lessons.length > 0 ? course.modules[0].lessons[0].id : 'start'}`}>Ir al Curso</Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground py-4 text-center">Aún no te has inscrito a ningún curso. <Link href="/courses" className="text-primary hover:underline">Explora cursos</Link>.</p>
          )}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-8">
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-2">
              <UserCircle className="h-6 w-6 text-primary" />
              <CardTitle className="text-2xl font-headline">Mi Perfil</CardTitle>
            </div>
            <CardDescription>Gestiona tu información personal y configuración de cuenta.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                    <AvatarImage src={currentUser.photoURL || `https://placehold.co/80x80.png?text=${getInitials(currentUser.nombre, currentUser.apellido)}`} alt="Foto de perfil" data-ai-hint="user avatar"/>
                    <AvatarFallback>{getInitials(currentUser.nombre, currentUser.apellido)}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="text-lg font-semibold">{currentUser.nombre && currentUser.apellido ? `${currentUser.nombre} ${currentUser.apellido}` : (currentUser.displayName || 'Nombre no especificado')}</p>
                    <p className="text-sm text-muted-foreground">{currentUser.email || 'Email no especificado'}</p>
                </div>
            </div>
            <div className="flex flex-wrap gap-2">
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                    <Edit className="mr-2 h-4 w-4" /> Editar Perfil
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[480px]">
                    <DialogHeader>
                    <DialogTitle>Editar Perfil</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmitProfile)} className="space-y-6 py-4">
                        <div className="space-y-4 text-center">
                            <Avatar className="h-32 w-32 mx-auto ring-2 ring-primary ring-offset-2 ring-offset-background">
                                <AvatarImage src={imagePreviewUrl || `https://placehold.co/128x128.png?text=${getInitials(form.getValues('nombre'), form.getValues('apellido'))}`} alt="Vista previa de perfil" data-ai-hint="profile preview"/>
                                <AvatarFallback>{getInitials(form.getValues('nombre'), form.getValues('apellido'))}</AvatarFallback>
                            </Avatar>
                            <div className="relative w-full max-w-xs mx-auto">
                                <Input 
                                    id="picture" 
                                    type="file" 
                                    accept="image/png, image/jpeg, image/webp, image/gif"
                                    onChange={handleImageChange} 
                                    className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
                                    disabled={isUploadingImage || isSubmitting}
                                />
                                <Button type="button" variant="outline" className="w-full pointer-events-none relative">
                                    {isUploadingImage && <UploadCloud className="mr-2 h-4 w-4 animate-pulse" />}
                                    {!isUploadingImage && <Camera className="mr-2 h-4 w-4" />}
                                    {isUploadingImage ? 'Subiendo...' : (imageFile ? (imageFile.name.length > 25 ? imageFile.name.substring(0,22) + '...' : imageFile.name) : 'Cambiar foto')}
                                </Button>
                                {isUploadingImage && <Progress value={undefined} className="absolute bottom-0 left-0 right-0 h-1 w-full rounded-b-md" />}
                            </div>
                        </div>
                        <FormField
                        control={form.control}
                        name="nombre"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Nombre</FormLabel>
                            <FormControl>
                                <Input placeholder="Tu nombre" {...field} disabled={isSubmitting || isUploadingImage} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={form.control}
                        name="apellido"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Apellido</FormLabel>
                            <FormControl>
                                <Input placeholder="Tu apellido" {...field} disabled={isSubmitting || isUploadingImage} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="outline" disabled={isSubmitting || isUploadingImage}>Cancelar</Button>
                        </DialogClose>
                        <Button type="submit" disabled={isUploadingImage || isSubmitting}>
                            {isSubmitting ? (isUploadingImage ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Loader2 className="mr-2 h-4 w-4 animate-spin" />) : null}
                            {isSubmitting ? (isUploadingImage ? 'Subiendo Imagen...' : 'Guardando...') : 'Guardar Cambios'}
                        </Button>
                        </DialogFooter>
                    </form>
                    </Form>
                </DialogContent>
                </Dialog>

                {userRole === 'student' && (
                   <AlertDialog open={showBecomeCreatorDialog} onOpenChange={setShowBecomeCreatorDialog}>
                        <AlertDialogTrigger asChild>
                            <Button variant="default" size="sm" disabled={isRequestingCreatorRole}>
                                <Rocket className="mr-2 h-4 w-4" /> Convertirme en Creator
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>¿Quieres convertirte en Creator?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Como Creator, podrás crear y vender tus propios cursos en MentorBloom.
                                Esta acción cambiará tu rol de Student a Creator.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel disabled={isRequestingCreatorRole}>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleRequestCreatorRole} disabled={isRequestingCreatorRole}>
                                {isRequestingCreatorRole ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                                {isRequestingCreatorRole ? 'Procesando...' : 'Sí, Convertirme en Creator'}
                            </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
             <div className="flex items-center gap-2">
                <Gift className="h-6 w-6 text-primary" />
                <CardTitle className="text-2xl font-headline">Mi Programa de Referidos</CardTitle>
            </div>
            <CardDescription>Comparte tu código o enlaces y obtén recompensas.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
                <p className="text-sm font-medium mb-1">Tu Código Personal:</p>
                <div className="flex items-center gap-2 p-3 bg-secondary rounded-md">
                <p className="text-lg font-mono text-primary flex-grow truncate">{referralCode}</p>
                <Button variant="ghost" size="icon" onClick={handleCopyReferralCode} disabled={!currentUser.referralCodeGenerated || currentUser.referralCodeGenerated === 'GENERANDO...' || !navigator.clipboard}>
                    <Copy className="h-5 w-5" />
                    <span className="sr-only">Copiar código</span>
                </Button>
                </div>
            </div>
             <div>
                <p className="text-sm font-medium mb-1">Enlaces Rápidos para Compartir:</p>
                <div className="space-y-2">
                    <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => handleCopyReferralLink('signup')} disabled={!currentUser.referralCodeGenerated || !baseUrl || !navigator.clipboard}>
                        <LinkIcon className="mr-2 h-4 w-4"/> Copiar Enlace de Registro
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => handleCopyReferralLink('home')} disabled={!currentUser.referralCodeGenerated || !baseUrl || !navigator.clipboard}>
                        <LinkIcon className="mr-2 h-4 w-4"/> Copiar Enlace a Página Principal
                    </Button>
                </div>
                 <p className="text-xs text-muted-foreground mt-2">
                    También puedes añadir <code className="text-xs bg-muted px-1 py-0.5 rounded">?ref={currentUser.referralCodeGenerated || 'TU_CODIGO'}</code> al final de cualquier URL de curso para compartirlo.
                 </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t mt-4">
                <div>
                    <p className="text-sm font-medium text-muted-foreground">Referidos Exitosos:</p>
                    <p className="text-2xl font-semibold">{successfulReferrals}</p>
                </div>
                 <div>
                    <p className="text-sm font-medium text-muted-foreground">Comisiones Pendientes (Próximamente):</p>
                    <p className="text-2xl font-semibold flex items-center">{currentUser.balanceComisionesPendientes ? `${currentUser.balanceComisionesPendientes.toFixed(2)} €` : '0.00 €'} <DollarSign className="h-5 w-5 ml-1 text-muted-foreground"/></p>
                </div>
            </div>
             <div className="mt-3 p-3 bg-secondary/50 rounded-md text-xs text-secondary-foreground flex items-start gap-2">
                <Info className="h-4 w-4 shrink-0 mt-0.5"/>
                <p>El seguimiento detallado de comisiones y su pago se habilitará próximamente. Por ahora, puedes ver tus referidos exitosos.</p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
            <div className="flex items-center gap-2">
                <Share2 className="h-6 w-6 text-primary" />
                <CardTitle className="text-2xl font-headline">Promociona Cursos y Gana</CardTitle>
            </div>
            <CardDescription>Obtén enlaces de referido para cursos específicos que ofrecen comisión.</CardDescription>
        </CardHeader>
        <CardContent>
            {isLoadingPromotableCourses ? (
                <div className="grid gap-4 md:grid-cols-2">
                    {[...Array(2)].map((_, i) => (
                        <Card key={i} className="p-4 space-y-3">
                            <div className="flex gap-3 items-start">
                                <Skeleton className="h-16 w-24 rounded-md" />
                                <div className="flex-1 space-y-1.5">
                                    <Skeleton className="h-5 w-3/4" />
                                    <Skeleton className="h-4 w-1/2" />
                                    <Skeleton className="h-4 w-1/4" />
                                </div>
                            </div>
                            <Skeleton className="h-9 w-full" />
                        </Card>
                    ))}
                </div>
            ) : promotableCoursesError ? (
                <div className="text-center py-6">
                    <AlertTriangle className="mx-auto h-10 w-10 text-destructive mb-2" />
                    <p className="text-muted-foreground text-sm">{promotableCoursesError}</p>
                </div>
            ) : promotableCourses.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                    {promotableCourses.map(course => (
                        <Card key={course.id} className="p-4">
                            <div className="flex gap-4 items-start mb-3">
                                <Image 
                                    src={course.imagenPortadaUrl || 'https://placehold.co/100x60.png'}
                                    alt={course.nombre}
                                    width={100}
                                    height={60}
                                    className="rounded-md object-cover aspect-[16/10]"
                                    data-ai-hint={course.dataAiHintImagenPortada || 'course promo image'}
                                />
                                <div className="flex-1">
                                    <h4 className="font-semibold text-sm leading-tight mb-0.5">{course.nombre}</h4>
                                    <p className="text-xs text-muted-foreground">{course.categoria}</p>
                                    <p className="text-xs font-medium text-primary mt-1">Comisión: {course.comisionReferidoPorcentaje}%</p>
                                </div>
                            </div>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="w-full"
                                onClick={() => handleCopyReferralLink('course', course.id)}
                                disabled={!currentUser.referralCodeGenerated || !baseUrl || !navigator.clipboard}
                            >
                                <ExternalLink className="mr-2 h-4 w-4" /> Copiar Enlace de Promoción
                            </Button>
                        </Card>
                    ))}
                </div>
            ) : (
                <p className="text-muted-foreground py-4 text-center text-sm">Actualmente no hay cursos con comisión de referido para promocionar.</p>
            )}
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Award className="h-6 w-6 text-primary" />
            <CardTitle className="text-2xl font-headline">Mis Certificados</CardTitle>
          </div>
          <CardDescription>Visualiza y descarga los certificados de los cursos completados.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="text-center py-6 text-muted-foreground">
                <Award className="mx-auto h-10 w-10 mb-3 opacity-50" />
                <p className="font-medium">Funcionalidad de Certificados Próximamente</p>
                <p className="text-sm">Cuando completes tus cursos, tus certificados aparecerán aquí.</p>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}

    