import { FirebaseEnrollmentRepository } from '@/backend/enrollment/infrastructure/repositories/firebase-enrollment.repository';
import { EnrollmentEntity } from '@/backend/enrollment/domain/entities/enrollment.entity';
import type { AssetType } from '@/backend/shared/domain/interfaces/asset.interface';
import type { AccessType } from '@/backend/enrollment/domain/entities/enrollment.entity';

export class EnrollmentService {
  private readonly enrollmentRepo: FirebaseEnrollmentRepository;

  constructor() {
    this.enrollmentRepo = new FirebaseEnrollmentRepository();
  }

  /**
   * Universal enrollment method for any asset type.
   * Idempotent — safe to call multiple times.
   */
  async enrollStudentToAsset(
    uid: string,
    assetId: string,
    assetType: AssetType,
    accessType: AccessType = 'free',
    sourceId: string | null = null
  ): Promise<void> {
    console.log(`[EnrollmentService] Enrolling ${uid} → ${assetType}:${assetId} (${accessType})`);

    const enrollment = EnrollmentEntity.create({
      uid,
      assetId,
      assetType,
      accessType,
      sourceId,
    });

    await this.enrollmentRepo.enroll(enrollment);
    console.log(`[EnrollmentService] ✅ Enrolled ${uid} in ${assetType}:${assetId}`);
  }

  /**
   * Checks if a user has an active enrollment for any asset.
   */
  async isEnrolled(uid: string, assetId: string): Promise<boolean> {
    return this.enrollmentRepo.isEnrolled(uid, assetId);
  }

  /**
   * Returns all active enrollments for a user, optionally filtered by type.
   */
  async getEnrollments(uid: string, assetType?: AssetType): Promise<EnrollmentEntity[]> {
    return this.enrollmentRepo.getEnrollments(uid, assetType);
  }

  /**
   * Legacy method kept for compatibility during transition — proxies to enrollStudentToAsset.
   * @deprecated Use enrollStudentToAsset instead.
   */
  async enrollStudentToCourse(userId: string, courseId: string): Promise<void> {
    await this.enrollStudentToAsset(userId, courseId, 'course', 'paid_one_time', null);
  }
}
