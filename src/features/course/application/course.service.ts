// src/features/course/application/course.service.ts
import { CourseEntity, type CourseStatus } from '@/features/course/domain/entities/course.entity';
import type { ICourseRepository } from '@/features/course/domain/repositories/course.repository';
import type { CreateCourseDto } from '@/features/course/infrastructure/dto/create-course.dto';
import type { UpdateCourseDto } from '@/features/course/infrastructure/dto/update-course.dto';

export class CourseService {
  constructor(private readonly courseRepository: ICourseRepository) {}

  async createCourse(dto: CreateCourseDto, creatorUid: string): Promise<CourseEntity> {
    try {
      const courseEntity = CourseEntity.create({
        ...dto,
        creadorUid: creatorUid,
        // Other defaults are set by CourseEntity.create
      });

      await this.courseRepository.save(courseEntity);
      console.log('[CourseService] Course created successfully for UID: ' + creatorUid + ', Course ID: ' + courseEntity.id);
      return courseEntity;
    } catch (error: any) {
      console.error('[CourseService] Error creating course for UID ' + creatorUid + ':', error.message);
      throw new Error('Failed to create course: ' + error.message);
    }
  }

  async getCourseById(id: string): Promise<CourseEntity | null> {
    try {
      return await this.courseRepository.findById(id);
    } catch (error: any) {
      console.error('[CourseService] Error fetching course by ID ' + id + ':', error.message);
      throw new Error('Failed to fetch course: ' + error.message);
    }
  }
  
  async getCoursesByCreator(creatorUid: string): Promise<CourseEntity[]> {
    try {
      return await this.courseRepository.findAllByCreator(creatorUid);
    } catch (error: any) {
      console.error('[CourseService] Error fetching courses for creator UID ' + creatorUid + ':', error.message);
      throw new Error('Failed to fetch courses by creator: ' + error.message);
    }
  }

  async updateCourse(courseId: string, dto: UpdateCourseDto, updaterUid: string): Promise<CourseEntity | null> {
    try {
      const courseEntity = await this.courseRepository.findById(courseId);
      if (!courseEntity) {
        console.warn(`[CourseService] Course not found for update with ID: ${courseId}`);
        return null;
      }

      if (courseEntity.creadorUid !== updaterUid) {
        console.error(`[CourseService] Forbidden: User ${updaterUid} is not the creator of course ${courseId}.`);
        throw new Error('Forbidden: User is not the creator of the course.'); 
      }
      
      // Update properties from DTO if they are provided
      const updateData: Partial<Parameters<typeof courseEntity.update>[0]> = {};
      if (dto.nombre !== undefined) updateData.nombre = dto.nombre;
      if (dto.descripcionCorta !== undefined) updateData.descripcionCorta = dto.descripcionCorta;
      if (dto.descripcionLarga !== undefined) updateData.descripcionLarga = dto.descripcionLarga;
      if (dto.precio !== undefined) updateData.precio = dto.precio;
      if (dto.tipoAcceso !== undefined) updateData.tipoAcceso = dto.tipoAcceso;
      if (dto.categoria !== undefined) updateData.categoria = dto.categoria;
      if (dto.duracionEstimada !== undefined) updateData.duracionEstimada = dto.duracionEstimada;
      if (dto.imagenPortadaUrl !== undefined) updateData.imagenPortadaUrl = dto.imagenPortadaUrl;
      if (dto.dataAiHintImagenPortada !== undefined) updateData.dataAiHintImagenPortada = dto.dataAiHintImagenPortada;
      if (dto.videoTrailerUrl !== undefined) updateData.videoTrailerUrl = dto.videoTrailerUrl;
      if (dto.estado !== undefined) updateData.estado = dto.estado as CourseStatus; // Cast if necessary
      
      if (Object.keys(updateData).length > 0) {
        courseEntity.update(updateData);
        await this.courseRepository.save(courseEntity);
        console.log(`[CourseService] Course ${courseId} updated successfully by UID: ${updaterUid} with data:`, updateData);
      } else {
        console.log(`[CourseService] No update data provided for course ${courseId}.`);
      }
      
      return courseEntity;

    } catch (error: any) {
      console.error(`[CourseService] Error updating course ID ${courseId} by UID ${updaterUid}:`, error.message);
      if (error.message.startsWith('Forbidden:')) {
          throw error;
      }
      throw new Error(`Failed to update course: ${error.message}`);
    }
  }

  async reorderModules(courseId: string, orderedModuleIds: string[], updaterUid: string): Promise<CourseEntity | null> {
    try {
      const courseEntity = await this.courseRepository.findById(courseId);
      if (!courseEntity) {
        throw new Error(`Course with ID ${courseId} not found.`);
      }
      if (courseEntity.creadorUid !== updaterUid) {
        throw new Error(`Forbidden: User ${updaterUid} is not the creator of course ${courseId}.`);
      }

      // Validate that all orderedModuleIds belong to the course (optional, but good practice)
      const currentModuleIds = courseEntity.ordenModulos || [];
      const allExistAndMatch = orderedModuleIds.every(id => currentModuleIds.includes(id)) && orderedModuleIds.length === currentModuleIds.length;
      if (!allExistAndMatch && currentModuleIds.length > 0) { // Only validate if there were modules to begin with
        console.warn(`[CourseService] Reorder validation failed. Ordered IDs: ${orderedModuleIds}. Current IDs: ${currentModuleIds}`);
        // throw new Error('Invalid module IDs provided for reordering.'); // Can be stricter
      }
      
      courseEntity.update({ ordenModulos: orderedModuleIds });
      await this.courseRepository.save(courseEntity);
      console.log(`[CourseService] Modules reordered for course ${courseId} by UID: ${updaterUid}. New order: ${orderedModuleIds.join(', ')}`);
      return courseEntity;
    } catch (error: any) {
      console.error(`[CourseService] Error reordering modules for course ID ${courseId} by UID ${updaterUid}:`, error.message);
      throw error;
    }
  }
}
