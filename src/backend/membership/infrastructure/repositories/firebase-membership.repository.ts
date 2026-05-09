import { MembershipEntity } from '../../domain/entities/membership.entity';
import type { IDownloadRepository } from '../../download/domain/repositories/download.repository';
import { adminDb } from '@/lib/firebase/admin';
import type { MembershipProperties } from '../../domain/entities/membership.entity';

export interface IMembershipRepository {
  save(m: MembershipEntity): Promise<void>;
  findById(id: string): Promise<MembershipEntity | null>;
  findAllByCreator(creatorUid: string): Promise<MembershipEntity[]>;
}

export class FirebaseMembershipRepository implements IMembershipRepository {
  private readonly col = 'memberships';

  async save(m: MembershipEntity): Promise<void> {
    await adminDb.collection(this.col).doc(m.id).set(m.toPlainObject(), { merge: true });
  }

  async findById(id: string): Promise<MembershipEntity | null> {
    const doc = await adminDb.collection(this.col).doc(id).get();
    if (!doc.exists) return null;
    return new MembershipEntity(doc.data() as MembershipProperties);
  }

  async findAllByCreator(creatorUid: string): Promise<MembershipEntity[]> {
    const snap = await adminDb.collection(this.col).where('creatorUid', '==', creatorUid).orderBy('createdAt', 'desc').get();
    return snap.docs.map((d: any) => new MembershipEntity(d.data() as MembershipProperties));
  }
}
