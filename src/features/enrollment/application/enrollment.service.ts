
// src/features/enrollment/application/enrollment.service.ts
import type { IUserRepository } from '@/features/user/domain/repositories/user.repository';
import type { ICourseRepository } from '@/features/course/domain/repositories/course.repository';
// import type { IEnrollmentRepository } from '../domain/repositories/enrollment.repository'; // If we had a dedicated enrollment entity/repo

export class EnrollmentService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly courseRepository: ICourseRepository
    // private readonly enrollmentRepository: IEnrollmentRepository // If used
  ) {}

  async enrollStudentToCourse(userId: string, courseId: string): Promise<void> {
    console.log(`[EnrollmentService] Initiating enrollment for User ID: '${userId}' in Course ID: '${courseId}'`);
    try {
      const user = await this.userRepository.findByUid(userId);
      if (!user) {
        console.error(`[EnrollmentService] User with ID ${userId} not found. Enrollment cannot proceed.`);
        throw new Error(`User with ID ${userId} not found.`);
      }
      console.log(`[EnrollmentService] User ${userId} found. Role: ${user.role}, Enrolled Courses (before this enrollment): ${JSON.stringify(user.cursosInscritos)}`);

      const course = await this.courseRepository.findById(courseId);
      if (!course) {
        console.error(`[EnrollmentService] Course with ID ${courseId} not found. Enrollment cannot proceed.`);
        throw new Error(`Course with ID ${courseId} not found.`);
      }
      console.log(`[EnrollmentService] Course ${courseId} found: "${course.nombre}", Status: ${course.estado}, Price: ${course.precio}`);
      
      if (course.estado !== 'publicado') {
        console.warn(`[EnrollmentService] Course "${course.nombre}" (ID: ${courseId}) is not 'publicado' (status: ${course.estado}). Enrollment denied.`);
        throw new Error(`Course "${course.nombre}" is not currently available for enrollment.`);
      }

      if (user.cursosInscritos.includes(courseId)) {
        console.log(`[EnrollmentService] IDEMPOTENCY HANDLED: User ${userId} is already enrolled in course ${courseId}. This is an expected scenario (e.g., webhook retry or repeat purchase). The event is acknowledged as successfully processed, and no database update is necessary.`);
        return; 
      }

      console.log(`[EnrollmentService] Proceeding with enrollment. Calling userRepository.addCourseToEnrolled for User: ${userId}, Course: ${courseId}`);
      await this.userRepository.addCourseToEnrolled(userId, courseId);
      console.log(`[EnrollmentService] userRepository.addCourseToEnrolled COMPLETED for User: ${userId}, Course: ${courseId}`);
      
      console.log(`[EnrollmentService] Calling courseRepository.incrementStudentCount for Course: ${courseId}`);
      await this.courseRepository.incrementStudentCount(courseId);
      console.log(`[EnrollmentService] courseRepository.incrementStudentCount COMPLETED for Course: ${courseId}`);

      console.log(`[EnrollmentService] SUCCESS: User ${userId} successfully enrolled in course ${courseId}. All database operations seem to have completed without explicit errors from repositories.`);

    } catch (error: any) {
      console.error(`[EnrollmentService] CRITICAL ERROR during enrollment for User: ${userId}, Course: ${courseId}. Details:`, error.message, error.stack);
      // Propagate the error so the webhook handler can react (e.g., return 500 to Stripe)
      throw error; 
    }
  }
}
