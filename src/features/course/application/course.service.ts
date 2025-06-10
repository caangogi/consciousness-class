
// src/features/course/application/course.service.ts
import { CourseEntity } from '@/features/course/domain/entities/course.entity';
import type { ICourseRepository } from '@/features/course/domain/repositories/course.repository';
import type { CreateCourseDto } from '@/features/course/infrastructure/dto/create-course.dto';

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
}
