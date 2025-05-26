// src/back/material/application/dto.ts

import { MaterialMetadata, MaterialType } from '../../material/domain/Material';

/**
 * DTO para solicitar URL firmadas de subida/descarga.
 */
export interface GetUploadUrlDTO {
  lessonId: string;
  fileName: string;
  contentType: string;
}

/**
 * DTO para crear un nuevo material.
 * Incluye courseId y moduleId para ubicar correctamente el documento.
 */
export interface CreateMaterialDTO {
  courseId: string;
  moduleId: string;
  lessonId: string;
  type: MaterialType;
  url: string;
  metadata?: MaterialMetadata;
}

/**
 * DTO para recuperar un material por su ID.
 */
export interface GetMaterialByIdDTO {
  courseId: string;
  moduleId: string;
  lessonId: string;
  materialId: string;
}

/**
 * DTO para listar todos los materiales de una lección.
 */
export interface ListMaterialsByLessonDTO {
  courseId: string;
  moduleId: string;
  lessonId: string;
}

/**
 * DTO para actualizar los datos de un material existente.
 */
export interface UpdateMaterialDTO {
  courseId: string;
  moduleId: string;
  lessonId: string;
  materialId: string;
  url?: string;
  metadata?: MaterialMetadata;
}

/**
 * DTO para eliminar un material.
 */
export interface DeleteMaterialDTO {
  courseId: string;
  moduleId: string;
  lessonId: string;
  materialId: string;
}
