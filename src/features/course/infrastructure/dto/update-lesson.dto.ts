
// src/features/course/infrastructure/dto/update-lesson.dto.ts
import type { LessonContentType, MaterialAdicional } from '@/features/course/domain/entities/lesson.entity';

// DTO para actualizar una lección, todos los campos son opcionales
export interface UpdateLessonDto {
  nombre?: string;
  descripcionBreve?: string;
  contenidoPrincipal?: {
    tipo?: LessonContentType;
    url?: string | null;
    texto?: string | null;
    duracionVideo?: number;
  };
  duracionEstimada?: string;
  esVistaPrevia?: boolean;
  orden?: number;
  materialesAdicionales?: MaterialAdicional[];
}
