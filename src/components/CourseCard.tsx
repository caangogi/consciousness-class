import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, Users, Clock } from 'lucide-react';

export interface Course {
  id: string;
  nombre: string;
  descripcionCorta: string;
  precio: number;
  imagenPortada: string;
  dataAiHint?: string;
  creadorNombre?: string; // Optional: display creator name
  duracionEstimada?: string;
  rating?: number;
  numEstudiantes?: number;
  categoria?: string;
}

interface CourseCardProps {
  course: Course;
}

export function CourseCard({ course }: CourseCardProps) {
  return (
    <Card className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg">
      <CardHeader className="p-0 relative">
        <Link href={`/courses/${course.id}`} aria-label={`Ver detalles del curso ${course.nombre}`}>
          <Image
            src={course.imagenPortada}
            alt={`Portada del curso ${course.nombre}`}
            width={600}
            height={400}
            className="aspect-[16/9] w-full object-cover transition-transform duration-300 group-hover:scale-105"
            data-ai-hint={course.dataAiHint || 'course cover'}
          />
        </Link>
        {course.categoria && (
          <span className="absolute top-3 right-3 bg-primary text-primary-foreground text-xs font-semibold px-2 py-1 rounded">
            {course.categoria}
          </span>
        )}
      </CardHeader>
      <CardContent className="flex-grow p-5">
        <CardTitle className="text-lg font-headline mb-2 leading-tight hover:text-primary transition-colors">
          <Link href={`/courses/${course.id}`}>
            {course.nombre}
          </Link>
        </CardTitle>
        <CardDescription className="text-sm text-foreground/70 mb-3 h-16 overflow-hidden">
          {course.descripcionCorta}
        </CardDescription>
        
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground mb-3">
          {course.creadorNombre && <p>Por: <span className="font-medium text-foreground">{course.creadorNombre}</span></p>}
          {course.duracionEstimada && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{course.duracionEstimada}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          {course.rating !== undefined && (
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 text-accent fill-accent" />
              <span className="font-semibold text-foreground">{course.rating.toFixed(1)}</span>
            </div>
          )}
          {course.numEstudiantes !== undefined && (
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{course.numEstudiantes.toLocaleString()} estudiantes</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-5 border-t bg-secondary/30 flex justify-between items-center">
        <span className="text-xl font-bold text-primary">${course.precio.toFixed(2)}</span>
        <Button asChild variant="default" size="sm">
          <Link href={`/courses/${course.id}`}>Ver Detalles</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
