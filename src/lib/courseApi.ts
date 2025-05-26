import { apiFetch } from './apiClient';

/**
 * DTO para crear o actualizar un curso.
 * Incluye el array de moduleIds, aunque al crear se envíe vacío.
 */
export interface CreateCourseDTO {
  title: string;
  description: string;
  coverImageUrl: string;
  price: number;
  language: string;
  level: string;
  tags?: string[];
  whatYouWillLearn: string[];
  whyChooseThisCourse: string[];
  idealFor: string[];
  enrollCallToAction: string;
  moduleIds: string[];
}

/**
 * Representación completa de un curso recuperado desde la API.
 */
export interface Course extends CreateCourseDTO {
  id: string;
  createdAt: string;
  updatedAt?: string;
  isPublished: boolean;
}

export async function createCourse(
  dto: CreateCourseDTO,
  token: string
): Promise<{ id: string }> {
  return apiFetch<{ id: string }>('/api/course', {
    method: 'POST',
    body: JSON.stringify(dto),
  }, token);
}

export async function listCourses(
  instructorId: string | undefined,
  token: string
): Promise<Course[]> {
  const url = new URL('/api/course', window.location.origin);
  if (instructorId) url.searchParams.set('instructorId', instructorId);
  return apiFetch<Course[]>(url.toString(), { method: 'GET' }, token);
}

export async function getCourse(
  id: string,
  token: string
): Promise<Course> {
  return apiFetch<Course>(`/api/course/${id}`, { method: 'GET' }, token);
}

export async function updateCourse(
  id: string,
  update: Partial<CreateCourseDTO> & { id: string },
  token: string
): Promise<void> {
  await apiFetch<void>(`/api/course/${id}`, {
    method: 'PUT',
    body: JSON.stringify(update),
  }, token);
}

export async function deleteCourse(
  id: string,
  token: string
): Promise<void> {
  await apiFetch<void>(`/api/course/${id}`, { method: 'DELETE' }, token);
}
