// src/features/course/infrastructure/dto/update-course.dto.ts
import type { CourseAccessType } from '@/features/course/domain/entities/course.entity';

// Para el Paso 1, los campos que se pueden actualizar son los mismos que los de creación.
// Podríamos hacerlos opcionales si la actualización fuera parcial,
// pero el formulario del Paso 1 siempre enviará todos estos campos.
export interface UpdateCourseDto {
  nombre: string;
  descripcionCorta: string;
  descripcionLarga: string;
  precio: number;
  tipoAcceso: CourseAccessType;
  categoria: string;
  duracionEstimada: string;
  // imagenPortadaUrl, videoTrailerUrl, etc., podrían manejarse por separado si involucran subidas de archivos.
  // Por ahora, nos centramos en los campos de texto/selección del Paso 1.
}
