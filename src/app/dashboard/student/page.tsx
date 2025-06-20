
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import Image from 'next/image';
import {
    BookOpen, UserCircle, Gift, Edit, Award, Rocket, Loader2, AlertTriangle, Info,
    Link as LinkIcon, Share2, DollarSign, RefreshCw, ListChecks, CalendarDays, Users, Film
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { auth } from '@/lib/firebase/config';
import type { CourseProperties } from '@/features/course/domain/entities/course.entity';
import type { UserCourseProgressProperties } from '@/features/progress/domain/entities/user-course-progress.entity';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertTitle, AlertDescription as ShadCNAlertDescription } from '@/components/ui/alert'; // Added AlertDescription import
import { EditProfileDialog } from '@/components/dashboard/student/EditProfileDialog';

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

interface CommissionData {
  id: string;
  fechaCreacion: string;
  nombreCursoComprado?: string;
  courseIdComprado: string;
  montoComisionCalculado: number;
  estadoPagoComision: 'pendiente' | 'pagada' | 'cancelada';
}

export default function StudentDashboardPage() {
  const { currentUser, userRole, loading: authLoading, refreshUserProfile } = useAuth();
  const { toast } = useToast();

  const [enrolledCoursesApiData, setEnrolledCoursesApiData] = useState<EnrolledCourseApiData[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [coursesError, setCoursesError] = useState<string | null>(null);

  const [promotableCourses, setPromotableCourses] = useState<PromotableCourseData[]>([]);
  const [isLoadingPromotableCourses, setIsLoadingPromotableCourses] = useState(true);
  const [promotableCoursesError, setPromotableCoursesError] = useState<string | null>(null);

  const [detailedCommissions, setDetailedCommissions] = useState<CommissionData[]>([]);
  const [isLoadingCommissions, setIsLoadingCommissions] = useState(true);
  const [commissionsError, setCommissionsError] = useState<string | null>(null);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isRequestingCreatorRole, setIsRequestingCreatorRole] = useState(false);
  const [showBecomeCreatorDialog, setShowBecomeCreatorDialog] = useState(false);
  const [baseUrl, setBaseUrl] = useState('');
  const [isRefreshingStats, setIsRefreshingStats] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setBaseUrl(window.location.origin);
    }
  }, []);

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
    } finally {
      setIsLoadingCourses(false);
    }
  }, [currentUser]);

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
    } finally {
      setIsLoadingPromotableCourses(false);
    }
  }, []);

  const fetchDetailedCommissions = useCallback(async () => {
    if (!currentUser || !auth.currentUser) {
      setIsLoadingCommissions(false);
      return;
    }
    setIsLoadingCommissions(true);
    setCommissionsError(null);
    try {
      const idToken = await auth.currentUser.getIdToken(true);
      const response = await fetch('/api/student/my-commissions', {
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Error al cargar el detalle de comisiones.');
      }
      const data = await response.json();
      setDetailedCommissions(data.commissions || []);
    } catch (err: any) {
      setCommissionsError(err.message);
    } finally {
      setIsLoadingCommissions(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (!authLoading && currentUser?.uid) {
      fetchEnrolledCourses();
      fetchPromotableCourses();
      fetchDetailedCommissions();
    } else if (!authLoading && !currentUser) {
      setEnrolledCoursesApiData([]);
      setIsLoadingCourses(false);
      setPromotableCourses([]);
      setIsLoadingPromotableCourses(false);
      setDetailedCommissions([]);
      setIsLoadingCommissions(false);
    }
  }, [authLoading, currentUser?.uid, fetchEnrolledCourses, fetchPromotableCourses, fetchDetailedCommissions]);

  const handleCopyReferralLink = (courseId?: string) => {
    if (currentUser?.referralCodeGenerated && baseUrl) {
        let path = `/courses/${courseId}`;
        const link = `${baseUrl}${path}?ref=${currentUser.referralCodeGenerated}`;
        navigator.clipboard.writeText(link)
        .then(() => toast({ title: "Enlace de Promoción Copiado" }))
        .catch(() => toast({ title: "Error al Copiar Enlace", variant: "destructive"}));
    } else {
        toast({ title: "Error", description: "No se pudo generar el enlace de promoción.", variant: "destructive"});
    }
  };

  async function handleRequestCreatorRole() {
    if (!auth.currentUser) return;
    setIsRequestingCreatorRole(true);
    setShowBecomeCreatorDialog(false);
    try {
      const idToken = await auth.currentUser.getIdToken(true);
      const response = await fetch('/api/users/request-creator-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
      });
      if (!response.ok) throw new Error((await response.json()).details || "Error al solicitar rol.");
      await refreshUserProfile();
      toast({ title: "¡Rol Actualizado!", description: "Ahora eres un Creator." });
    } catch (error: any) {
      toast({ title: "Error al Cambiar Rol", description: error.message, variant: "destructive" });
    } finally {
      setIsRequestingCreatorRole(false);
    }
  }

  async function handleRefreshStats() {
    setIsRefreshingStats(true);
    toast({ title: "Actualizando Datos..."});
    try {
      await refreshUserProfile();
      await fetchDetailedCommissions();
      toast({ title: "Datos Actualizados" });
    } catch (error) {
      toast({ title: "Error al Actualizar", variant: "destructive" });
    } finally {
      setIsRefreshingStats(false);
    }
  }

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
          <CardContent><Skeleton className="h-40 w-full" /></CardContent>
        </Card>
        <Card className="shadow-lg"><CardHeader><Skeleton className="h-8 w-1/3 mb-2" /><Skeleton className="h-4 w-1/2" /></CardHeader><CardContent><Skeleton className="h-60 w-full" /></CardContent></Card>
        <Card className="shadow-lg"><CardHeader><Skeleton className="h-8 w-1/3 mb-2" /><Skeleton className="h-4 w-1/2" /></CardHeader><CardContent><Skeleton className="h-20 w-full" /></CardContent></Card>
      </div>
    );
  }

  if (!currentUser) {
    return <p className="text-center text-lg">Por favor, <Link href="/login" className="text-primary hover:underline">inicia sesión</Link> para ver tu panel.</p>;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold font-headline">Panel de Estudiante</h1>
      
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-2"><BookOpen className="h-6 w-6 text-primary" />
            <CardTitle className="text-2xl font-headline">Mis Cursos</CardTitle>
          </div>
          <CardDescription>Continúa tu aprendizaje.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingCourses ? (
             <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{[...Array(3)].map((_, i) => (<Skeleton key={i} className="h-64 w-full" />))}</div>
          ) : coursesError ? (
             <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><ShadCNAlertDescription>{coursesError}</ShadCNAlertDescription></Alert>
          ) : enrolledCoursesApiData.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {enrolledCoursesApiData.map(course => (
                <Card key={course.id} className="overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                  <Link href={`/courses/${course.id}`} className="block relative aspect-[16/10] w-full"><Image src={course.imagenPortadaUrl || 'https://placehold.co/300x180.png'} alt={course.nombre} fill className="object-cover" data-ai-hint={course.dataAiHintImagenPortada || 'course student dashboard'} sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"/></Link>
                  <CardContent className="p-4 flex-grow"><h3 className="font-semibold mb-1 truncate text-md leading-tight">{course.nombre}</h3>{course.progress !== undefined && (<><Progress value={course.progress.porcentajeCompletado} className="mb-1 h-1.5" /><p className="text-xs text-muted-foreground mb-3">{course.progress.porcentajeCompletado}% completado</p></>)}{course.progress === undefined && (<p className="text-xs text-muted-foreground mb-3">Progreso no disponible</p>)}</CardContent>
                  <CardFooter className="p-4 border-t"><Button variant="default" size="sm" asChild className="w-full"><Link href={`/learn/${course.id}/${course.modules && course.modules.length > 0 && course.modules[0].lessons && course.modules[0].lessons.length > 0 ? course.modules[0].lessons[0].id : 'start'}`}>Ir al Curso</Link></Button></CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground py-4 text-center">Aún no te has inscrito a ningún curso. <Link href="/courses" className="text-primary hover:underline">Explora cursos</Link>.</p>
          )}
        </CardContent>
      </Card>

      
      <Card className="shadow-lg">
        <CardHeader>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Gift className="h-6 w-6 text-primary" />
                    <CardTitle className="text-2xl font-headline">Mis Referidos y Comisiones</CardTitle>
                </div>
                <Button variant="outline" size="sm" onClick={handleRefreshStats} disabled={isRefreshingStats}>
                    {isRefreshingStats ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <RefreshCw className="mr-2 h-3 w-3" />}
                    Refrescar Datos
                </Button>
            </div>
            <CardDescription>Consulta tus estadísticas de referidos y el detalle de comisiones generadas.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div><p className="text-sm font-medium text-muted-foreground">Referidos Exitosos:</p><p className="text-2xl font-semibold flex items-center">{currentUser?.referidosExitosos || 0} <Users className="h-5 w-5 ml-2 text-muted-foreground"/></p></div>
                <div><p className="text-sm font-medium text-muted-foreground">Comisiones Pendientes:</p><p className="text-2xl font-semibold flex items-center">{(currentUser?.balanceComisionesPendientes || 0).toFixed(2)} € <DollarSign className="h-5 w-5 ml-1 text-muted-foreground"/></p></div>
            </div>
            <div className="border-t pt-4">
                <h4 className="text-lg font-semibold mb-2">Detalle de Comisiones Generadas</h4>
                {isLoadingCommissions ? (<div className="flex items-center justify-center py-6"><Loader2 className="mr-2 h-6 w-6 animate-spin" /> Cargando comisiones...</div>)
                : commissionsError ? (<Alert variant="destructive" className="text-sm"><AlertTriangle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><ShadCNAlertDescription>{commissionsError}</ShadCNAlertDescription></Alert>)
                : detailedCommissions.length > 0 ? (
                    <ScrollArea className="max-h-80"><Table><TableHeader><TableRow><TableHead>Fecha</TableHead><TableHead>Curso</TableHead><TableHead className="text-right">Monto</TableHead><TableHead className="text-center">Estado</TableHead></TableRow></TableHeader>
                        <TableBody>{detailedCommissions.map((commission) => (<TableRow key={commission.id}><TableCell><div className="flex items-center gap-2 text-xs sm:text-sm"><CalendarDays className="h-4 w-4 text-muted-foreground"/>{format(new Date(commission.fechaCreacion), 'dd MMM yyyy, HH:mm', { locale: es })}</div></TableCell><TableCell className="font-medium truncate max-w-[100px] sm:max-w-xs" title={commission.nombreCursoComprado || commission.courseIdComprado}>{commission.nombreCursoComprado || commission.courseIdComprado}</TableCell><TableCell className="text-right">{commission.montoComisionCalculado.toFixed(2)} €</TableCell><TableCell className="text-center"><Badge variant={commission.estadoPagoComision === 'pagada' ? 'default' : (commission.estadoPagoComision === 'pendiente' ? 'secondary' : 'destructive')} className={commission.estadoPagoComision === 'pagada' ? 'bg-green-100 text-green-700' : (commission.estadoPagoComision === 'pendiente' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700')}>{commission.estadoPagoComision.charAt(0).toUpperCase() + commission.estadoPagoComision.slice(1)}</Badge></TableCell></TableRow>))}</TableBody>
                    </Table></ScrollArea>
                ) : (<p className="text-muted-foreground py-4 text-center text-sm">Aún no has generado ninguna comisión.</p>)}
            </div>
            <Alert className="text-xs"><Info className="h-4 w-4"/><AlertTitle className="font-medium">Información Importante</AlertTitle><ShadCNAlertDescription>El seguimiento detallado de comisiones y su pago se habilitará próximamente. Por ahora, puedes ver tus referidos exitosos y el balance de comisiones pendientes.</ShadCNAlertDescription></Alert>
        </CardContent>
      </Card>

      
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-2"><Share2 className="h-6 w-6 text-primary" /><CardTitle className="text-2xl font-headline">Promociona Cursos y Gana</CardTitle>
          </div><CardDescription>Copia enlaces de promoción para cursos específicos que ofrecen comisión.</CardDescription>
        </CardHeader>
        <CardContent>
            {isLoadingPromotableCourses ? (<div className="grid gap-4 md:grid-cols-2">{[...Array(2)].map((_, i) => (<Card key={i} className="p-4 space-y-3"><div className="flex gap-3 items-start"><Skeleton className="h-16 w-24 rounded-md" /><div className="flex-1 space-y-1.5"><Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-1/2" /><Skeleton className="h-4 w-1/4" /></div></div><Skeleton className="h-9 w-full" /></Card>))}</div>)
            : promotableCoursesError ? (<Alert variant="destructive" className="text-sm"><AlertTriangle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><ShadCNAlertDescription>{promotableCoursesError}</ShadCNAlertDescription></Alert>)
            : promotableCourses.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                    {promotableCourses.map(course => (
                        <Card key={course.id} className="p-4"><div className="flex gap-4 items-start mb-3"><Image src={course.imagenPortadaUrl || 'https://placehold.co/100x60.png'} alt={course.nombre} width={100} height={60} className="rounded-md object-cover aspect-[16/10]" data-ai-hint={course.dataAiHintImagenPortada || 'course promo image'} /><div className="flex-1"><h4 className="font-semibold text-sm leading-tight mb-0.5">{course.nombre}</h4><p className="text-xs text-muted-foreground">{course.categoria}</p><p className="text-xs font-medium text-primary mt-1">Comisión: {course.comisionReferidoPorcentaje}%</p></div></div><Button variant="outline" size="sm" className="w-full" onClick={() => handleCopyReferralLink(course.id)} disabled={!currentUser.referralCodeGenerated || !baseUrl || !navigator.clipboard}><LinkIcon className="mr-2 h-4 w-4" /> Copiar Enlace de Promoción</Button></Card>
                    ))}
                </div>
            ) : (<p className="text-muted-foreground py-4 text-center text-sm">Actualmente no hay cursos con comisión de referido para promocionar.</p>)}
        </CardContent>
      </Card>

      
      <Card className="shadow-lg">
        <CardHeader><div className="flex items-center gap-2"><UserCircle className="h-6 w-6 text-primary" /><CardTitle className="text-2xl font-headline">Mi Perfil</CardTitle></div><CardDescription>Gestiona tu información personal y configuración de cuenta.</CardDescription></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20"><AvatarImage src={currentUser.photoURL || `https://placehold.co/80x80.png?text=${getInitials(currentUser.nombre, currentUser.apellido)}`} alt="Foto de perfil" data-ai-hint="user avatar"/><AvatarFallback>{getInitials(currentUser.nombre, currentUser.apellido)}</AvatarFallback></Avatar><div><p className="text-lg font-semibold">{currentUser.nombre && currentUser.apellido ? `${currentUser.nombre} ${currentUser.apellido}` : (currentUser.displayName || 'Nombre no especificado')}</p><p className="text-sm text-muted-foreground">{currentUser.email || 'Email no especificado'}</p></div></div>
          {currentUser.bio && (<div className="pt-2"><h4 className="text-sm font-medium text-muted-foreground mb-1">Sobre mí:</h4><p className="text-sm text-foreground/80 whitespace-pre-wrap">{currentUser.bio}</p></div>)}
          {currentUser.creatorVideoUrl && (<div className="pt-2"><h4 className="text-sm font-medium text-muted-foreground mb-1">Video de Presentación:</h4><Link href={currentUser.creatorVideoUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1"><Film className="h-4 w-4"/> Ver Video</Link></div>)}
          <div className="flex flex-wrap gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setIsEditDialogOpen(true)}><Edit className="mr-2 h-4 w-4" /> Editar Perfil</Button>
              {userRole === 'student' && (<AlertDialog open={showBecomeCreatorDialog} onOpenChange={setShowBecomeCreatorDialog}><AlertDialogTrigger asChild><Button variant="default" size="sm" disabled={isRequestingCreatorRole}><Rocket className="mr-2 h-4 w-4" /> Convertirme en Creator</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>¿Quieres convertirte en Creator?</AlertDialogTitle><ShadCNAlertDescription>Como Creator, podrás crear y vender tus propios cursos. Esta acción cambiará tu rol de Student a Creator.</ShadCNAlertDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={isRequestingCreatorRole}>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleRequestCreatorRole} disabled={isRequestingCreatorRole}>{isRequestingCreatorRole ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}{isRequestingCreatorRole ? 'Procesando...' : 'Sí, Convertirme en Creator'}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>)}
          </div>
        </CardContent>
      </Card>
      
      <Card className="shadow-lg">
        <CardHeader><div className="flex items-center gap-2"><Award className="h-6 w-6 text-primary" /><CardTitle className="text-2xl font-headline">Mis Certificados</CardTitle></div><CardDescription>Visualiza y descarga los certificados de los cursos completados.</CardDescription></CardHeader>
        <CardContent><div className="text-center py-6 text-muted-foreground"><Award className="mx-auto h-10 w-10 mb-3 opacity-50" /><p className="font-medium">Funcionalidad de Certificados Próximamente</p><p className="text-sm">Cuando completes tus cursos, tus certificados aparecerán aquí.</p></div></CardContent>
      </Card>

      {currentUser && (
        <EditProfileDialog
          currentUser={currentUser}
          isOpen={isEditDialogOpen}
          setIsOpen={setIsEditDialogOpen}
          onProfileUpdate={refreshUserProfile}
        />
      )}
    </div>
  );
}
    
