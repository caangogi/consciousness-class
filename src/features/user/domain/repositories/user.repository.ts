
// src/features/user/domain/repositories/user.repository.ts
import type { UserEntity, UserProperties } from '../entities/user.entity';
import type { CourseProperties } from '@/features/course/domain/entities/course.entity';
import type { UserCourseProgressProperties } from '@/features/progress/domain/entities/user-course-progress.entity';

// Define a type for combining course with its progress
export interface EnrolledCourseWithProgress extends CourseProperties {
  progress?: UserCourseProgressProperties;
}

// Define a type for UserEntity that includes its enrolled courses with progress
export interface UserWithEnrolledCourses extends UserEntity {
  enrolledCoursesDetails?: EnrolledCourseWithProgress[];
}


export interface IUserRepository {
  save(user: UserEntity): Promise<void>;
  findByUid(uid: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  findByReferralCode(referralCode: string): Promise<UserEntity | null>;
  update(uid: string, data: Partial<Omit<UserProperties, 'uid' | 'email' | 'createdAt' | 'referralCodeGenerated' | 'cursosComprados' | 'referidosExitosos' | 'balanceCredito' | 'referredBy' | 'displayName' | 'cursosInscritos' | 'photoURL' | 'balanceComisionesPendientes' | 'balanceIngresosPendientes' >>): Promise<UserEntity | null>;
  delete(uid: string): Promise<void>;
  addCourseToEnrolled(userId: string, courseId: string): Promise<void>;
  findUserWithEnrolledCoursesAndProgress(uid: string): Promise<UserWithEnrolledCourses | null>;
  incrementSuccessfulReferrals(userId: string): Promise<void>;
  updateReferrerBalance(userId: string, commissionAmount: number): Promise<void>;
  updateCreatorPendingRevenue(creatorUid: string, revenueAmount: number): Promise<void>;
  findAllUsers(limitCount?: number, orderByField?: string, orderDirection?: 'asc' | 'desc'): Promise<UserEntity[]>;
}
