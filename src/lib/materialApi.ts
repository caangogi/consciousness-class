// src/lib/materialApi.ts

import { apiFetch } from './apiClient';

export type MaterialType = 'video' | 'audio' | 'pdf' | 'image';

export interface MaterialMetadata {
  size?: number;       // bytes
  duration?: number;   // segundos
  mimeType?: string;
}

/** DTO para solicitar URL firmada de subida */
export interface GetUploadUrlDTO {
  lessonId: string;
  fileName: string;
  contentType: string;
}

/** DTO para crear el registro de material en Firestore */
export interface CreateMaterialDTO {
  courseId: string;
  moduleId: string;
  lessonId: string;
  type: MaterialType;
  url: string;
  metadata?: MaterialMetadata;
}

/** DTO para listar materiales de una lección */
export interface ListMaterialsByLessonDTO {
  courseId: string;
  moduleId: string;
  lessonId: string;
}

/** DTO para eliminar un material */
export interface DeleteMaterialDTO {
  courseId: string;
  moduleId: string;
  lessonId: string;
  materialId: string;
}

/** Persistencia de Material tal como viene del backend */
export interface MaterialPersistence {
  id: string;
  courseId: string;
  moduleId: string;
  lessonId: string;
  type: MaterialType;
  url: string;
  metadata?: MaterialMetadata;
  createdAt: string;   // ISO string
  updatedAt?: string;  // ISO string
}

/** Solicita URLs firmadas al backend */
export async function getUploadUrl(
  dto: GetUploadUrlDTO,
  token: string
): Promise<{ uploadUrl: string; downloadUrl: string; path: string }> {
  return apiFetch<{ uploadUrl: string; downloadUrl: string; path: string }>(
    '/api/material/upload-url',
    {
      method: 'POST',
      body: JSON.stringify(dto),
    },
    token
  );
}

/** Sube el fichero al bucket usando PUT signed URL */
export async function uploadFileToStorage(
  uploadUrl: string,
  file: File
): Promise<void> {
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });
  if (!res.ok) throw new Error('Upload failed');
}

/** Crea el registro de material en Firestore */
export async function createMaterialRecord(
  dto: CreateMaterialDTO,
  token: string
): Promise<{ id: string }> {
  return apiFetch<{ id: string }>(
    '/api/material',
    {
      method: 'POST',
      body: JSON.stringify(dto),
    },
    token
  );
}

/** Lista materiales de una lección */
export async function listMaterials(
  dto: ListMaterialsByLessonDTO,
  token: string
): Promise<MaterialPersistence[]> {
  const params = new URLSearchParams({
    courseId: dto.courseId,
    moduleId: dto.moduleId,
    lessonId: dto.lessonId,
  });
  return apiFetch<MaterialPersistence[]>(
    `/api/material?${params.toString()}`,
    { method: 'GET' },
    token
  );
}

/** Elimina un material */
export async function deleteMaterial(
  dto: DeleteMaterialDTO,
  token: string
): Promise<void> {
  const url = `/api/material` +
    `?courseId=${encodeURIComponent(dto.courseId)}` +
    `&moduleId=${encodeURIComponent(dto.moduleId)}` +
    `&lessonId=${encodeURIComponent(dto.lessonId)}` +
    `&materialId=${encodeURIComponent(dto.materialId)}`;
  await apiFetch<void>(
    url,
    { method: 'DELETE' },
    token
  );
}
