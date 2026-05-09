'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Activity, ArrowRight, BookOpen, BarChartBig, Users, Settings, Gift, DollarSign, Award, Loader2, AlertTriangle, RefreshCw } from "lucide-react"; 
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import type { CourseProperties } from '@/backend/course/domain/entities/course.entity';
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
  card3ColorClass?: string;
  card3BgClass?: string;
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


  const roleSpecificLinks: Record<string, { title: string; description: string; href: string; icon: React.ElementType }[]> = {
    student: [
      { title: "Mis Cursos", description: "Accede a tus cursos inscritos y continúa tu aprendizaje.", href: "/dashboard/learning", icon: BookOpen },
      { title: "Ajustes", description: "Actualiza tu información y configuración.", href: "/dashboard/settings", icon: Settings },
    ],
    creator: [
      { title: "Gestionar Productos", description: "Crea, edita y publica tus activos.", href: "/dashboard/products", icon: BookOpen },
      { title: "Ajustes de Creador", description: "Configuración global de tu cuenta.", href: "/dashboard/settings", icon: Settings },
    ],
    admin: [
      { title: "Catálogo General", description: "Revisar todos los activos.", href: "/dashboard/products", icon: BookOpen },
      { title: "Gestión de Usuarios", description: "Administra todos los usuarios.", href: "/dashboard/users", icon: Users },
    ],
    superadmin: [
      { title: "Gestión de Usuarios", description: "Administra todos los usuarios de la plataforma.", href: "/dashboard/users", icon: Users },
      { title: "Configuración Global", description: "Ajusta los parámetros generales de Consciousness Class.", href: "/dashboard/settings", icon: Settings },
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
          card3ColorClass: "text-[#34C759] dark:text-[#30D158]",
          card3BgClass: "bg-[#34C759]/15 dark:bg-[#30D158]/15",
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
          card3ColorClass: "text-[#34C759] dark:text-[#30D158]",
          card3BgClass: "bg-[#34C759]/15 dark:bg-[#30D158]/15",
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
          card3Title: "Finanzas",
          card3Value: "Ir",
          card3Icon: DollarSign,
          card3Description: "Reportes económicos de la plataforma.",
          card3IsLink: true,
          card3Href: "/dashboard/finances",
          card3ColorClass: "text-[#34C759] dark:text-[#30D158]",
          card3BgClass: "bg-[#34C759]/15 dark:bg-[#30D158]/15",
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, y: 0, 
      transition: { type: "spring", stiffness: 300, damping: 24 }
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 pb-12 pt-4">
      <div className="flex justify-between items-center mb-6 px-1">
        <h1 className="text-largeTitle font-bold text-foreground">Inicio</h1>
        <Button onClick={handleRefresh} variant="ghost" size="sm" className="text-primary hover:bg-transparent" disabled={isRefreshing || isLoadingStats}>
          {isRefreshing ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-1 h-4 w-4" />}
          Refrescar
        </Button>
      </div>
      
      {statsError && <p className="text-destructive text-footnote pl-1 mb-4">{statsError}</p>}
      
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
      >
        {/* Perfil - Hero Card */}
        <motion.div variants={itemVariants} className="col-span-1 md:col-span-2 lg:col-span-2 row-span-1 border border-border/50 rounded-[28px] p-6 lg:p-8 bg-brand-muslin dark:bg-black/30 shadow-sm relative overflow-hidden group">
          <div className="absolute -top-10 -right-10 p-8 opacity-5 dark:opacity-10 group-hover:opacity-10 dark:group-hover:opacity-20 transition-opacity">
            <Award className="w-56 h-56 text-brand-clove dark:text-brand-sandstone transform rotate-12 scale-150" />
          </div>
          <div className="relative z-10 flex flex-col justify-between h-full min-h-[140px]">
            <div>
               <p className="text-subheadline text-brand-clove/70 dark:text-brand-sandstone/70 mb-2 font-medium capitalize tracking-wide">
                 Tu Cuenta • {userRole}
               </p>
               <h2 className="text-[28px] md:text-largeTitle font-bold text-brand-clove dark:text-brand-sandstone leading-tight">
                 Hola, {currentUser?.displayName?.split(' ')[0] || 'Aventurero'}!
               </h2>
            </div>
            <div className="mt-6 flex gap-2">
              <span className="inline-flex h-8 items-center rounded-full bg-brand-clove/10 dark:bg-brand-sandstone/10 px-4 text-xs font-medium text-brand-clove dark:text-brand-sandstone">
                  Bienvenido al panel
              </span>
            </div>
          </div>
        </motion.div>

        {/* Card 1 */}
        <motion.div variants={itemVariants} className="col-span-1 md:col-span-1 border border-border/50 rounded-[24px] p-6 bg-card shadow-sm hover:shadow-apple transition-shadow flex flex-col justify-between min-h-[140px]">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-brand-chambray/10 p-3 rounded-[16px]"><stats.card1Icon className="h-6 w-6 text-brand-chambray"/></div>
            </div>
            <div>
              <span className="text-largeTitle font-bold block mb-1 text-foreground">
                 {isLoadingStats && typeof stats.card1Value !== 'number' && stats.card1Value !== 'Ir' ? <Skeleton className="h-8 w-16" /> : stats.card1Value}
              </span>
              <span className="text-body font-medium text-secondary-foreground">{stats.card1Title}</span>
            </div>
        </motion.div>

        {/* Card 2 */}
        <motion.div variants={itemVariants} className="col-span-1 md:col-span-1 border border-border/50 rounded-[24px] p-6 bg-card shadow-sm hover:shadow-apple transition-shadow flex flex-col justify-between min-h-[140px]">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-brand-terracotta/10 p-3 rounded-[16px]"><stats.card2Icon className="h-6 w-6 text-brand-terracotta"/></div>
            </div>
            <div>
              <span className="text-largeTitle font-bold block mb-1 text-foreground">
                 {isLoadingStats && typeof stats.card2Value !== 'number' ? <Skeleton className="h-8 w-16" /> : stats.card2Value}
              </span>
              <span className="text-body font-medium text-secondary-foreground">{stats.card2Title}</span>
            </div>
        </motion.div>

        {/* Card 3 */}
        <motion.div variants={itemVariants} className="col-span-1 md:col-span-2 lg:col-span-1 border border-border/50 rounded-[24px] p-6 bg-card shadow-sm hover:shadow-apple transition-shadow flex flex-col justify-between min-h-[140px]">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-3 rounded-[16px] ${stats.card3BgClass || 'bg-primary/5 dark:bg-white/10'}`}>
                  <stats.card3Icon className={`h-6 w-6 ${stats.card3ColorClass || 'text-primary dark:text-white'}`}/>
              </div>
            </div>
            <div>
              <span className="text-largeTitle font-bold block mb-1 truncate text-foreground">
                 {isLoadingStats && typeof stats.card3Value !== 'string' && typeof stats.card3Value !== 'number' ? <Skeleton className="h-8 w-full max-w-[120px]" /> : stats.card3Value}
              </span>
              <span className="text-body font-medium text-secondary-foreground">{stats.card3Title}</span>
            </div>
        </motion.div>

        {/* Accesos Rápidos Bento */}
        <motion.div variants={itemVariants} className="col-span-1 md:col-span-3 lg:col-span-3 border border-border/50 rounded-[28px] overflow-hidden bg-secondary/30 dark:bg-black/20 shadow-sm flex flex-col">
            <div className="px-6 py-5 border-b border-border/50 flex items-center justify-between bg-card/50">
               <h3 className="text-headline font-semibold text-foreground">Accesos Rápidos</h3>
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 flex-grow gap-3">
                 {links.map((link: any, idx: number) => (
                    <Link key={idx} href={link.href} className="flex flex-col sm:flex-row items-start sm:items-center p-4 bg-card rounded-[20px] border border-border/40 hover:border-brand-chambray/40 hover:bg-brand-chambray/5 dark:hover:bg-white/5 transition-all group ios-button min-h-[90px] shadow-sm hover:shadow-md">
                      <div className="bg-primary/5 dark:bg-white/5 border border-border/50 rounded-full p-3 mb-3 sm:mb-0 sm:mr-4 group-hover:scale-110 group-hover:bg-primary/10 transition-transform"><link.icon className="h-6 w-6 text-primary group-hover:text-brand-chambray transition-colors"/></div>
                      <div className="flex-1">
                         <span className="block text-body font-semibold text-foreground mb-0.5 group-hover:text-primary transition-colors">{link.title}</span>
                         <span className="block text-footnote text-muted-foreground line-clamp-2 leading-snug">{link.description}</span>
                      </div>
                      <ArrowRight className="h-5 w-5 text-[#C6C6C8] dark:text-[#555] opacity-0 sm:-translate-x-3 group-hover:opacity-100 group-hover:translate-x-0 transition-all hidden sm:block" />
                    </Link>
                  ))}
            </div>
        </motion.div>

      </motion.div>
    </div>
  );
}

    