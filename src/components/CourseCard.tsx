
'use client'; 

import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Users, Clock, Repeat } from 'lucide-react';
import type { CourseAccessType, CourseProperties } from '@/features/course/domain/entities/course.entity';
import React, { useState, useEffect } from 'react';

export interface CourseCardData extends Pick<CourseProperties, 
  'id' | 'nombre' | 'descripcionCorta' | 'precio' | 'imagenPortadaUrl' | 'dataAiHintImagenPortada' | 'categoria' | 'duracionEstimada' | 'ratingPromedio' | 'totalEstudiantes' | 'tipoAcceso'
> {
  creadorNombre?: string; 
}

interface CourseCardProps {
  course: CourseCardData;
}

export function CourseCard({ course }: CourseCardProps) {
  const [formattedTotalEstudiantes, setFormattedTotalEstudiantes] = useState<string | number>(course.totalEstudiantes || 0);

  useEffect(() => {
    if (course.totalEstudiantes !== undefined && course.totalEstudiantes !== null) {
      setFormattedTotalEstudiantes(course.totalEstudiantes.toLocaleString());
    }
  }, [course.totalEstudiantes]);

  const isSubscription = course.tipoAcceso === 'suscripcion';
  const isFree = course.tipoAcceso === 'unico' && course.precio <= 0;

  let priceDisplay: string;
  if (isSubscription) {
    priceDisplay = `${course.precio.toFixed(2)} €/mes`;
  } else if (isFree) {
    priceDisplay = 'Gratis';
  } else {
    priceDisplay = `${course.precio.toFixed(2)} €`;
  }

  return (
    <Card className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg group">
      <CardHeader className="p-0 relative">
        <Link href={`/courses/${course.id}`} aria-label={`Ver detalles del curso ${course.nombre}`}>
          <Image
            src={course.imagenPortadaUrl || 'https://placehold.co/600x400.png'}
            alt={`Portada del curso ${course.nombre}`}
            width={600}
            height={400}
            className="aspect-[16/9] w-full object-cover transition-transform duration-300 group-hover:scale-105"
            data-ai-hint={course.dataAiHintImagenPortada || 'course cover'}
          />
        </Link>
        {isSubscription && (
          <Badge variant="default" className="absolute top-3 left-3 bg-accent text-accent-foreground text-xs font-semibold px-2 py-1 rounded flex items-center gap-1">
            <Repeat size={12} /> Suscripción
          </Badge>
        )}
        {course.categoria && (
           <Badge variant="secondary" className={`absolute top-3 ${isSubscription ? 'right-3' : 'right-3'} bg-secondary/80 backdrop-blur-sm text-secondary-foreground text-xs font-medium px-2 py-1 rounded`}>
            {course.categoria}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="flex-grow p-5">
        <CardTitle className="text-lg font-headline mb-2 leading-tight group-hover:text-primary transition-colors">
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
          {(course.ratingPromedio && course.ratingPromedio > 0) ? (
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 text-accent fill-accent" />
              <span className="font-semibold text-foreground">{course.ratingPromedio.toFixed(1)}</span>
            </div>
          ) : <div />} 
          {course.totalEstudiantes !== undefined && (
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{formattedTotalEstudiantes} estudiantes</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-5 border-t bg-secondary/30 flex justify-between items-center">
        <span className="text-xl font-bold text-primary">{priceDisplay}</span>
        <Button asChild variant="default" size="sm">
          <Link href={`/courses/${course.id}`}>Ver Detalles</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
    