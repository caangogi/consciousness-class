// src/features/course/domain/repositories/module.repository.ts
import type { ModuleEntity } from '../entities/module.entity';

export interface IModuleRepository {
  save(module: ModuleEntity): Promise<void>;
  findById(courseId: string, moduleId: string): Promise<ModuleEntity | null>;
  findAllByCourseId(courseId: string): Promise<ModuleEntity[]>;
  delete(courseId: string, moduleId: string): Promise<void>;
  // update(courseId: string, moduleId: string, data: Partial<Omit<ModuleEntity, 'id' | 'courseId' | 'fechaCreacion'>>): Promise<ModuleEntity | null>;
}
