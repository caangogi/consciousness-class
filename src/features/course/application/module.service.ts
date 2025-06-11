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
      // Ensure course.ordenModulos reflects the numerical order as well, or sort it if necessary
      // For now, just appending. Reorder will handle specific ordering.
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
      // Fetch modules and then sort them according to course.ordenModulos if available
      const modules = await this.moduleRepository.findAllByCourseId(courseId);
      if (course.ordenModulos && course.ordenModulos.length > 0) {
        const orderMap = new Map(course.ordenModulos.map((id, index) => [id, index]));
        return modules.sort((a, b) => {
          const orderA = orderMap.get(a.id);
          const orderB = orderMap.get(b.id);
          if (orderA !== undefined && orderB !== undefined) return orderA - orderB;
          if (orderA !== undefined) return -1; // a comes first if b is not in order list
          if (orderB !== undefined) return 1;  // b comes first if a is not in order list
          return a.orden - b.orden; // Fallback to numerical order
        });
      }
      return modules.sort((a,b) => a.orden - b.orden); // Default sort by numerical order
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

  async reorderLessons(courseId: string, moduleId: string, orderedLessonIds: string[], updaterUid: string): Promise<ModuleEntity | null> {
    try {
        const course = await this.courseRepository.findById(courseId);
        if (!course) {
            throw new Error(`Course with ID ${courseId} not found.`);
        }
        if (course.creadorUid !== updaterUid) {
            throw new Error(`Forbidden: User ${updaterUid} is not the creator of course ${courseId}.`);
        }

        const moduleEntity = await this.moduleRepository.findById(courseId, moduleId);
        if (!moduleEntity) {
            throw new Error(`Module with ID ${moduleId} not found in course ${courseId}.`);
        }
        
        // Basic validation (optional, but good practice)
        const currentLessonIds = moduleEntity.ordenLecciones || [];
        const allExistAndMatch = orderedLessonIds.every(id => currentLessonIds.includes(id)) && orderedLessonIds.length === currentLessonIds.length;
        if (!allExistAndMatch && currentLessonIds.length > 0) {
          // Potentially relax this check if some lessons might not be in ordenLecciones yet due to direct creation
          console.warn(`[ModuleService] Reorder lessons validation issue. Ordered IDs: ${orderedLessonIds}. Current IDs: ${currentLessonIds}`);
        }

        moduleEntity.update({ ordenLecciones: orderedLessonIds });
        await this.moduleRepository.save(moduleEntity);
        console.log(`[ModuleService] Lessons reordered for module ${moduleId} in course ${courseId}. New order: ${orderedLessonIds.join(', ')}`);
        return moduleEntity;
    } catch (error: any) {
        console.error(`[ModuleService] Error reordering lessons for module ID ${moduleId}:`, error.message);
        throw error;
    }
  }
}
