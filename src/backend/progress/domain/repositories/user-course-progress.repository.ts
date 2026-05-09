
// src/features/progress/domain/repositories/user-course-progress.repository.ts
import type { UserCourseProgressEntity } from '../entities/user-course-progress.entity';

export interface IUserCourseProgressRepository {
  get(userId: string, courseId: string): Promise<UserCourseProgressEntity | null>;
  save(progress: UserCourseProgressEntity): Promise<void>;
}
