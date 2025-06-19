
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Activity, ArrowRight, BookOpen, BarChartBig, Users, Settings, Gift, DollarSign, Award, Loader2, AlertTriangle } from "lucide-react"; 
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import type { CourseProperties } from '@/features/course/domain/entities/course.entity';
import type { UserProperties } from '@/features/user/domain/entities/user.entity';
import { auth } from '@/lib/firebase/config';

interface CreatorCourseSummary extends Pick<CourseProperties, 'id' | 'nombre' | 'estado' | 'totalEstudiantes'> {}

interface DashboardStats {
  card1Value: number | string;
  card1Title: string;
  card1Icon: React.ElementType;
  card1Description: string;

  card2Value: number | string;
  card2Title: string;
  card2Icon: React.ElementType;
  card2Description: string;

  card3Value: number | string;
  card3Title: string;
  card3Icon: React.ElementType;
  card3Description: string;
  card3IsLink?: boolean;
  card3Href?: string;
}

export default function DashboardPage() {
  const { currentUser, userRole, loading: authLoading } = useAuth();
  
  const [creatorCourses, setCreatorCourses] = useState<CreatorCourseSummary[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  const fetchCreatorCourses = useCallback(async () => {
    if (userRole !== 'creator' || !auth.currentUser) return;
    setIsLoadingStats(true);
    try {
      const idToken = await auth.currentUser.getIdToken(true);
      const response = await fetch('/api/creator/courses', {
        headers: { 'Authorization': `Bearer ${idToken}` },
      });
      if (!response.ok) throw new Error('Error al cargar cursos del creador');
      const data = await response.json();
      setCreatorCourses(data.courses || []);
    } catch (error: any) {
      setStatsError(error.message);
    } finally {
      setIsLoadingStats(false);
    }
  }, [userRole]);

  const fetchTotalUsers = useCallback(async () => {
    if (userRole !== 'superadmin' || !auth.currentUser) return;
    setIsLoadingStats(true);
    try {
      const idToken = await auth.currentUser.getIdToken(true);
      const response = await fetch('/api/superadmin/users', { // This API might need adjustment for just a count
        headers: { 'Authorization': `Bearer ${idToken}` },
      });
      if (!response.ok) throw new Error('Error al cargar total de usuarios');
      const data = await response.json();
      setTotalUsers(data.users?.length || 0); // Or a dedicated count if API provides it
    } catch (error: any) {
      setStatsError(error.message);
    } finally {
      setIsLoadingStats(false);
    }
  }, [userRole]);

  useEffect(() => {
    if (!authLoading && currentUser) {
      if (userRole === 'creator') {
        fetchCreatorCourses();
      } else if (userRole === 'superadmin') {
        fetchTotalUsers();
      } else {
        setIsLoadingStats(false); // For student, no extra data needed for stats
      }
    }
  }, [currentUser, userRole, authLoading, fetchCreatorCourses, fetchTotalUsers]);

  const roleSpecificLinks = {
    student: [
      { title: "Mis Cursos", description: "Accede a tus cursos inscritos y continúa tu aprendizaje.", href: "/dashboard/student", icon: BookOpen },
      { title: "Mi Perfil y Referidos", description: "Actualiza tu información y gestiona tus referidos.", href: "/dashboard/student", icon: Users },
    ],
    creator: [
      { title: "Gestionar Cursos", description: "Crea, edita y publica tus cursos.", href: "/dashboard/creator/courses", icon: BookOpen },
      { title: "Estadísticas de Creator", description: "Analiza el rendimiento de tus cursos e ingresos.", href: "/dashboard/creator", icon: BarChartBig }, // Link to main creator dashboard
    ],
    superadmin: [
      { title: "Gestión de Usuarios", description: "Administra todos los usuarios de la plataforma.", href: "/dashboard/superadmin", icon: Users }, // Link to main superadmin dashboard
      { title: "Configuración Global", description: "Ajusta los parámetros generales de Consciousness Class.", href: "/dashboard/superadmin", icon: Settings },
    ],
  };

  const getDashboardStats = (): DashboardStats => {
    if (!currentUser || !userRole) {
      // Default/Loading stats
      return {
        card1Value: '...', card1Title: 'Cargando...', card1Icon: Loader2, card1Description: '',
        card2Value: '...', card2Title: 'Cargando...', card2Icon: Loader2, card2Description: '',
        card3Value: '...', card3Title: 'Cargando...', card3Icon: Loader2, card3Description: '',
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
          card1Value: isLoadingStats ? <Loader2 className="h-5 w-5 animate-spin" /> : totalUsers,
          card1Title: "Usuarios Totales",
          card1Icon: Users,
          card1Description: "Usuarios registrados en la plataforma.",
          card2Value: 150, // Placeholder
          card2Title: "Cursos en Plataforma",
          card2Icon: BookOpen,
          card2Description: "Total de cursos (Ejemplo).",
          card3Title: "Gestionar Plataforma",
          card3Value: "Ir",
          card3Icon: Settings,
          card3Description: "Accede a la configuración global.",
          card3IsLink: true,
          card3Href: "/dashboard/superadmin" // General link to superadmin dashboard
        };
      default:
        return {
          card1Value: 'N/A', card1Title: 'Rol Desconocido', card1Icon: Activity, card1Description: '',
          card2Value: 'N/A', card2Title: 'Rol Desconocido', card2Icon: Activity, card2Description: '',
          card3Value: 'N/A', card3Title: 'Rol Desconocido', card3Icon: Activity, card3Description: '',
        };
    }
  };
  
  if (authLoading || (!currentUser && !authLoading) ) {
    return (
      <div className="space-y-8">
        <Card className="shadow-lg"><CardHeader><Skeleton className="h-8 w-1/2 mb-2" /><Skeleton className="h-4 w-3/4" /></CardHeader><CardContent><Skeleton className="h-6 w-full" /></CardContent></Card>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="shadow-md"><CardHeader className="pb-2"><Skeleton className="h-5 w-3/5" /><Skeleton className="h-4 w-4 ml-auto" /></CardHeader><CardContent><Skeleton className="h-8 w-1/2" /><Skeleton className="h-3 w-4/5 mt-1" /></CardContent></Card>
          ))}
        </div>
        <div className="mt-8"><Skeleton className="h-7 w-1/4 mb-4" /><div className="grid gap-4 md:grid-cols-2"><Skeleton className="h-32 w-full" /><Skeleton className="h-32 w-full" /></div></div>
      </div>
    );
  }

  if (!userRole) {
     return <p>Error: Rol de usuario no determinado.</p>;
  }
  
  const stats = getDashboardStats();
  const links = roleSpecificLinks[userRole] || [];

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-headline">Bienvenido a tu Dashboard, {currentUser?.displayName || currentUser?.email}</CardTitle>
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
            <stats.card1Icon className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.card1Value}</div> 
            <p className="text-xs text-muted-foreground">{stats.card1Description}</p>
          </CardContent>
        </Card>

        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stats.card2Title}</CardTitle>
            <stats.card2Icon className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.card2Value}</div> 
            <p className="text-xs text-muted-foreground">{stats.card2Description}</p>
          </CardContent>
        </Card>

        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stats.card3Title}</CardTitle>
            <stats.card3Icon className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {stats.card3IsLink && stats.card3Href ? (
                <Button variant="outline" size="sm" asChild>
                    <Link href={stats.card3Href}>{stats.card3Value} <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
            ) : (
                <div className="text-2xl font-bold">{stats.card3Value}</div>
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

