
// src/features/course/domain/repositories/lesson.repository.ts
import type { LessonEntity, LessonProperties } from '../entities/lesson.entity';

export interface ILessonRepository {
  save(lesson: LessonEntity): Promise<void>;
  findById(courseId: string, moduleId: string, lessonId: string): Promise<LessonEntity | null>;
  findAllByModuleId(courseId: string, moduleId: string): Promise<LessonEntity[]>;
  delete(courseId: string, moduleId: string, lessonId: string): Promise<void>;
  // update(courseId: string, moduleId: string, lessonId: string, data: Partial<Omit<LessonProperties, 'id' | 'moduleId' | 'courseId' | 'fechaCreacion'>>): Promise<LessonEntity | null>;
}
