
// src/features/course/infrastructure/dto/create-course.dto.ts
import type { CourseAccessType } from '@/backend/course/domain/entities/course.entity';

export interface CreateCourseDto {
  nombre: string;
  descripcionCorta: string;
  descripcionLarga: string; // HTML
  precio: number;
  tipoAcceso: CourseAccessType;
  categoria: string;
  duracionEstimada: string;
  referralPolicyId?: string | null; // Opcional en la creación
  // imagenPortadaUrl will be handled separately (upload then update) or as part of a more complex DTO
  // creadorUid will be taken from the authenticated user on the backend
}
