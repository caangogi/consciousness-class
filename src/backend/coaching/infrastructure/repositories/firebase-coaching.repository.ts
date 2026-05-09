import { CoachingEntity } from '../../domain/entities/coaching.entity';
import { adminDb } from '@/lib/firebase/admin';
import type { CoachingProperties } from '../../domain/entities/coaching.entity';

export interface ICoachingRepository {
  save(c: CoachingEntity): Promise<void>;
  findById(id: string): Promise<CoachingEntity | null>;
  findAllByCreator(creatorUid: string): Promise<CoachingEntity[]>;
}

export class FirebaseCoachingRepository implements ICoachingRepository {
  private readonly col = 'coaching_sessions';

  async save(c: CoachingEntity): Promise<void> {
    await adminDb.collection(this.col).doc(c.id).set(c.toPlainObject(), { merge: true });
  }

  async findById(id: string): Promise<CoachingEntity | null> {
    const doc = await adminDb.collection(this.col).doc(id).get();
    if (!doc.exists) return null;
    return new CoachingEntity(doc.data() as CoachingProperties);
  }

  async findAllByCreator(creatorUid: string): Promise<CoachingEntity[]> {
    const snap = await adminDb.collection(this.col).where('creatorUid', '==', creatorUid).orderBy('createdAt', 'desc').get();
    return snap.docs.map((d: any) => new CoachingEntity(d.data() as CoachingProperties));
  }
}
