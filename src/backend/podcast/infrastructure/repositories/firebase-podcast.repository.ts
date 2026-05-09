import { PodcastEntity } from '../../domain/entities/podcast.entity';
import { adminDb } from '@/lib/firebase/admin';
import type { PodcastProperties } from '../../domain/entities/podcast.entity';

export interface IPodcastRepository {
  save(p: PodcastEntity): Promise<void>;
  findById(id: string): Promise<PodcastEntity | null>;
  findAllByCreator(creatorUid: string): Promise<PodcastEntity[]>;
}

export class FirebasePodcastRepository implements IPodcastRepository {
  private readonly col = 'podcasts';

  async save(p: PodcastEntity): Promise<void> {
    await adminDb.collection(this.col).doc(p.id).set(p.toPlainObject(), { merge: true });
  }

  async findById(id: string): Promise<PodcastEntity | null> {
    const doc = await adminDb.collection(this.col).doc(id).get();
    if (!doc.exists) return null;
    return new PodcastEntity(doc.data() as PodcastProperties);
  }

  async findAllByCreator(creatorUid: string): Promise<PodcastEntity[]> {
    const snap = await adminDb.collection(this.col).where('creatorUid', '==', creatorUid).orderBy('createdAt', 'desc').get();
    return snap.docs.map((d: any) => new PodcastEntity(d.data() as PodcastProperties));
  }
}
