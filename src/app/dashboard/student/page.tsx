
'use client'; 

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import Image from "next/image";
import { BookOpen, UserCircle, Gift, Copy, Edit, Award, Camera, UploadCloud } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton"; 
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { storage } from '@/lib/firebase/config'; // Import Firebase client storage
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Placeholder data (will be replaced or augmented by real data)
const enrolledCoursesPlaceholder = [
  { id: '1', title: 'Desarrollo Web Avanzado', progress: 75, imageUrl: 'https://placehold.co/300x180.png', dataAiHint: 'web course' },
  { id: '2', title: 'Introducción al Machine Learning', progress: 40, imageUrl: 'https://placehold.co/300x180.png', dataAiHint: 'ml course' },
  { id: '3', title: 'Fotografía Profesional', progress: 100, imageUrl: 'https://placehold.co/300x180.png', dataAiHint: 'photo course' },
];

const certificatesPlaceholder = [
    { id: 'cert1', courseTitle: 'Fotografía Profesional', dateAwarded: '2023-10-15', url: '#' },
];

const profileFormSchema = z.object({
  nombre: z.string().min(1, { message: "El nombre es requerido." }),
  apellido: z.string().min(1, { message: "El apellido es requerido." }),
});
type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function StudentDashboardPage() {
  const { currentUser, loading: authLoading, refreshUserProfile } = useAuth();
  const { toast } = useToast();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      nombre: '',
      apellido: '',
    },
  });

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

  async function onSubmit(values: ProfileFormValues) {
    if (!currentUser) {
      toast({ title: "Error", description: "Usuario no autenticado.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    let uploadedPhotoURL: string | null = currentUser.photoURL || null;

    try {
      if (imageFile) {
        setIsUploadingImage(true);
        try {
          const originalFileName = imageFile.name;
          const lastDot = originalFileName.lastIndexOf('.');
          const fileExtension = lastDot > -1 ? originalFileName.substring(lastDot + 1).toLowerCase() : 'png'; 
          
          const finalFileNameInStorage = `profile.${fileExtension}`; 
          const storagePath = `users/${currentUser.uid}/${finalFileNameInStorage}`;
          
          console.log(`[StudentDashboard] Attempting to upload to Storage path: "${storagePath}"`);
          console.log(`[StudentDashboard] Original file name: "${originalFileName}", Determined extension: "${fileExtension}", Final name in storage: "${finalFileNameInStorage}"`);
          console.log(`[StudentDashboard] File size: ${imageFile.size} bytes, File type: ${imageFile.type}`);
          console.log(`[StudentDashboard] Current user UID: ${currentUser.uid}`);

          const storageRefInstance = ref(storage, storagePath);

          await uploadBytes(storageRefInstance, imageFile);
          uploadedPhotoURL = await getDownloadURL(storageRefInstance);
          console.log(`[StudentDashboard] Upload successful. Photo URL: ${uploadedPhotoURL}`);
        } catch (uploadError: any) {
          console.error("[StudentDashboard] Error during image upload to Firebase Storage:", uploadError);
          toast({
            title: "Error al Subir Imagen",
            description: `No se pudo subir la imagen: ${uploadError.message || 'Error desconocido.'}. Revisa la consola para más detalles.`,
            variant: "destructive",
          });
          setIsUploadingImage(false);
          setIsSubmitting(false); 
          return; 
        }
        setIsUploadingImage(false);
      }
      
      const idToken = await currentUser.getIdToken(true);
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
      console.error("Error al actualizar perfil:", error);
      toast({ title: "Error", description: error.message || "No se pudo actualizar el perfil.", variant: "destructive" });
      setIsUploadingImage(false); // Ensure this is reset on any error
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
            console.error("Error al copiar código de referido:", err);
        });
    } else {
        toast({ title: "Error", description: "No hay código de referido para copiar.", variant: "destructive"});
    }
  }

  const getInitials = (name?: string | null, surname?: string | null) => {
    if (name && surname) return `${name[0]}${surname[0]}`.toUpperCase();
    if (name) return name.substring(0, 2).toUpperCase();
    return 'CC';
  };


  if (authLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-1/3" />
        <Card className="shadow-lg"><CardHeader><Skeleton className="h-6 w-1/4" /></CardHeader><CardContent><Skeleton className="h-20 w-full" /></CardContent></Card>
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

  const enrolledCourses = enrolledCoursesPlaceholder;
  const certificates = certificatesPlaceholder;
  const referralCode = currentUser.referralCodeGenerated || 'GENERANDO...';
  const successfulReferrals = currentUser.referidosExitosos || 0;
  const rewardsEarned = `$${(currentUser.balanceCredito || 0).toFixed(2)} en créditos`;


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
          {enrolledCourses.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {enrolledCourses.map(course => (
                <Card key={course.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <Image src={course.imageUrl} alt={course.title} width={300} height={180} className="w-full aspect-[16/10] object-cover" data-ai-hint={course.dataAiHint}/>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-1 truncate">{course.title}</h3>
                    <Progress value={course.progress} className="mb-2 h-2" />
                    <p className="text-xs text-muted-foreground mb-3">{course.progress}% completado</p>
                    <Button variant="default" size="sm" asChild className="w-full">
                      <Link href={`/learn/${course.id}/lesson-placeholder`}>Continuar Aprendiendo</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">Aún no te has inscrito a ningún curso. <Link href="/courses" className="text-primary hover:underline">Explora cursos</Link>.</p>
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
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
                    <div className="space-y-4 text-center">
                        <Avatar className="h-32 w-32 mx-auto ring-2 ring-primary ring-offset-2 ring-offset-background">
                            <AvatarImage src={imagePreviewUrl || `https://placehold.co/128x128.png?text=${getInitials(form.getValues('nombre'), form.getValues('apellido'))}`} alt="Vista previa de perfil" data-ai-hint="profile preview"/>
                            <AvatarFallback>{getInitials(form.getValues('nombre'), form.getValues('apellido'))}</AvatarFallback>
                        </Avatar>
                        <div className="relative w-full max-w-xs mx-auto">
                            <Input 
                                id="picture" 
                                type="file" 
                                accept="image/png, image/jpeg, image/webp"
                                onChange={handleImageChange} 
                                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                                disabled={isUploadingImage || isSubmitting}
                            />
                            <Button type="button" variant="outline" className="w-full pointer-events-none">
                                <Camera className="mr-2 h-4 w-4" />
                                {isUploadingImage ? 'Subiendo...' : (imageFile ? imageFile.name : 'Cambiar foto')}
                            </Button>
                            {isUploadingImage && <Progress value={undefined} className="h-1 mt-1 w-full" />}
                        </div>
                    </div>
                    <FormField
                      control={form.control}
                      name="nombre"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre</FormLabel>
                          <FormControl>
                            <Input placeholder="Tu nombre" {...field} disabled={isSubmitting} />
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
                            <Input placeholder="Tu apellido" {...field} disabled={isSubmitting} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button type="button" variant="outline" disabled={isSubmitting}>Cancelar</Button>
                      </DialogClose>
                      <Button type="submit" disabled={isUploadingImage || isSubmitting}>
                        {isSubmitting ? (isUploadingImage ? 'Subiendo Imagen...' : 'Guardando...') : 'Guardar Cambios'}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
             <div className="flex items-center gap-2">
                <Gift className="h-6 w-6 text-primary" />
                <CardTitle className="text-2xl font-headline">Mi Código de Referido</CardTitle>
            </div>
            <CardDescription>Comparte tu código y obtén recompensas.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 p-3 bg-secondary rounded-md">
              <p className="text-lg font-mono text-primary flex-grow truncate">{referralCode}</p>
              <Button variant="ghost" size="icon" onClick={handleCopyReferralCode} disabled={!currentUser.referralCodeGenerated || currentUser.referralCodeGenerated === 'GENERANDO...'}>
                <Copy className="h-5 w-5" />
                <span className="sr-only">Copiar código</span>
              </Button>
            </div>
            <p><span className="font-semibold">Referidos Exitosos:</span> {successfulReferrals}</p>
            <p><span className="font-semibold">Recompensas Obtenidas:</span> {rewardsEarned}</p>
            <Button variant="link" asChild className="p-0 h-auto text-primary hover:underline">
              <Link href="/dashboard/student/referrals-history">Ver historial de recompensas</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Award className="h-6 w-6 text-primary" />
            <CardTitle className="text-2xl font-headline">Mis Certificados</CardTitle>
          </div>
          <CardDescription>Visualiza y descarga los certificados de los cursos completados.</CardDescription>
        </CardHeader>
        <CardContent>
          {certificates.length > 0 ? (
            <ul className="space-y-3">
              {certificates.map(cert => (
                <li key={cert.id} className="flex justify-between items-center p-3 border rounded-md hover:bg-secondary/30">
                  <div>
                    <p className="font-semibold">{cert.courseTitle}</p>
                    <p className="text-sm text-muted-foreground">Obtenido el: {cert.dateAwarded}</p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={cert.url} target="_blank" rel="noopener noreferrer">Ver Certificado</Link>
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
             <p className="text-muted-foreground">Aún no has obtenido ningún certificado. ¡Sigue aprendiendo!</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
