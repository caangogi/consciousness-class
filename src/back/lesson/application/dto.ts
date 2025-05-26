// src/back/lesson/application/dto.ts

import { FAQ } from '../../lesson/domain/Lesson';

/**
 * DTO para crear una nueva lección. Ahora incluye courseId
 * para poder localizar la subcolección correcta en Firestore.
 */
export interface CreateLessonDTO {
  courseId: string;
  moduleId: string;
  title: string;
  content: string;
  order: number;
  overview?: string;
  faqs?: FAQ[];
}

/**
 * DTO para recuperar una lección por su identificador.
 * Incluye courseId y moduleId para navegar a la ruta
 * courses/{courseId}/modules/{moduleId}/lessons/{lessonId}.
 */
export interface GetLessonByIdDTO {
  courseId: string;
  moduleId: string;
  lessonId: string;
}

/**
 * DTO para listar todas las lecciones de un módulo.
 * Ahora requiere tanto courseId como moduleId.
 */
export interface ListLessonsByModuleDTO {
  courseId: string;
  moduleId: string;
}

/**
 * DTO para actualizar una lección existente.
 * Incluye courseId y moduleId por consistencia en la ruta.
 */
export interface UpdateLessonDTO {
  courseId: string;
  moduleId: string;
  lessonId: string;
  title: string;
  content: string;
  overview?: string;
  faqs?: FAQ[];
}

/**
 * DTO para eliminar una lección.
 * Incluye courseId y moduleId para apuntar correctamente
 * al documento en la subcolección.
 */
export interface DeleteLessonDTO {
  courseId: string;
  moduleId: string;
  lessonId: string;
}
