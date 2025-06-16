
// src/features/course/infrastructure/dto/update-course.dto.ts
import type { CourseAccessType, CourseStatus } from '@/features/course/domain/entities/course.entity';

export interface UpdateCourseDto {
  nombre?: string;
  descripcionCorta?: string;
  descripcionLarga?: string;
  precio?: number;
  tipoAcceso?: CourseAccessType;
  categoria?: string;
  duracionEstimada?: string;
  imagenPortadaUrl?: string | null; 
  dataAiHintImagenPortada?: string | null;
  videoTrailerUrl?: string | null; 
  estado?: CourseStatus; 
  comisionReferidoPorcentaje?: number | null; // Añadido
}
