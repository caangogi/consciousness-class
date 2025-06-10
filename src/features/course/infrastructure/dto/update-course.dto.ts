// src/features/course/infrastructure/dto/update-course.dto.ts
import type { CourseAccessType, CourseStatus } from '@/features/course/domain/entities/course.entity';

// Para el Paso 1, los campos que se pueden actualizar son los mismos que los de creación.
// Podríamos hacerlos opcionales si la actualización fuera parcial,
// pero el formulario del Paso 1 siempre enviará todos estos campos.

// Ahora, este DTO se usará para actualizaciones parciales desde diferentes pasos.
export interface UpdateCourseDto {
  nombre?: string;
  descripcionCorta?: string;
  descripcionLarga?: string;
  precio?: number;
  tipoAcceso?: CourseAccessType;
  categoria?: string;
  duracionEstimada?: string;
  imagenPortadaUrl?: string | null; // Para la URL de la imagen de portada
  dataAiHintImagenPortada?: string | null;
  videoTrailerUrl?: string | null; // Para la URL del video trailer
  estado?: CourseStatus; // Para el estado de publicación
  // Otros campos que puedan ser actualizables en el futuro
}
