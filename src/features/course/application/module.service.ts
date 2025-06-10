// src/features/course/application/module.service.ts
import { ModuleEntity } from '@/features/course/domain/entities/module.entity';
import type { IModuleRepository } from '@/features/course/domain/repositories/module.repository';
import type { ICourseRepository } from '@/features/course/domain/repositories/course.repository';
import type { CreateModuleDto } from '@/features/course/infrastructure/dto/create-module.dto';

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
      
      // Update course with new module ID in ordenModulos
      course.ordenModulos.push(moduleEntity.id);
      // Ensure ordenModulos is sorted if order matters based on moduleEntity.orden (which it should)
      // For now, just appending. A more robust solution might re-fetch all modules and sort their IDs
      // or sort based on the 'orden' property of the modules themselves.
      // Let's refine if needed, for now, append works with order being module.orden
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
        // Or return empty array if preferred, but erroring makes it clear course doesn't exist.
        throw new Error(`Course with ID ${courseId} not found.`);
      }
      // Optionally verify user permission to view modules if needed for some roles
      
      return await this.moduleRepository.findAllByCourseId(courseId);
    } catch (error: any) {
      console.error(`[ModuleService] Error fetching modules for Course ID ${courseId}:`, error.message);
      throw new Error(`Failed to fetch modules: ${error.message}`);
    }
  }
}
