
// src/features/course/infrastructure/dto/create-lesson.dto.ts
import type { LessonContentType } from '@/backend/course/domain/entities/lesson.entity';

export interface CreateLessonDto {
  nombre: string;
  descripcionBreve?: string;
  contenidoPrincipal: { // Simplificado para la creación inicial
    tipo: LessonContentType;
    url?: string | null;
    texto?: string | null;
  };
  duracionEstimada: string; // e.g., "10 min"
  esVistaPrevia: boolean;
  // courseId y moduleId se tomarán de los parámetros de la ruta
  // orden se determinará en el servicio
}
