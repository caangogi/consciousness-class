
// src/features/course/infrastructure/dto/create-course.dto.ts
import type { CourseAccessType } from '@/features/course/domain/entities/course.entity';

export interface CreateCourseDto {
  nombre: string;
  descripcionCorta: string;
  descripcionLarga: string; // HTML
  precio: number;
  tipoAcceso: CourseAccessType;
  categoria: string;
  duracionEstimada: string;
  // imagenPortadaUrl will be handled separately (upload then update) or as part of a more complex DTO
  // creadorUid will be taken from the authenticated user on the backend
}
