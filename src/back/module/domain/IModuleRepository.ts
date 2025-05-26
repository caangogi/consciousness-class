import { Module } from './Module';
import { UniqueEntityID } from '../../share/utils/UniqueEntityID';

export interface IModuleRepository {
  save(module: Module): Promise<void>;
  findById(id: UniqueEntityID): Promise<Module | null>;
  findAllByCourse(courseId: string): Promise<Module[]>;
  delete(id: UniqueEntityID): Promise<void>;
}