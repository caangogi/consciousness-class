
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
    try {
      const user = await this.userRepository.findByUid(userId);
      if (!user) {
        throw new Error(`User with ID ${userId} not found.`);
      }

      const course = await this.courseRepository.findById(courseId);
      if (!course) {
        throw new Error(`Course with ID ${courseId} not found.`);
      }
      
      // For basic enrollment, assume all public courses are enrollable if not already enrolled.
      // Add more checks here if needed (e.g., course capacity, prerequisites, payment status for future)
      if (course.estado !== 'publicado') {
        throw new Error(`Course "${course.nombre}" is not currently available for enrollment.`);
      }

      if (user.cursosInscritos.includes(courseId)) {
        console.warn(`[EnrollmentService] User ${userId} is already enrolled in course ${courseId}.`);
        // Depending on desired behavior, could throw an error or just return successfully
        // For now, let's consider it a successful state if already enrolled, no action needed.
        return; 
      }

      // Perform enrollment operations
      // 1. Add courseId to user's 'cursosInscritos' array
      await this.userRepository.addCourseToEnrolled(userId, courseId);
      
      // 2. Increment 'totalEstudiantes' in the course document
      await this.courseRepository.incrementStudentCount(courseId);

      console.log(`[EnrollmentService] User ${userId} successfully enrolled in course ${courseId}.`);

    } catch (error: any) {
      console.error(`[EnrollmentService] Error enrolling user ${userId} in course ${courseId}:`, error.message);
      // Re-throw the error so the API handler can catch it and send an appropriate response
      throw error; 
    }
  }
}
