import { CommunityEntity } from '../../domain/entities/community.entity';
import { adminDb } from '@/lib/firebase/admin';
import type { CommunityProperties } from '../../domain/entities/community.entity';

export interface ICommunityRepository {
  save(c: CommunityEntity): Promise<void>;
  findById(id: string): Promise<CommunityEntity | null>;
  findAllByCreator(creatorUid: string): Promise<CommunityEntity[]>;
}

export class FirebaseCommunityRepository implements ICommunityRepository {
  private readonly col = 'communities';

  async save(c: CommunityEntity): Promise<void> {
    await adminDb.collection(this.col).doc(c.id).set(c.toPlainObject(), { merge: true });
  }

  async findById(id: string): Promise<CommunityEntity | null> {
    const doc = await adminDb.collection(this.col).doc(id).get();
    if (!doc.exists) return null;
    return new CommunityEntity(doc.data() as CommunityProperties);
  }

  async findAllByCreator(creatorUid: string): Promise<CommunityEntity[]> {
    const snap = await adminDb.collection(this.col).where('creatorUid', '==', creatorUid).orderBy('createdAt', 'desc').get();
    return snap.docs.map((d: any) => new CommunityEntity(d.data() as CommunityProperties));
  }
}
