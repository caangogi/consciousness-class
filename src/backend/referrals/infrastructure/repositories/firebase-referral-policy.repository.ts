import { adminDb } from '@/lib/firebase/admin';
import { ReferralPolicyEntity, ReferralPolicyProperties } from '../../domain/entities/referral-policy.entity';

export class FirebaseReferralPolicyRepository {
  private readonly collectionName = 'referral_policies';

  async getById(id: string): Promise<ReferralPolicyEntity | null> {
    const doc = await adminDb.collection(this.collectionName).doc(id).get();
    if (!doc.exists) return null;
    return new ReferralPolicyEntity(doc.data() as ReferralPolicyProperties);
  }

  async save(entity: ReferralPolicyEntity): Promise<void> {
    const data = entity.toPlainObject();
    await adminDb.collection(this.collectionName).doc(entity.id).set(data, { merge: true });
  }

  async findByCreatorUid(creatorUid: string): Promise<ReferralPolicyEntity[]> {
    const snapshot = await adminDb.collection(this.collectionName)
      .where('creatorUid', '==', creatorUid)
      .orderBy('createdAt', 'desc')
      .get();
    
    return snapshot.docs.map(doc => new ReferralPolicyEntity(doc.data() as ReferralPolicyProperties));
  }
}
