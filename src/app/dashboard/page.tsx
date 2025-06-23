
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Activity, ArrowRight, BookOpen, BarChartBig, Users, Settings, Gift, DollarSign, Award, Loader2, AlertTriangle, RefreshCw } from "lucide-react"; 
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import type { CourseProperties } from '@/features/course/domain/entities/course.entity';
import { auth } from '@/lib/firebase/config'; // Import auth for token

interface CreatorCourseSummary extends Pick<CourseProperties, 'id' | 'nombre' | 'estado' | 'totalEstudiantes'> {}

interface DashboardStats {
  card1Value: number | string | React.ReactNode;
  card1Title: string;
  card1Icon: React.ElementType;
  card1Description: string;

  card2Value: number | string | React.ReactNode;
  card2Title: string;
  card2Icon: React.ElementType;
  card2Description: string;

  card3Value: number | string | React.ReactNode;
  card3Title: string;
  card3Icon: React.ElementType;
  card3Description: string;
  card3IsLink?: boolean;
  card3Href?: string;
}

export default function DashboardPage() {
  const { currentUser, userRole, loading: authLoading, refreshUserProfile } = useAuth();
  
  const [creatorCourses, setCreatorCourses] = useState<CreatorCourseSummary[]>([]);
  const [recentUsersCount, setRecentUsersCount] = useState(0);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchCreatorCourses = useCallback(async () => {
    if (userRole !== 'creator' || !auth.currentUser) return;
    console.log("[DashboardPage] Fetching creator courses...");
    setIsLoadingStats(true);
    setStatsError(null);
    try {
      const idToken = await auth.currentUser.getIdToken(true);
      const response = await fetch('/api/creator/courses', {
        headers: { 'Authorization': `Bearer ${idToken}` },
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.details || errData.error || 'Error al cargar cursos del creador');
      }
      const data = await response.json();
      setCreatorCourses(data.courses || []);
      console.log("[DashboardPage] Creator courses fetched:", data.courses?.length || 0);
    } catch (error: any) {
      setStatsError(error.message);
      console.error("[DashboardPage] Error fetching creator courses:", error.message);
    } finally {
      setIsLoadingStats(false);
    }
  }, [userRole]);

  const fetchRecentUsersCount = useCallback(async () => {
    if (userRole !== 'superadmin' || !auth.currentUser) return;
    console.log("[DashboardPage] Fetching recent users count...");
    setIsLoadingStats(true);
    setStatsError(null);
    try {
      const idToken = await auth.currentUser.getIdToken(true);
      const response = await fetch('/api/superadmin/users', { // API might need adjustment for just a count
        headers: { 'Authorization': `Bearer ${idToken}` },
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.details || errData.error ||'Error al cargar total de usuarios');
      }
      const data = await response.json();
      setRecentUsersCount(data.users?.length || 0); // Using length of fetched users
      console.log("[DashboardPage] Recent users count fetched:", data.users?.length || 0);
    } catch (error: any) {
      setStatsError(error.message);
      console.error("[DashboardPage] Error fetching recent users count:", error.message);
    } finally {
      setIsLoadingStats(false);
    }
  }, [userRole]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshUserProfile(); // This updates currentUser
    // Data fetching useEffect will re-run due to currentUser dependency change
    setIsRefreshing(false);
  };
  
  useEffect(() => {
    if (!authLoading && currentUser) {
      if (userRole === 'creator') {
        fetchCreatorCourses();
      } else if (userRole === 'superadmin') {
        fetchRecentUsersCount();
      } else { // student or other roles that don't need extra data for these stats
        setIsLoadingStats(false);
      }
    } else if (!authLoading && !currentUser) {
        setIsLoadingStats(false); // No user, so no stats to load
    }
  }, [currentUser, userRole, authLoading, fetchCreatorCourses, fetchRecentUsersCount]);


  const roleSpecificLinks = {
    student: [
      { title: "Mis Cursos", description: "Accede a tus cursos inscritos y continúa tu aprendizaje.", href: "/dashboard/student", icon: BookOpen },
      { title: "Mi Perfil y Referidos", description: "Actualiza tu información y gestiona tus referidos.", href: "/dashboard/student", icon: Users },
    ],
    creator: [
      { title: "Gestionar Cursos", description: "Crea, edita y publica tus cursos.", href: "/dashboard/creator/courses", icon: BookOpen },
      { title: "Estadísticas de Creator", description: "Analiza el rendimiento de tus cursos e ingresos.", href: "/dashboard/creator", icon: BarChartBig },
    ],
    superadmin: [
      { title: "Gestión de Usuarios", description: "Administra todos los usuarios de la plataforma.", href: "/dashboard/superadmin", icon: Users },
      { title: "Configuración Global", description: "Ajusta los parámetros generales de Consciousness Class.", href: "/dashboard/superadmin/settings", icon: Settings },
    ],
  };

  const getDashboardStats = (): DashboardStats => {
    if (!currentUser || !userRole) {
      return {
        card1Value: <Loader2 className="h-5 w-5 animate-spin" />, card1Title: 'Cargando...', card1Icon: Activity, card1Description: 'Obteniendo datos...',
        card2Value: <Loader2 className="h-5 w-5 animate-spin" />, card2Title: 'Cargando...', card2Icon: Activity, card2Description: 'Obteniendo datos...',
        card3Value: <Loader2 className="h-5 w-5 animate-spin" />, card3Title: 'Cargando...', card3Icon: Activity, card3Description: 'Obteniendo datos...',
      };
    }

    switch (userRole) {
      case 'student':
        return {
          card1Value: currentUser.cursosInscritos?.length || 0,
          card1Title: "Cursos Inscritos",
          card1Icon: BookOpen,
          card1Description: "Cursos en los que estás participando.",
          card2Value: currentUser.referidosExitosos || 0,
          card2Title: "Referidos Exitosos",
          card2Icon: Gift,
          card2Description: "Personas que se unieron gracias a ti.",
          card3Value: `${(currentUser.balanceComisionesPendientes || 0).toFixed(2)} €`,
          card3Title: "Comisiones Pendientes",
          card3Icon: DollarSign,
          card3Description: "Recompensas por tus referidos.",
        };
      case 'creator':
        const publishedCourses = creatorCourses.filter(c => c.estado === 'publicado').length;
        const totalCreatorStudents = creatorCourses.reduce((sum, course) => sum + (course.totalEstudiantes || 0), 0);
        return {
          card1Value: isLoadingStats ? <Loader2 className="h-5 w-5 animate-spin" /> : publishedCourses,
          card1Title: "Cursos Publicados",
          card1Icon: BookOpen,
          card1Description: "Tus cursos activos en la plataforma.",
          card2Value: isLoadingStats ? <Loader2 className="h-5 w-5 animate-spin" /> : totalCreatorStudents,
          card2Title: "Estudiantes Totales",
          card2Icon: Users,
          card2Description: "En todos tus cursos.",
          card3Value: `${(currentUser.balanceIngresosPendientes || 0).toFixed(2)} €`,
          card3Title: "Ingresos Pendientes",
          card3Icon: DollarSign,
          card3Description: "Ganancias de tus cursos por liquidar.",
        };
      case 'superadmin':
        return {
          card1Value: isLoadingStats ? <Loader2 className="h-5 w-5 animate-spin" /> : recentUsersCount,
          card1Title: "Usuarios Recientes",
          card1Icon: Users,
          card1Description: `Mostrando ${recentUsersCount} usuarios. Total podría ser mayor.`,
          card2Value: 150, // Placeholder - This would need a separate API call
          card2Title: "Cursos en Plataforma (Ej.)",
          card2Icon: BookOpen,
          card2Description: "Total de cursos (Ejemplo).",
          card3Title: "Configuración",
          card3Value: "Ir",
          card3Icon: Settings,
          card3Description: "Accede a la configuración global.",
          card3IsLink: true,
          card3Href: "/dashboard/superadmin/settings" 
        };
      default:
        return {
          card1Value: 'N/A', card1Title: 'Rol Desconocido', card1Icon: Activity, card1Description: '',
          card2Value: 'N/A', card2Title: 'Rol Desconocido', card2Icon: Activity, card2Description: '',
          card3Value: 'N/A', card3Title: 'Rol Desconocido', card3Icon: Activity, card3Description: '',
        };
    }
  };
  
  if (authLoading && !currentUser) { // Show skeletons only if auth is loading AND there's no user yet
    return (
      <div className="space-y-8">
        <Card className="shadow-lg">
          <CardHeader><Skeleton className="h-8 w-1/2 mb-2" /><Skeleton className="h-4 w-3/4" /></CardHeader>
          <CardContent><Skeleton className="h-6 w-full" /></CardContent>
        </Card>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="shadow-md">
              <CardHeader className="pb-2"><Skeleton className="h-5 w-3/5" /><Skeleton className="h-4 w-4 ml-auto" /></CardHeader>
              <CardContent><Skeleton className="h-8 w-1/2" /><Skeleton className="h-3 w-4/5 mt-1" /></CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-8">
          <Skeleton className="h-7 w-1/4 mb-4" />
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser || !userRole) {
     return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <Activity className="h-12 w-12 text-muted-foreground mb-4"/>
            <p className="text-lg text-muted-foreground">
                {authLoading ? "Cargando datos de usuario..." : "No se pudo determinar el rol del usuario o no has iniciado sesión."}
            </p>
            {!authLoading && !currentUser && (
                <Button asChild className="mt-4">
                    <Link href="/login">Iniciar Sesión</Link>
                </Button>
            )}
        </div>
     );
  }
  
  const stats = getDashboardStats();
  const links = roleSpecificLinks[userRole] || [];

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <CardTitle className="text-3xl font-headline">Bienvenido, {currentUser?.displayName || currentUser?.email}</CardTitle>
            <Button onClick={handleRefresh} variant="outline" size="sm" disabled={isRefreshing || isLoadingStats}>
              {isRefreshing ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <RefreshCw className="mr-2 h-3 w-3" />}
              Actualizar Datos
            </Button>
          </div>
          <CardDescription>Aquí puedes gestionar tu actividad en Consciousness Class.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Desde esta página central, puedes navegar a las diferentes secciones de tu panel de control.
            Utiliza el menú lateral para acceder a todas las funcionalidades disponibles para tu rol ({userRole}).
          </p>
        </CardContent>
      </Card>

      {statsError && (
        <Card className="shadow-md bg-destructive/10 border-destructive text-destructive-foreground">
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
                <AlertTriangle className="h-5 w-5" />
                <CardTitle className="text-sm font-medium">Error al cargar estadísticas</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-xs">{statsError}</p>
            </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stats.card1Title}</CardTitle>
            <stats.card1Icon className={`h-5 w-5 text-muted-foreground ${stats.card1Value === '...' && isLoadingStats ? 'animate-spin' : ''}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoadingStats && typeof stats.card1Value !== 'number' && stats.card1Value !== 'Ir' ? <Skeleton className="h-7 w-16"/> : stats.card1Value}</div> 
            <p className="text-xs text-muted-foreground">{stats.card1Description}</p>
          </CardContent>
        </Card>

        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stats.card2Title}</CardTitle>
            <stats.card2Icon className={`h-5 w-5 text-muted-foreground ${stats.card2Value === '...' && isLoadingStats ? 'animate-spin' : ''}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoadingStats && typeof stats.card2Value !== 'number' ? <Skeleton className="h-7 w-12"/> : stats.card2Value}</div> 
            <p className="text-xs text-muted-foreground">{stats.card2Description}</p>
          </CardContent>
        </Card>

        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stats.card3Title}</CardTitle>
            <stats.card3Icon className={`h-5 w-5 text-muted-foreground ${stats.card3Value === '...' && isLoadingStats ? 'animate-spin' : ''}`} />
          </CardHeader>
          <CardContent>
            {stats.card3IsLink && stats.card3Href ? (
                <Button variant="outline" size="sm" asChild>
                    <Link href={stats.card3Href}>{stats.card3Value} <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
            ) : (
                <div className="text-2xl font-bold">{isLoadingStats && typeof stats.card3Value !== 'string' ? <Skeleton className="h-7 w-20"/> : stats.card3Value}</div>
            )}
            <p className="text-xs text-muted-foreground">{stats.card3Description}</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-8">
        <h2 className="text-2xl font-headline font-semibold mb-4">Accesos Rápidos</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {links.map(link => (
            <Card key={link.title} className="shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <link.icon className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="font-headline">{link.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{link.description}</p>
                <Button variant="outline" asChild size="sm">
                  <Link href={link.href}>Ir a {link.title} <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

    