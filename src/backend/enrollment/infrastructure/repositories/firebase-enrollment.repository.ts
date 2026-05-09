import { adminDb } from '@/lib/firebase/admin';
import { EnrollmentEntity, type EnrollmentProperties } from '@/backend/enrollment/domain/entities/enrollment.entity';
import type { AssetType } from '@/backend/shared/domain/interfaces/asset.interface';

const SUBCOLLECTION = 'inscripciones';

export class FirebaseEnrollmentRepository {
  /**
   * Enrolls a user in an asset. Safe to call multiple times (idempotent via merge).
   * Creates the user document if it doesn't exist yet.
   */
  async enroll(enrollment: EnrollmentEntity): Promise<void> {
    const ref = adminDb
      .collection('usuarios')
      .doc(enrollment.uid)
      .collection(SUBCOLLECTION)
      .doc(enrollment.assetId);

    await ref.set(enrollment.toPlainObject(), { merge: true });
  }

  /**
   * Returns true if the user has an active enrollment for the given assetId.
   */
  async isEnrolled(uid: string, assetId: string): Promise<boolean> {
    const ref = adminDb
      .collection('usuarios')
      .doc(uid)
      .collection(SUBCOLLECTION)
      .doc(assetId);

    const snap = await ref.get();
    if (!snap.exists) return false;

    const data = snap.data() as EnrollmentProperties;
    return data.status === 'active';
  }

  /**
   * Returns all enrollments for a user, optionally filtered by assetType.
   */
  async getEnrollments(uid: string, assetType?: AssetType): Promise<EnrollmentEntity[]> {
    let query = adminDb
      .collection('usuarios')
      .doc(uid)
      .collection(SUBCOLLECTION)
      .where('status', '==', 'active') as FirebaseFirestore.Query;

    if (assetType) {
      query = query.where('assetType', '==', assetType);
    }

    const snap = await query.get();
    return snap.docs.map(doc => new EnrollmentEntity(doc.data() as EnrollmentProperties));
  }

  /**
   * Revokes an enrollment (sets status to 'revoked').
   */
  async revoke(uid: string, assetId: string): Promise<void> {
    const ref = adminDb
      .collection('usuarios')
      .doc(uid)
      .collection(SUBCOLLECTION)
      .doc(assetId);

    await ref.update({ status: 'revoked' });
  }
}
