
'use client';

import { useState, useEffect } from 'react';
import { CourseCard, type CourseCardData } from '@/components/CourseCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter, Search, SlidersHorizontal, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import type { CourseAccessType } from '@/features/course/domain/entities/course.entity';

export default function CoursesPage() {
  const [courses, setCourses] = useState<CourseCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState('popularity');

  useEffect(() => {
    async function fetchCourses() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/courses');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.details || errorData.error || 'Failed to fetch courses');
        }
        const data = await response.json();
        const coursesWithAccessType = data.courses.map((course: any) => ({
          ...course,
          tipoAcceso: course.tipoAcceso || 'unico', // Asegurar que tipoAcceso esté presente
        })) as CourseCardData[];
        setCourses(coursesWithAccessType || []);
      } catch (err: any) {
        setError(err.message);
        console.error("Error fetching courses:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchCourses();
  }, []);

  const categories = ["Desarrollo Web", "Data Science", "Diseño", "Marketing", "Fotografía", "Finanzas", "Desarrollo de Videojuegos", "Bienestar", "Tecnología", "Salud y Bienestar"];
  const sortOptions = [
    { value: "popularity", label: "Popularidad" },
    { value: "newest", label: "Más Recientes" },
    { value: "rating", label: "Mejor Valorados" },
    { value: "price-asc", label: "Precio: Bajo a Alto" },
    { value: "price-desc", label: "Precio: Alto a Bajo" },
  ];

  if (error) {
    return (
      <div className="container mx-auto py-12 px-4 md:px-6 text-center">
        <Card className="inline-block p-6 bg-card shadow-lg rounded-xl">
          <CardContent className="p-0">
            <div className="mx-auto p-3 bg-destructive/10 rounded-full w-fit mb-4">
              <Filter className="h-12 w-12 text-destructive" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-destructive-foreground">Error al Cargar Cursos</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} variant="destructive">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Intentar de Nuevo
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <header className="mb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-bold font-headline mb-4">Explora Nuestros Cursos</h1>
        <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
          Encuentra el curso perfecto para expandir tus habilidades y alcanzar tus metas profesionales.
        </p>
      </header>

      <Card className="mb-8 p-4 md:p-6 shadow-lg rounded-xl bg-card">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div className="relative">
            <Input
              type="search"
              placeholder="Buscar por nombre o palabra clave..."
              className="pl-10 h-10 rounded-md border-border focus-visible:ring-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          </div>
          
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full h-10 rounded-md border-border focus:ring-primary">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las Categorías</SelectItem>
              {categories.map(cat => <SelectItem key={cat} value={cat.toLowerCase().replace(/\s+/g, '-')}>{cat}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full h-10 rounded-md border-border focus:ring-primary">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
            </SelectContent>
          </Select>
          
          <Button variant="outline" className="w-full lg:w-auto h-10 rounded-md border-border hover:border-primary hover:bg-primary/5">
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            Más Filtros
          </Button>
        </div>
      </Card>

      {isLoading ? (
        <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="flex flex-col overflow-hidden shadow-lg rounded-lg bg-card">
              <Skeleton className="aspect-[16/9] w-full" />
              <CardContent className="flex-grow p-5 space-y-3">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
              <CardFooter className="p-5 border-t bg-secondary/30 flex justify-between items-center">
                <Skeleton className="h-8 w-1/4" />
                <Skeleton className="h-9 w-1/3" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : courses.length > 0 ? (
        <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
            <Card className="inline-block p-6 bg-card shadow-md rounded-xl">
              <CardContent className="p-0">
                <div className="mx-auto p-3 bg-secondary rounded-full w-fit mb-4">
                  <Filter className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No se encontraron cursos</h3>
                <p className="text-muted-foreground">Intenta ajustar tus filtros o revisa más tarde.</p>
              </CardContent>
            </Card>
        </div>
      )}

      {!isLoading && courses.length > 0 && (
        <div className="mt-12 flex justify-center">
          <Button variant="outline" className="mr-2 rounded-md" disabled>Anterior</Button>
          <Button variant="default" className="rounded-md" disabled>Siguiente</Button>
        </div>
      )}
    </div>
  );
}
    