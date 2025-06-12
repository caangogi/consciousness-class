
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Edit3, Eye, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { CourseProperties } from '@/features/course/domain/entities/course.entity';
import { Skeleton } from '@/components/ui/skeleton';
import { auth } from '@/lib/firebase/config';

interface CreatorCourse extends CourseProperties {
  // Potential future aggregated fields
  // totalEstudiantes?: number; 
  // totalIngresos?: number;
}

export default function CreatorCoursesPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [courses, setCourses] = useState<CreatorCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCreatorCourses = useCallback(async () => {
    if (!currentUser) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const idToken = await auth.currentUser?.getIdToken(true);
      if (!idToken) {
        throw new Error('No se pudo obtener el token de autenticación.');
      }

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
      setCourses(data.courses || []);
    } catch (err: any) {
      console.error("Error fetching creator courses:", err);
      setError(err.message);
      toast({
        title: 'Error al Cargar Cursos',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, toast]);

  useEffect(() => {
    fetchCreatorCourses();
  }, [fetchCreatorCourses]);

  const getStatusBadgeVariant = (status: CreatorCourse['estado']) => {
    switch (status) {
      case 'publicado':
        return 'default'; // Will use primary color by default for Badge
      case 'borrador':
        return 'secondary';
      case 'archivado':
        return 'outline';
      case 'en_revision':
        return 'default'; // Similar to published but can use a different color if theme is set
      default:
        return 'secondary';
    }
  };
  const getStatusBadgeClass = (status: CreatorCourse['estado']) => {
    switch (status) {
      case 'publicado':
        return 'bg-green-100 text-green-700 border-green-300 hover:bg-green-200';
      case 'borrador':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300 hover:bg-yellow-200';
      case 'archivado':
        return 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200';
      case 'en_revision':
        return 'bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200';
    }
  };


  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-10 w-40" />
        </div>
        <Card className="shadow-lg">
          <CardHeader>
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-4 w-1/2 mt-1" />
          </CardHeader>
          <CardContent>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 py-3 border-b last:border-b-0">
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
                <Skeleton className="h-8 w-20 rounded-full" />
                <Skeleton className="h-8 w-24" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="shadow-lg">
        <CardHeader className="text-center">
           <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-3" />
          <CardTitle className="text-2xl text-destructive">Error al Cargar Cursos</CardTitle>
          <CardDescription className="text-base">
            No pudimos cargar tus cursos en este momento.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-destructive-foreground bg-destructive/10 p-3 rounded-md border border-destructive/30 mb-4">{error}</p>
          <Button onClick={fetchCreatorCourses} variant="default">
            <RefreshCw className="mr-2 h-4 w-4" /> Intentar de Nuevo
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold font-headline">Mis Cursos</h1>
        <Button asChild>
          <Link href="/dashboard/creator/courses/new">
            <PlusCircle className="mr-2 h-5 w-5" /> Crear Nuevo Curso
          </Link>
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Listado de Cursos</CardTitle>
          <CardDescription>Gestiona todos los cursos que has creado.</CardDescription>
        </CardHeader>
        <CardContent>
          {courses.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre del Curso</TableHead>
                  <TableHead className="text-center hidden sm:table-cell">Estado</TableHead>
                  <TableHead className="text-center hidden md:table-cell">Estudiantes</TableHead>
                  <TableHead className="text-center hidden lg:table-cell">Ingresos (€)</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell className="font-medium">
                      <Link href={`/dashboard/creator/courses/edit/${course.id}`} className="hover:text-primary transition-colors">
                        {course.nombre}
                      </Link>
                      <p className="text-xs text-muted-foreground truncate max-w-xs sm:max-w-sm md:max-w-md">{course.descripcionCorta}</p>
                    </TableCell>
                    <TableCell className="text-center hidden sm:table-cell">
                      <Badge 
                        variant={getStatusBadgeVariant(course.estado)}
                        className={cn("capitalize", getStatusBadgeClass(course.estado))}
                      >
                        {course.estado.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center hidden md:table-cell">{course.totalEstudiantes || 0}</TableCell>
                    <TableCell className="text-center hidden lg:table-cell">{/* Placeholder for earnings */}0.00</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="icon" asChild title="Editar Curso">
                          <Link href={`/dashboard/creator/courses/edit/${course.id}`}>
                            <Edit3 className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" asChild title="Ver Curso (Público)">
                          <Link href={`/courses/${course.id}`} target="_blank">
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-10">
              <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No has creado ningún curso todavía.</h3>
              <p className="text-muted-foreground mb-4">¡Comienza a compartir tu conocimiento!</p>
              <Button asChild>
                <Link href="/dashboard/creator/courses/new">
                  <PlusCircle className="mr-2 h-4 w-4" /> Crear tu Primer Curso
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

