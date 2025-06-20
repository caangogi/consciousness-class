
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription as ShadCNAlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Camera, UploadCloud, Loader2, Edit, Trash2, Video, Play, Square, AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from "@/hooks/use-toast";
import { auth, storage } from '@/lib/firebase/config';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import type { UserProfile } from '@/contexts/AuthContext';

const MAX_VIDEO_SIZE_MB = 50;
const MAX_VIDEO_DURATION_SECONDS = 60;

const profileFormSchema = z.object({
  nombre: z.string().min(1, { message: "El nombre es requerido." }),
  apellido: z.string().min(1, { message: "El apellido es requerido." }),
  bio: z.string().max(500, "La biografía no debe exceder los 500 caracteres.").optional(),
});
type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface EditProfileDialogProps {
  currentUser: UserProfile;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onProfileUpdate: () => Promise<void>;
}

export function EditProfileDialog({ currentUser, isOpen, setIsOpen, onProfileUpdate }: EditProfileDialogProps) {
  const { toast } = useToast();
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(currentUser.photoURL || null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(currentUser.creatorVideoUrl || null);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  
  const [showRecordVideoModal, setShowRecordVideoModal] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const [showDeleteVideoConfirm, setShowDeleteVideoConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      nombre: currentUser.nombre || '',
      apellido: currentUser.apellido || '',
      bio: currentUser.bio || '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        nombre: currentUser.nombre || '',
        apellido: currentUser.apellido || '',
        bio: currentUser.bio || '',
      });
      setImagePreviewUrl(currentUser.photoURL || null);
      setImageFile(null);
      setVideoPreviewUrl(currentUser.creatorVideoUrl || null);
      setVideoFile(null);
    }
  }, [currentUser, isOpen, form]);

  const getInitials = (name?: string | null, surname?: string | null) => {
    if (name && surname) return `${name[0]}${surname[0]}`.toUpperCase();
    if (name) return name.substring(0, 2).toUpperCase();
    return 'MB';
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "Archivo Demasiado Grande", description: "La imagen de perfil no debe exceder los 5MB.", variant: "destructive"});
        event.target.value = ''; return;
      }
      if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.type)) {
          toast({ title: "Tipo de Archivo Inválido", description: "Por favor, sube un archivo de imagen (PNG, JPG, WEBP, GIF).", variant: "destructive"});
          event.target.value = ''; return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setImageFile(null);
      setImagePreviewUrl(currentUser?.photoURL || null);
    }
  };

  const handleVideoFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > MAX_VIDEO_SIZE_MB * 1024 * 1024) {
        toast({ title: "Video Demasiado Grande", description: `El video no debe exceder los ${MAX_VIDEO_SIZE_MB}MB.`, variant: "destructive"});
        event.target.value = ''; return;
      }
      if (!file.type.startsWith('video/')) {
        toast({ title: "Tipo de Archivo Inválido", description: "Por favor, sube un archivo de video.", variant: "destructive"});
        event.target.value = ''; return;
      }
      setVideoFile(file);
      setVideoPreviewUrl(URL.createObjectURL(file));
    } else {
      setVideoFile(null);
      setVideoPreviewUrl(currentUser?.creatorVideoUrl || null);
    }
  };

  async function onSubmitProfile(values: ProfileFormValues) {
    if (!auth.currentUser) {
      toast({ title: "Error de Autenticación", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    let uploadedPhotoURL: string | null = currentUser?.photoURL || null;
    let uploadedVideoURL: string | null = currentUser?.creatorVideoUrl || null;

    try {
      const idToken = await auth.currentUser.getIdToken(true);
      if (imageFile) {
        setIsUploadingImage(true);
        const imageExt = imageFile.name.split('.').pop()?.toLowerCase() || 'png';
        const imagePath = `users/${auth.currentUser.uid}/profile_image/profile.${imageExt}`;
        const imageStorageRef = ref(storage, imagePath);
        await uploadBytes(imageStorageRef, imageFile);
        uploadedPhotoURL = await getDownloadURL(imageStorageRef);
        setIsUploadingImage(false);
        toast({title: "Imagen de Perfil Actualizada"});
      }

      if (videoFile) {
        setIsUploadingVideo(true);
        const videoExt = videoFile.name.split('.').pop()?.toLowerCase() || 'webm';
        const videoPath = `users/${auth.currentUser.uid}/creator_video/presentation.${videoExt}`;
        const videoStorageRef = ref(storage, videoPath);
        await uploadBytes(videoStorageRef, videoFile);
        uploadedVideoURL = await getDownloadURL(videoStorageRef);
        setIsUploadingVideo(false);
        toast({title: "Video de Presentación Actualizado"});
      }

      const updateDto = {
        nombre: values.nombre,
        apellido: values.apellido,
        photoURL: uploadedPhotoURL,
        bio: values.bio || null,
        creatorVideoUrl: uploadedVideoURL,
      };

      const hasTextChanged = values.nombre !== currentUser?.nombre ||
                             values.apellido !== currentUser?.apellido ||
                             (values.bio || null) !== (currentUser?.bio || null);
      const hasPhotoChanged = imageFile || (uploadedPhotoURL !== currentUser?.photoURL);
      const hasVideoChanged = videoFile || (uploadedVideoURL !== currentUser?.creatorVideoUrl);

      if (hasTextChanged || hasPhotoChanged || hasVideoChanged) {
        const response = await fetch('/api/users/update-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
          body: JSON.stringify(updateDto),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.details || errorData.error || "Error al actualizar el perfil.");
        }
        toast({ title: "Perfil Actualizado" });
      } else {
        toast({title: "Sin cambios", description: "No se detectaron cambios para guardar."});
      }

      await onProfileUpdate();
      setIsOpen(false);
      setVideoFile(null);
      setImageFile(null);

    } catch (error: any) {
      toast({ title: "Error de Actualización", description: error.message, variant: "destructive" });
      setIsUploadingImage(false);
      setIsUploadingVideo(false);
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleDeleteVideo = useCallback(async () => {
    if (!currentUser || !auth.currentUser || !currentUser.creatorVideoUrl) {
      toast({ title: "Error", description: "No hay video para eliminar o usuario no autenticado.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
        const idToken = await auth.currentUser.getIdToken(true);
        const videoUrlString = currentUser.creatorVideoUrl;

        try {
            const url = new URL(videoUrlString);
            if (url.hostname === 'firebasestorage.googleapis.com') {
                const pathName = decodeURIComponent(url.pathname);
                const objectPath = pathName.substring(pathName.indexOf('/o/') + 3).split('?')[0];
                if (objectPath) {
                    const videoToDeleteRef = ref(storage, objectPath);
                    await deleteObject(videoToDeleteRef);
                    toast({ title: "Video Eliminado de Storage" });
                }
            }
        } catch (storageError: any) {
            console.warn("Advertencia al eliminar video de Firebase Storage (puede ser normal):", storageError.message);
        }

        const updateDto = { creatorVideoUrl: null };
        const response = await fetch('/api/users/update-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
            body: JSON.stringify(updateDto),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.details || errorData.error || "Error al eliminar el video del perfil.");
        }

        await onProfileUpdate();
        setVideoPreviewUrl(null);
        setVideoFile(null);
        toast({ title: "Video de Presentación Eliminado" });
        setShowDeleteVideoConfirm(false);
    } catch (error: any) {
        toast({ title: "Error al Eliminar Video", description: error.message, variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  }, [currentUser, toast, onProfileUpdate, setIsOpen]); // Removed setIsOpen from deps as it's not used directly in this func

  const startRecording = async () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
        if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
        return;
    }
    try {
      const constraints: MediaStreamConstraints = { video: { facingMode: "user", width: { ideal: 360 }, height: { ideal: 640 }, aspectRatio: (9/16) }, audio: true };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setHasCameraPermission(true);
      if (videoRef.current) videoRef.current.srcObject = stream;
      
      mediaRecorderRef.current = new MediaRecorder(stream);
      setRecordedChunks([]);
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) setRecordedChunks(prev => [...prev, event.data]);
      };
      mediaRecorderRef.current.onstop = () => {
        const videoBlob = new Blob(recordedChunks, { type: 'video/webm' });
        const uniqueFileName = `recorded_presentation_${Date.now()}.webm`;
        const videoFileInstance = new File([videoBlob], uniqueFileName, { type: 'video/webm' });

        if (videoFileInstance.size > MAX_VIDEO_SIZE_MB * 1024 * 1024) {
            toast({ title: "Video Demasiado Grande", description: `El video grabado excede los ${MAX_VIDEO_SIZE_MB}MB. Intenta de nuevo con un video más corto.`, variant: "destructive"});
            setVideoFile(null); setVideoPreviewUrl(null);
        } else {
            setVideoFile(videoFileInstance); setVideoPreviewUrl(URL.createObjectURL(videoFileInstance));
        }
        stream.getTracks().forEach(track => track.stop());
        if (videoRef.current) videoRef.current.srcObject = null;
        setHasCameraPermission(null);
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prevTime => {
          const newTime = prevTime + 1;
          if (newTime >= MAX_VIDEO_DURATION_SECONDS) {
            if (mediaRecorderRef.current?.state === "recording") mediaRecorderRef.current.stop();
            if (recordingIntervalRef.current) { clearInterval(recordingIntervalRef.current); recordingIntervalRef.current = null; }
            setIsRecording(false);
            return MAX_VIDEO_DURATION_SECONDS;
          }
          return newTime;
        });
      }, 1000);
    } catch (error: any) {
      console.error('Error accessing camera:', error);
      setHasCameraPermission(false);
      toast({ variant: 'destructive', title: 'Cámara Denegada', description: 'Habilita permisos de cámara.'});
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") mediaRecorderRef.current.stop();
    if (recordingIntervalRef.current) { clearInterval(recordingIntervalRef.current); recordingIntervalRef.current = null; }
    setIsRecording(false);
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") mediaRecorderRef.current.stop();
    if (recordingIntervalRef.current) { clearInterval(recordingIntervalRef.current); recordingIntervalRef.current = null; }
    setIsRecording(false); setRecordedChunks([]);
    setVideoPreviewUrl(currentUser?.creatorVideoUrl || null); setVideoFile(null);
    setShowRecordVideoModal(false);
    if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
    }
    setHasCameraPermission(null);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) { 
          setImageFile(null);
          setVideoFile(null);
          setImagePreviewUrl(currentUser.photoURL || null);
          setVideoPreviewUrl(currentUser.creatorVideoUrl || null);
        }
      }}>
        <DialogContent className="sm:max-w-[580px] max-h-[90vh] flex flex-col">
          <DialogHeader><DialogTitle>Editar Perfil</DialogTitle></DialogHeader>
          <ScrollArea className="flex-grow pr-3 -mr-3 max-h-[calc(80vh-160px)] overflow-y-auto">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmitProfile)} id="profileEditForm" className="space-y-6 py-4">
                <div className="space-y-4 text-center">
                  <Avatar className="h-32 w-32 mx-auto ring-2 ring-primary ring-offset-2 ring-offset-background">
                    <AvatarImage src={imagePreviewUrl || `https://placehold.co/128x128.png?text=${getInitials(form.getValues('nombre'), form.getValues('apellido'))}`} alt="Vista previa de perfil" data-ai-hint="profile preview"/>
                    <AvatarFallback>{getInitials(form.getValues('nombre'), form.getValues('apellido'))}</AvatarFallback>
                  </Avatar>
                  <div className="relative w-full max-w-xs mx-auto">
                    <Input id="picture" type="file" accept="image/png, image/jpeg, image/webp, image/gif" onChange={handleImageChange} className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10" disabled={isUploadingImage || isSubmitting}/>
                    <Button type="button" variant="outline" className="w-full pointer-events-none relative">
                      {isUploadingImage && <UploadCloud className="mr-2 h-4 w-4 animate-pulse" />}
                      {!isUploadingImage && <Camera className="mr-2 h-4 w-4" />}
                      {isUploadingImage ? 'Subiendo...' : (imageFile ? (imageFile.name.length > 25 ? imageFile.name.substring(0,22) + '...' : imageFile.name) : 'Cambiar foto')}
                    </Button>
                    {isUploadingImage && <Progress value={undefined} className="absolute bottom-0 left-0 right-0 h-1 w-full rounded-b-md" />}
                  </div>
                </div>
                <FormField control={form.control} name="nombre" render={({ field }) => (<FormItem><FormLabel>Nombre</FormLabel><FormControl><Input placeholder="Tu nombre" {...field} disabled={isSubmitting || isUploadingImage} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="apellido" render={({ field }) => (<FormItem><FormLabel>Apellido</FormLabel><FormControl><Input placeholder="Tu apellido" {...field} disabled={isSubmitting || isUploadingImage} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="bio" render={({ field }) => (<FormItem><FormLabel className="flex items-center gap-1.5"><Edit className="h-4 w-4 text-muted-foreground"/> Sobre ti / Biografía (Opcional)</FormLabel><FormControl><Textarea rows={4} placeholder="Cuéntanos un poco sobre ti..." {...field} value={field.value || ''} disabled={isSubmitting || isUploadingImage || isUploadingVideo} /></FormControl><FormDescription className="text-xs">Máximo 500 caracteres.</FormDescription><FormMessage /></FormItem>)} />
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5"><Video className="h-4 w-4 text-muted-foreground"/> Video de Presentación (Opcional)</FormLabel>
                  {videoPreviewUrl && !isRecording && (
                    <div className="my-2">
                        <video src={videoPreviewUrl} controls className="w-full rounded-md max-h-60 aspect-video bg-black" playsInline><track kind="captions"/></video>
                        {currentUser?.creatorVideoUrl && videoPreviewUrl === currentUser.creatorVideoUrl && (
                            <Button type="button" variant="outline" size="sm" className="mt-2 w-full" onClick={() => setShowDeleteVideoConfirm(true)} disabled={isSubmitting || isUploadingVideo}>
                                <Trash2 className="mr-2 h-4 w-4"/>Eliminar Video Actual
                            </Button>
                        )}
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                      <div>
                          <label htmlFor="videoUpload" className="sr-only">Subir video</label>
                          <Input id="videoUpload" type="file" accept="video/*" onChange={handleVideoFileChange} className="text-xs file:text-xs file:font-medium file:text-primary file:bg-primary/10 hover:file:bg-primary/20" disabled={isSubmitting || isUploadingVideo || isRecording}/>
                          <FormDescription className="text-xs mt-1">Sube un video (máx. {MAX_VIDEO_SIZE_MB}MB, {MAX_VIDEO_DURATION_SECONDS}s).</FormDescription>
                      </div>
                      <Button type="button" variant="outline" onClick={() => setShowRecordVideoModal(true)} disabled={isSubmitting || isUploadingVideo || isRecording}>
                          <Camera className="mr-2 h-4 w-4"/> Grabar Video ({MAX_VIDEO_DURATION_SECONDS}s)
                      </Button>
                  </div>
                   {videoFile && <FormDescription className="text-xs mt-1">Nuevo video seleccionado: {videoFile.name}</FormDescription>}
                   {isUploadingVideo && <Progress value={undefined} className="mt-2 h-1 w-full" />}
                </FormItem>
              </form>
            </Form>
          </ScrollArea>
          <DialogFooter className="pt-4 border-t">
              <DialogClose asChild><Button type="button" variant="outline" disabled={isSubmitting || isUploadingImage || isUploadingVideo}>Cancelar</Button></DialogClose>
              <Button type="submit" form="profileEditForm" disabled={isSubmitting || isUploadingImage || isUploadingVideo || isRecording } >
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {isSubmitting ? (isUploadingImage ? 'Subiendo Imagen...' : (isUploadingVideo ? 'Subiendo Video...' : 'Guardando...')) : 'Guardar Cambios'}
              </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRecordVideoModal} onOpenChange={(open) => { if (!open) cancelRecording(); else setShowRecordVideoModal(true); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Grabar Video de Presentación</DialogTitle><DialogDescription>Graba un video corto (máx. {MAX_VIDEO_DURATION_SECONDS} segundos). Intenta mantener una orientación vertical.</DialogDescription></DialogHeader>
          <div className="py-4 space-y-4">
            <div className="relative aspect-[9/16] w-full max-w-xs mx-auto bg-muted rounded-md overflow-hidden border">
                <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                {isRecording && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">REC</div>
                )}
                {hasCameraPermission === false && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-white p-4 text-center">
                        <AlertCircle className="h-8 w-8 mb-2"/>
                        <p className="text-sm">Permiso de cámara denegado.</p>
                        <p className="text-xs mt-1">Revisa la configuración de tu navegador.</p>
                    </div>
                )}
            </div>
            {isRecording && (
              <div className="text-center text-sm">
                Tiempo restante: {Math.max(0, MAX_VIDEO_DURATION_SECONDS - recordingTime)}s
                <Progress value={(recordingTime / MAX_VIDEO_DURATION_SECONDS) * 100} className="h-1.5 mt-1" />
              </div>
            )}
          </div>
          <DialogFooter className="gap-2 sm:justify-between">
            <Button variant="outline" onClick={cancelRecording} disabled={isSubmitting}>Cancelar</Button>
            <div className="flex gap-2">
                {isRecording ? (
                    <Button onClick={stopRecording} variant="destructive" disabled={isSubmitting}><Square className="mr-2 h-4 w-4"/>Detener</Button>
                ) : (
                    <Button onClick={startRecording} disabled={isSubmitting || hasCameraPermission === false}><Play className="mr-2 h-4 w-4"/>Grabar</Button>
                )}
                <Button
                    onClick={() => {
                        if (recordedChunks.length > 0 && videoFile) {
                             setShowRecordVideoModal(false);
                        } else if (!videoFile && recordedChunks.length === 0 && !isRecording) {
                           toast({title: "Nada que guardar", description:"Graba un video primero.", variant:"default"});
                        } else if (isRecording) {
                           toast({title: "Grabación en curso", description:"Detén la grabación antes de guardar.", variant:"default"});
                        }
                    }}
                    disabled={isSubmitting || isRecording || recordedChunks.length === 0}
                >
                    Usar Video Grabado
                </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteVideoConfirm} onOpenChange={setShowDeleteVideoConfirm}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar Video de Presentación?</AlertDialogTitle>
                  <ShadCNAlertDialogDescription>
                      Esta acción eliminará tu video de presentación actual. ¿Estás seguro?
                  </ShadCNAlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setShowDeleteVideoConfirm(false)} disabled={isSubmitting}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteVideo} disabled={isSubmitting} className="bg-destructive hover:bg-destructive/90">
                      {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Trash2 className="mr-2 h-4 w-4"/>}
                      Eliminar Video
                  </AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

