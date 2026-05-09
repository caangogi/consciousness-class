import { adminDb } from '@/lib/firebase/admin';
import { FirebaseEnrollmentRepository } from '@/backend/enrollment/infrastructure/repositories/firebase-enrollment.repository';

const enrollmentRepo = new FirebaseEnrollmentRepository();

/**
 * Checks if a user is a member of a community.
 * Priority order:
 *   1. inscripciones subcollection (free join or paid via new checkout)
 *   2. Active Stripe subscription to linkedMembershipId
 */
export async function isCommunityMember(uid: string, communityId: string, communityData: FirebaseFirestore.DocumentData): Promise<boolean> {
  // Creator always has access
  if (communityData.creatorUid === uid) return true;

  // 1. Check inscripciones subcollection (the canonical source)
  const enrolled = await enrollmentRepo.isEnrolled(uid, communityId);
  if (enrolled) return true;

  // 2. Check if user has an active subscription to the linked membership
  if (communityData.linkedMembershipId) {
    // Also check if enrolled in the linked membership
    const membershipEnrolled = await enrollmentRepo.isEnrolled(uid, communityData.linkedMembershipId);
    if (membershipEnrolled) return true;

    // Check active Stripe subscription
    const subsRef = adminDb.collection('usuarios').doc(uid).collection('suscripciones');
    const subSnap = await subsRef
      .where('courseId', '==', communityData.linkedMembershipId)
      .where('status', 'in', ['active', 'trialing'])
      .limit(1)
      .get();
    if (!subSnap.empty) return true;
  }

  return false;
}
