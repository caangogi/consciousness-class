
// src/features/course/domain/repositories/course.repository.ts
import type { CourseEntity, CourseProperties } from '../entities/course.entity';

export interface ICourseRepository {
  save(course: CourseEntity): Promise<void>;
  findById(id: string): Promise<CourseEntity | null>;
  findAllByCreator(creatorUid: string): Promise<CourseEntity[]>;
  // update(id: string, data: Partial<Omit<CourseProperties, 'id' | 'creadorUid' | 'fechaCreacion'>>): Promise<CourseEntity | null>;
  // delete(id: string): Promise<void>;
  // findAll(filters?: any): Promise<CourseEntity[]>; // With pagination/filters
}
