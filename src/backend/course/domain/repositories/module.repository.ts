// src/features/course/domain/repositories/module.repository.ts
import type { ModuleEntity, ModuleProperties } from '../entities/module.entity';

export interface IModuleRepository {
  save(module: ModuleEntity): Promise<void>;
  findById(courseId: string, moduleId: string): Promise<ModuleEntity | null>;
  findAllByCourseId(courseId: string): Promise<ModuleEntity[]>;
  delete(courseId: string, moduleId: string): Promise<void>;
  update(courseId: string, moduleId: string, data: Partial<Omit<ModuleProperties, 'id' | 'courseId' | 'fechaCreacion' | 'ordenLecciones'>>): Promise<ModuleEntity | null>;
}
