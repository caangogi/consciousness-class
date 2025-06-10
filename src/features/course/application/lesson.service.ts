
// src/features/course/application/lesson.service.ts
import { LessonEntity } from '@/features/course/domain/entities/lesson.entity';
import type { ILessonRepository } from '@/features/course/domain/repositories/lesson.repository';
import type { IModuleRepository } from '@/features/course/domain/repositories/module.repository';
import type { ICourseRepository } from '@/features/course/domain/repositories/course.repository';
import type { CreateLessonDto } from '@/features/course/infrastructure/dto/create-lesson.dto';
import type { UpdateLessonDto } from '@/features/course/infrastructure/dto/update-lesson.dto'; // Added
import type { ModuleEntity } from '@/features/course/domain/entities/module.entity';


export class LessonService {
  constructor(
    private readonly lessonRepository: ILessonRepository,
    private readonly moduleRepository: IModuleRepository,
    private readonly courseRepository: ICourseRepository 
  ) {}

  private async verifyCourseCreator(courseId: string, userId: string): Promise<void> {
    const course = await this.courseRepository.findById(courseId);
    if (!course) {
      throw new Error(`Course with ID ${courseId} not found.`);
    }
    if (course.creadorUid !== userId) {
      throw new Error(`Forbidden: User ${userId} is not the creator of course ${courseId}.`);
    }
  }

  private async getModuleEnsured(courseId: string, moduleId: string): Promise<ModuleEntity> {
    const module = await this.moduleRepository.findById(courseId, moduleId);
    if (!module) {
      throw new Error(`Module with ID ${moduleId} not found in course ${courseId}.`);
    }
    return module;
  }

  async createLesson(courseId: string, moduleId: string, dto: CreateLessonDto, creatorUid: string): Promise<LessonEntity> {
    try {
      await this.verifyCourseCreator(courseId, creatorUid);
      const module = await this.getModuleEnsured(courseId, moduleId);

      const existingLessons = await this.lessonRepository.findAllByModuleId(courseId, moduleId);
      const newLessonOrder = existingLessons.length > 0 ? Math.max(...existingLessons.map(l => l.orden)) + 1 : 1;

      const lessonEntity = LessonEntity.create({
        courseId: courseId,
        moduleId: moduleId,
        nombre: dto.nombre,
        descripcionBreve: dto.descripcionBreve || '',
        contenidoPrincipal: {
            tipo: dto.contenidoPrincipal.tipo,
            url: dto.contenidoPrincipal.url || null,
            texto: dto.contenidoPrincipal.texto || null,
        },
        duracionEstimada: dto.duracionEstimada,
        esVistaPrevia: dto.esVistaPrevia,
        orden: newLessonOrder,
      });

      await this.lessonRepository.save(lessonEntity);
      
      module.ordenLecciones.push(lessonEntity.id);
      // Potentially sort module.ordenLecciones here if a strict numerical order based on lessonEntity.orden is always needed
      module.ordenLecciones = Array.from(new Set(module.ordenLecciones)); // Ensure uniqueness
      await this.moduleRepository.save(module);

      console.log(`[LessonService] Lesson created successfully for Module ID: ${moduleId}, Lesson ID: ${lessonEntity.id}`);
      return lessonEntity;
    } catch (error: any) {
      console.error(`[LessonService] Error creating lesson for Module ID ${moduleId}:`, error.message);
      throw new Error(`Failed to create lesson: ${error.message}`);
    }
  }

  async getLessonsByModuleId(courseId: string, moduleId: string, requesterUid?: string): Promise<LessonEntity[]> {
    try {
        // If requesterUid is provided, we could check if they are creator or enrolled.
        // For now, we assume access control is handled upstream or lessons are publicly viewable if module is accessible.
        await this.getModuleEnsured(courseId, moduleId); // Ensures module exists in course
        return await this.lessonRepository.findAllByModuleId(courseId, moduleId);
    } catch (error: any) {
        console.error(`[LessonService] Error fetching lessons for Module ID ${moduleId}:`, error.message);
        throw new Error(`Failed to fetch lessons: ${error.message}`);
    }
  }

  async updateLesson(courseId: string, moduleId: string, lessonId: string, dto: UpdateLessonDto, updaterUid: string): Promise<LessonEntity | null> {
    try {
      await this.verifyCourseCreator(courseId, updaterUid);
      await this.getModuleEnsured(courseId, moduleId); // Ensures module and course context is correct

      const lessonToUpdate = await this.lessonRepository.findById(courseId, moduleId, lessonId);
      if (!lessonToUpdate) {
        throw new Error(`Lesson with ID ${lessonId} not found in module ${moduleId}.`);
      }

      // Apply updates from DTO
      const updateData: Partial<Parameters<typeof lessonToUpdate.update>[0]> = {};
      if (dto.nombre !== undefined) updateData.nombre = dto.nombre;
      if (dto.descripcionBreve !== undefined) updateData.descripcionBreve = dto.descripcionBreve;
      if (dto.contenidoPrincipal !== undefined) updateData.contenidoPrincipal = {...lessonToUpdate.contenidoPrincipal, ...dto.contenidoPrincipal};
      if (dto.duracionEstimada !== undefined) updateData.duracionEstimada = dto.duracionEstimada;
      if (dto.esVistaPrevia !== undefined) updateData.esVistaPrevia = dto.esVistaPrevia;
      // 'orden' is typically handled by a reorder service, not direct update here.
      // 'materialesAdicionales' would also be handled separately or merged carefully.
      
      if (Object.keys(updateData).length === 0) {
        console.warn(`[LessonService] No update data provided for lesson ${lessonId}.`);
        return lessonToUpdate;
      }
      
      lessonToUpdate.update(updateData);
      await this.lessonRepository.save(lessonToUpdate);
      
      console.log(`[LessonService] Lesson ${lessonId} updated successfully by UID: ${updaterUid}`);
      return lessonToUpdate;
    } catch (error: any) {
      console.error(`[LessonService] Error updating lesson ${lessonId}:`, error.message);
      throw error;
    }
  }

  async deleteLesson(courseId: string, moduleId: string, lessonId: string, deleterUid: string): Promise<void> {
    try {
      await this.verifyCourseCreator(courseId, deleterUid);
      const module = await this.getModuleEnsured(courseId, moduleId);

      const lessonExists = await this.lessonRepository.findById(courseId, moduleId, lessonId);
      if (!lessonExists) {
        throw new Error(`Lesson with ID ${lessonId} not found in module ${moduleId}.`);
      }

      await this.lessonRepository.delete(courseId, moduleId, lessonId);

      // Update module's lesson order
      module.ordenLecciones = module.ordenLecciones.filter(id => id !== lessonId);
      await this.moduleRepository.save(module);
      
      console.log(`[LessonService] Lesson ${lessonId} deleted successfully from module ${moduleId}.`);
    } catch (error: any) {
      console.error(`[LessonService] Error deleting lesson ${lessonId} from module ${moduleId}:`, error.message);
      throw error;
    }
  }
}
