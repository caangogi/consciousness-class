
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircle, Edit3, BarChart2, Settings, MessageSquare, Users, Eye, Info, BookOpen, Star, DollarSign, Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { CourseProperties } from '@/features/course/domain/entities/course.entity';
import { Skeleton } from '@/components/ui/skeleton';
import { auth } from '@/lib/firebase/config';
import { cn } from '@/lib/utils';

// Esta interfaz puede simplificarse si no se necesitan todos los campos de CourseProperties aquí
interface CreatorCourseSummary extends Pick<CourseProperties, 'id' | 'nombre' | 'estado' | 'totalEstudiantes' | 'descripcionCorta'> {}

// Placeholder data for stats (actual implementation can be added later)
const placeholderStats = {
  totalStudents: 0, // Será calculado o un placeholder
  totalEarnings: 0.00,
  avgRating: 0.0,
  activeCourses: 0,
};

export default function CreatorDashboardPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [courses, setCourses] = useState<CreatorCourseSummary[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [coursesError, setCoursesError] = useState<string | null>(null);

  const fetchCreatorCourses = useCallback(async () => {
    if (!currentUser || !auth.currentUser) {
      setIsLoadingCourses(false);
      setCoursesError("Usuario no autenticado.");
      return;
    }
    setIsLoadingCourses(true);
    setCoursesError(null);
    try {
      const idToken = await auth.currentUser.getIdToken(true);
      const response = await fetch('/api/creator/courses', {
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Error al cargar los cursos.');
      }
      const data = await response.json();
      setCourses((data.courses as CourseProperties[])?.map(c => ({
        id: c.id,
        nombre: c.nombre,
        estado: c.estado,
        totalEstudiantes: c.totalEstudiantes,
        descripcionCorta: c.descripcionCorta,
      })) || []);
    } catch (err: any) {
      setCoursesError(err.message);
      toast({
        title: 'Error al Cargar Cursos',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoadingCourses(false);
    }
  }, [currentUser, toast]);

  useEffect(() => {
    fetchCreatorCourses();
  }, [fetchCreatorCourses]);

  const getStatusBadgeVariant = (status: CourseProperties['estado']) => {
    switch (status) {
      case 'publicado': return 'default';
      case 'borrador': return 'secondary';
      case 'archivado': return 'outline';
      default: return 'secondary';
    }
  };
  const getStatusBadgeClass = (status: CourseProperties['estado']) => {
    switch (status) {
      case 'publicado': return 'bg-green-100 text-green-700 border-green-300 hover:bg-green-200';
      case 'borrador': return 'bg-yellow-100 text-yellow-700 border-yellow-300 hover:bg-yellow-200';
      case 'archivado': return 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200';
      case 'en_revision': return 'bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200';
    }
  };

  const renderCourseTableContent = () => {
    if (isLoadingCourses) {
      return (
        <TableBody>
          {[...Array(2)].map((_, i) => (
            <TableRow key={`skeleton-${i}`}>
              <TableCell><Skeleton className="h-5 w-3/4" /></TableCell>
              <TableCell className="text-center hidden md:table-cell"><Skeleton className="h-6 w-20 mx-auto rounded-full" /></TableCell>
              <TableCell className="text-center hidden md:table-cell"><Skeleton className="h-5 w-8 mx-auto" /></TableCell>
              <TableCell className="text-right space-x-1"><Skeleton className="h-8 w-8 inline-block rounded-md" /><Skeleton className="h-8 w-8 inline-block rounded-md" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      );
    }

    if (coursesError) {
      return (
        <TableBody>
          <TableRow>
            <TableCell colSpan={4} className="text-center py-6">
              <AlertTriangle className="mx-auto h-8 w-8 text-destructive mb-2" />
              <p className="text-destructive text-sm">{coursesError}</p>
              <Button onClick={fetchCreatorCourses} variant="link" size="sm" className="mt-2">Reintentar</Button>
            </TableCell>
          </TableRow>
        </TableBody>
      );
    }

    if (courses.length === 0) {
      return (
        <TableBody>
          <TableRow>
            <TableCell colSpan={4} className="text-center py-10">
              <BookOpen className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Aún no has creado ningún curso.</p>
              <Button asChild variant="link" className="mt-2">
                <Link href="/dashboard/creator/courses/new">
                  <PlusCircle className="mr-2 h-4 w-4" /> Crear tu Primer Curso
                </Link>
              </Button>
            </TableCell>
          </TableRow>
        </TableBody>
      );
    }

    return (
      <TableBody>
        {courses.slice(0, 3).map((course) => (
          <TableRow key={course.id}>
            <TableCell className="font-medium">
                <Link href={`/dashboard/creator/courses/${course.id}`} className="hover:text-primary transition-colors">
                    {course.nombre}
                </Link>
                <p className="text-xs text-muted-foreground truncate max-w-xs">{course.descripcionCorta}</p>
            </TableCell>
            <TableCell className="text-center hidden md:table-cell">
              <Badge variant={getStatusBadgeVariant(course.estado)} className={cn("capitalize", getStatusBadgeClass(course.estado))}>
                {course.estado.replace('_', ' ')}
              </Badge>
            </TableCell>
            <TableCell className="text-center hidden md:table-cell">{course.totalEstudiantes || 0}</TableCell>
            <TableCell className="text-right">
              <div className="flex gap-1 justify-end">
                <Button variant="ghost" size="icon" asChild title="Editar Curso">
                  <Link href={`/dashboard/creator/courses/${course.id}`}><Edit3 className="h-4 w-4" /></Link>
                </Button>
                <Button variant="ghost" size="icon" asChild title="Ver Curso (Público)">
                  <Link href={`/courses/${course.id}`} target="_blank"><Eye className="h-4 w-4" /></Link>
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    );
  };


  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold font-headline">Panel de Creator</h1>
        <Button asChild>
          <Link href="/dashboard/creator/courses/new">
            <PlusCircle className="mr-2 h-5 w-5" /> Crear Nuevo Curso
          </Link>
        </Button>
      </div>

      {/* Quick Stats Section */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            <DollarSign className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{placeholderStats.totalEarnings.toFixed(2)} €</div>
            <p className="text-xs text-muted-foreground">Estadísticas (Próximamente).</p>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estudiantes Totales</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{placeholderStats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">En todos tus cursos (Próximamente).</p>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cursos Activos</CardTitle>
            <BookOpen className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{courses.filter(c => c.estado === 'publicado').length}</div>
            <p className="text-xs text-muted-foreground">Cursos publicados actualmente.</p>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valoración Promedio</CardTitle>
            <Star className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{placeholderStats.avgRating.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">De todos tus cursos (Próximamente).</p>
          </CardContent>
        </Card>
      </div>
      
      {/* My Courses Table Section */}
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-headline">Mis Cursos (Resumen)</CardTitle>
              <CardDescription>Un vistazo rápido a tus cursos. Gestiona todos en "Gestionar Cursos".</CardDescription>
            </div>
             <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/creator/courses">Gestionar Todos los Cursos</Link>
             </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título del Curso</TableHead>
                <TableHead className="text-center hidden md:table-cell">Estado</TableHead>
                <TableHead className="text-center hidden md:table-cell">Estudiantes</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            {renderCourseTableContent()}
          </Table>
        </CardContent>
      </Card>

      {/* Other Actions Section */}
      <div className="grid md:grid-cols-2 gap-8">
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-2">
                <Settings className="h-6 w-6 text-primary" />
                <CardTitle className="text-xl font-headline">Configuración de Referidos</CardTitle>
            </div>
            <CardDescription>Define las recompensas para quienes refieran tus cursos.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">Define comisiones por curso en la sección de edición de cada uno. La gestión avanzada de referidos estará disponible próximamente.</p>
            <Button variant="outline" disabled>Config. Avanzada (Próximamente)</Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-2">
                <MessageSquare className="h-6 w-6 text-primary" />
                <CardTitle className="text-xl font-headline">Comentarios y Preguntas</CardTitle>
            </div>
            <CardDescription>Revisa y responde a los comentarios de tus estudiantes.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">Próximamente podrás gestionar aquí todas las interacciones de tus estudiantes.</p>
            <Button variant="outline" disabled>Ver Comentarios (Próximamente)</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

    