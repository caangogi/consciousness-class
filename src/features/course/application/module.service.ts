// src/features/course/application/module.service.ts
import { ModuleEntity, type ModuleProperties } from '@/features/course/domain/entities/module.entity';
import type { IModuleRepository } from '@/features/course/domain/repositories/module.repository';
import type { ICourseRepository } from '@/features/course/domain/repositories/course.repository';
import type { CreateModuleDto } from '@/features/course/infrastructure/dto/create-module.dto';
import type { UpdateModuleDto } from '@/features/course/infrastructure/dto/update-module.dto';

export class ModuleService {
  constructor(
    private readonly moduleRepository: IModuleRepository,
    private readonly courseRepository: ICourseRepository 
  ) {}

  async createModule(courseId: string, dto: CreateModuleDto, creatorUid: string): Promise<ModuleEntity> {
    try {
      const course = await this.courseRepository.findById(courseId);
      if (!course) {
        throw new Error(`Course with ID ${courseId} not found.`);
      }
      if (course.creadorUid !== creatorUid) {
        throw new Error(`Forbidden: User ${creatorUid} is not the creator of course ${courseId}.`);
      }

      const existingModules = await this.moduleRepository.findAllByCourseId(courseId);
      const newModuleOrder = existingModules.length > 0 ? Math.max(...existingModules.map(m => m.orden)) + 1 : 1;

      const moduleEntity = ModuleEntity.create({
        courseId: courseId,
        nombre: dto.nombre,
        descripcion: dto.descripcion || '',
        orden: newModuleOrder,
      });

      await this.moduleRepository.save(moduleEntity);
      
      course.ordenModulos.push(moduleEntity.id);
      await this.courseRepository.save(course);

      console.log(`[ModuleService] Module created successfully for Course ID: ${courseId}, Module ID: ${moduleEntity.id}`);
      return moduleEntity;
    } catch (error: any) {
      console.error(`[ModuleService] Error creating module for Course ID ${courseId}:`, error.message);
      throw new Error(`Failed to create module: ${error.message}`);
    }
  }

  async getModulesByCourseId(courseId: string): Promise<ModuleEntity[]> {
    try {
      const course = await this.courseRepository.findById(courseId);
      if (!course) {
        throw new Error(`Course with ID ${courseId} not found.`);
      }
      return await this.moduleRepository.findAllByCourseId(courseId);
    } catch (error: any) {
      console.error(`[ModuleService] Error fetching modules for Course ID ${courseId}:`, error.message);
      throw new Error(`Failed to fetch modules: ${error.message}`);
    }
  }

  async updateModule(courseId: string, moduleId: string, dto: UpdateModuleDto, updaterUid: string): Promise<ModuleEntity | null> {
    try {
      const course = await this.courseRepository.findById(courseId);
      if (!course) {
        throw new Error(`Course with ID ${courseId} not found.`);
      }
      if (course.creadorUid !== updaterUid) {
        throw new Error(`Forbidden: User ${updaterUid} is not the creator of course ${courseId}.`);
      }

      const moduleToUpdate = await this.moduleRepository.findById(courseId, moduleId);
      if (!moduleToUpdate) {
        throw new Error(`Module with ID ${moduleId} not found in course ${courseId}.`);
      }
      
      const updateData: Partial<Omit<ModuleProperties, 'id' | 'courseId' | 'fechaCreacion' | 'ordenLecciones'>> = {};
      if (dto.nombre !== undefined) updateData.nombre = dto.nombre;
      if (dto.descripcion !== undefined) updateData.descripcion = dto.descripcion;
      // orden is not typically updated directly via this DTO, but through a reorder service

      if (Object.keys(updateData).length === 0) {
        console.warn(`[ModuleService] No update data provided for module ${moduleId}.`);
        return moduleToUpdate;
      }
      
      return await this.moduleRepository.update(courseId, moduleId, updateData);
    } catch (error: any) {
      console.error(`[ModuleService] Error updating module ${moduleId} in course ${courseId}:`, error.message);
      throw error;
    }
  }

  async deleteModule(courseId: string, moduleId: string, creatorUid: string): Promise<void> {
    try {
      const course = await this.courseRepository.findById(courseId);
      if (!course) {
        throw new Error(`Course with ID ${courseId} not found.`);
      }
      if (course.creadorUid !== creatorUid) {
        throw new Error(`Forbidden: User ${creatorUid} is not the creator of course ${courseId}.`);
      }

      const moduleExists = await this.moduleRepository.findById(courseId, moduleId);
      if (!moduleExists) {
        throw new Error(`Module with ID ${moduleId} not found in course ${courseId}.`);
      }

      await this.moduleRepository.delete(courseId, moduleId);
      
      // Remove module from course's order
      course.ordenModulos = course.ordenModulos.filter(id => id !== moduleId);
      await this.courseRepository.save(course);

      console.log(`[ModuleService] Module ${moduleId} deleted successfully from course ${courseId}.`);
    } catch (error: any) {
      console.error(`[ModuleService] Error deleting module ${moduleId} from course ${courseId}:`, error.message);
      throw error; // Re-throw to be caught by API handler
    }
  }
}
