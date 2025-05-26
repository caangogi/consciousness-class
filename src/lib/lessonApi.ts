// src/lib/lessonApi.ts

import { apiFetch } from './apiClient';

export interface FAQ {
  question: string;
  answer: string;
}

export interface CreateLessonDTO {
    courseId: string;
    moduleId: string;
    title: string;
    content: string;
    order: number;
    overview?: string;
    faqs?: FAQ[];
}

export interface UpdateLessonDTO {
  lessonId: string;
  title: string;
  content: string;
  overview?: string;
  faqs?: FAQ[];
}

export interface LessonRecord {
  id: string;
  moduleId: string;
  title: string;
  content: string;
  order: number;
  overview?: string;
  faqs?: FAQ[];
  createdAt: string;
  updatedAt?: string;
}

export async function createLesson(
  dto: CreateLessonDTO,
  token: string
): Promise<{ id: string }> {
  return apiFetch<{ id: string }>(
    '/api/lesson',
    {
      method: 'POST',
      body: JSON.stringify(dto),
    },
    token
  );
}

export async function listLessons(
  moduleId: string,
  token: string
): Promise<LessonRecord[]> {
  return apiFetch<LessonRecord[]>(
    `/api/lesson?moduleId=${encodeURIComponent(moduleId)}`,
    { method: 'GET' },
    token
  );
}

export async function getLessonById(
  lessonId: string,
  token: string
): Promise<LessonRecord> {
  return apiFetch<LessonRecord>(
    `/api/lesson/${encodeURIComponent(lessonId)}`,
    { method: 'GET' },
    token
  );
}

export async function updateLesson(
  dto: UpdateLessonDTO,
  token: string
): Promise<void> {
  await apiFetch(
    `/api/lesson/${encodeURIComponent(dto.lessonId)}`,
    {
      method: 'PUT',
      body: JSON.stringify(dto),
    },
    token
  );
}

export async function deleteLesson(
  lessonId: string,
  token: string
): Promise<void> {
  await apiFetch(
    `/api/lesson/${encodeURIComponent(lessonId)}`,
    {
      method: 'DELETE',
    },
    token
  );
}
