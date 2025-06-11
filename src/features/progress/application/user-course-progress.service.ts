
// src/features/progress/application/user-course-progress.service.ts
import { UserCourseProgressEntity } from '@/features/progress/domain/entities/user-course-progress.entity';
import type { IUserCourseProgressRepository } from '@/features/progress/domain/repositories/user-course-progress.repository';

export class UserCourseProgressService {
  constructor(private readonly progressRepository: IUserCourseProgressRepository) {}

  async getOrCreateProgress(userId: string, courseId: string): Promise<UserCourseProgressEntity> {
    let progress = await this.progressRepository.get(userId, courseId);
    if (!progress) {
      // Pass totalLessonsInCourse as 0 if not readily available here, or fetch it.
      // For getOrCreate, it's okay if percentage is initially 0 if no lessons are completed.
      progress = UserCourseProgressEntity.create(userId, courseId);
      await this.progressRepository.save(progress);
      console.log(`[UserCourseProgressService] Created new progress for user ${userId}, course ${courseId}`);
    }
    return progress;
  }

  async toggleLessonCompletion(
    userId: string,
    courseId: string,
    lessonId: string,
    totalLessonsInCourse: number
  ): Promise<UserCourseProgressEntity> {
    try {
      const progress = await this.getOrCreateProgress(userId, courseId);
      progress.toggleLessonCompletion(lessonId, totalLessonsInCourse);
      await this.progressRepository.save(progress);
      console.log(`[UserCourseProgressService] Toggled lesson ${lessonId} for user ${userId}, course ${courseId}. New progress: ${progress.porcentajeCompletado}%`);
      return progress;
    } catch (error: any) {
      console.error(`[UserCourseProgressService] Error toggling lesson completion for user ${userId}, course ${courseId}, lesson ${lessonId}:`, error.message);
      throw error;
    }
  }

  async getCompletedLessons(userId: string, courseId: string): Promise<Set<string>> {
    try {
      const progress = await this.progressRepository.get(userId, courseId);
      return new Set(progress ? progress.lessonIdsCompletadas : []);
    } catch (error: any) {
      console.error(`[UserCourseProgressService] Error getting completed lessons for user ${userId}, course ${courseId}:`, error.message);
      throw error;
    }
  }
}
