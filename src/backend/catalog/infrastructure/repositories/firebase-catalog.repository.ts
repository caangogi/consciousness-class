import { adminDb } from '@/lib/firebase/admin';
import { CatalogItemEntity, type CatalogItemProperties } from '../../domain/entities/catalog-item.entity';
import type { ICatalogRepository } from '../../domain/repositories/catalog.repository';

export class FirebaseCatalogRepository implements ICatalogRepository {
  private readonly collectionName = 'catalog_items';

  async save(item: CatalogItemEntity): Promise<void> {
    const data = item.toPlainObject();
    await adminDb.collection(this.collectionName).doc(item.id).set(data);
  }

  async findById(id: string): Promise<CatalogItemEntity | null> {
    const doc = await adminDb.collection(this.collectionName).doc(id).get();
    if (!doc.exists) return null;
    return new CatalogItemEntity(doc.data() as CatalogItemProperties);
  }

  async findAllByCreator(creatorUid: string): Promise<CatalogItemEntity[]> {
    const snapshot = await adminDb.collection(this.collectionName)
      .where('creatorUid', '==', creatorUid)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map((doc: any) => new CatalogItemEntity(doc.data() as CatalogItemProperties));
  }

  async findByAssetReferenceId(assetReferenceId: string): Promise<CatalogItemEntity | null> {
    const snapshot = await adminDb.collection(this.collectionName)
      .where('assetReferenceId', '==', assetReferenceId)
      .limit(1)
      .get();
      
    if (snapshot.empty) return null;
    return new CatalogItemEntity(snapshot.docs[0].data() as CatalogItemProperties);
  }
}
