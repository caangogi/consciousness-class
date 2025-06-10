// src/features/course/application/course.service.ts
import { CourseEntity } from '@/features/course/domain/entities/course.entity';
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
        // In a real app, throw a specific ForbiddenError or handle appropriately
        throw new Error('Forbidden: User is not the creator of the course.'); 
      }
      
      // Update properties from DTO
      courseEntity.nombre = dto.nombre;
      courseEntity.descripcionCorta = dto.descripcionCorta;
      courseEntity.descripcionLarga = dto.descripcionLarga;
      courseEntity.precio = dto.precio;
      courseEntity.tipoAcceso = dto.tipoAcceso;
      courseEntity.categoria = dto.categoria;
      courseEntity.duracionEstimada = dto.duracionEstimada;
      
      // Mark as updated (entity method should handle this)
      courseEntity.update({}); // Pass empty object or specific DTO fields that `update` handles

      await this.courseRepository.save(courseEntity); // save uses set with merge:true
      console.log(`[CourseService] Course ${courseId} updated successfully by UID: ${updaterUid}`);
      return courseEntity;

    } catch (error: any) {
      console.error(`[CourseService] Error updating course ID ${courseId} by UID ${updaterUid}:`, error.message);
      // Rethrow or handle specific errors
      if (error.message.startsWith('Forbidden:')) {
          throw error;
      }
      throw new Error(`Failed to update course: ${error.message}`);
    }
  }
}
