
// src/features/course/application/lesson.service.ts
import { LessonEntity } from '@/features/course/domain/entities/lesson.entity';
import type { ILessonRepository } from '@/features/course/domain/repositories/lesson.repository';
import type { IModuleRepository } from '@/features/course/domain/repositories/module.repository'; // To update module's lesson order
import type { ICourseRepository } from '@/features/course/domain/repositories/course.repository'; // To verify course creator
import type { CreateLessonDto } from '@/features/course/infrastructure/dto/create-lesson.dto';

export class LessonService {
  constructor(
    private readonly lessonRepository: ILessonRepository,
    private readonly moduleRepository: IModuleRepository,
    private readonly courseRepository: ICourseRepository 
  ) {}

  async createLesson(courseId: string, moduleId: string, dto: CreateLessonDto, creatorUid: string): Promise<LessonEntity> {
    try {
      // 1. Verify course and creator
      const course = await this.courseRepository.findById(courseId);
      if (!course) {
        throw new Error(`Course with ID ${courseId} not found.`);
      }
      if (course.creadorUid !== creatorUid) {
        throw new Error(`Forbidden: User ${creatorUid} is not the creator of course ${courseId}.`);
      }

      // 2. Verify module exists and belongs to the course
      const module = await this.moduleRepository.findById(courseId, moduleId);
      if (!module) {
        throw new Error(`Module with ID ${moduleId} not found in course ${courseId}.`);
      }
      // (Implicitly, if moduleRepository.findById works, it's for that courseId)

      // 3. Determine order for the new lesson
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
      
      // 4. Update module's ordenLecciones
      module.ordenLecciones.push(lessonEntity.id);
      // Potentially sort module.ordenLecciones here if a strict numerical order based on lessonEntity.orden is always needed
      // For now, just appending.
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
        // Optional: Add permission check if requesterUid is provided
        // For example, check if requester is course creator or enrolled student
        // For now, assuming public or creator access has been checked upstream if needed.

        const module = await this.moduleRepository.findById(courseId, moduleId);
        if (!module) {
            throw new Error(`Module with ID ${moduleId} not found in course ${courseId}.`);
        }
        return await this.lessonRepository.findAllByModuleId(courseId, moduleId);
    } catch (error: any) {
        console.error(`[LessonService] Error fetching lessons for Module ID ${moduleId}:`, error.message);
        throw new Error(`Failed to fetch lessons: ${error.message}`);
    }
  }
}
