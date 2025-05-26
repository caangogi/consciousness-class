// src/lib/moduleApi.ts

import { apiFetch } from './apiClient';

export interface CreateModuleDTO {
  courseId: string;
  title: string;
  order: number;
  description?: string;
}

export interface Module {
  id: string;
  courseId: string;
  title: string;
  order: number;
  description?: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Crea un nuevo módulo en el backend.
 * @param dto Objeto con los datos del módulo.
 * @param token Token de autenticación Firebase.
 * @returns Un objeto con el ID del módulo creado.
 */
export async function createModule(
  dto: CreateModuleDTO,
  token: string
): Promise<{ id: string }> {
  return apiFetch<{ id: string }>('/api/module', {
    method: 'POST',
    body: JSON.stringify(dto),
  }, token);
}

/**
 * Obtiene la lista de módulos de un curso.
 * @param courseId ID del curso.
 * @param token Token de autenticación Firebase.
 * @returns Un array de módulos persistidos en el backend.
 */
export async function listModules(
  courseId: string,
  token: string
): Promise<Module[]> {
  return apiFetch<Module[]>(
    `/api/module?courseId=${encodeURIComponent(courseId)}`,
    { method: 'GET' },
    token
  );
}

export async function updateModule(id: string, update: Partial<CreateModuleDTO> & {id:string}, token: string): Promise<void> {
  await apiFetch<void>(`/api/module/${id}`, { method: 'PUT', body: JSON.stringify(update) }, token);
}

export async function deleteModule(id: string, token: string): Promise<void> {
  await apiFetch<void>(`/api/module/${id}`, { method: 'DELETE' }, token);
}

