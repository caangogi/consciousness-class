import type { IDownloadRepository } from '../../domain/repositories/download.repository';
import { DownloadEntity, type DownloadProperties } from '../../domain/entities/download.entity';
import { adminDb } from '@/lib/firebase/admin';

export class FirebaseDownloadRepository implements IDownloadRepository {
  private readonly collectionName = 'downloads';

  async save(download: DownloadEntity): Promise<void> {
    const data = download.toPlainObject();
    await adminDb.collection(this.collectionName).doc(download.id).set(data, { merge: true });
  }

  async findById(id: string): Promise<DownloadEntity | null> {
    const doc = await adminDb.collection(this.collectionName).doc(id).get();
    if (!doc.exists) return null;
    return new DownloadEntity(doc.data() as DownloadProperties);
  }

  async findAllByCreator(creatorUid: string): Promise<DownloadEntity[]> {
    const snapshot = await adminDb.collection(this.collectionName)
      .where('creatorUid', '==', creatorUid)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map((doc: any) => new DownloadEntity(doc.data() as DownloadProperties));
  }

  async delete(id: string): Promise<void> {
    await adminDb.collection(this.collectionName).doc(id).delete();
  }
}
