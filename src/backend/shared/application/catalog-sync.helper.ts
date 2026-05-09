/**
 * Generic helper to build a repository + service + API pattern
 * for any asset type that syncs into the Unified Catalog.
 * Each specific service just imports and extends this pattern.
 */
import { CatalogService } from '@/backend/catalog/application/catalog.service';
import { FirebaseCatalogRepository } from '@/backend/catalog/infrastructure/repositories/firebase-catalog.repository';
import type { AssetEntity } from '@/backend/shared/domain/interfaces/asset.interface';

export async function syncAssetToCatalog(entity: AssetEntity, price: number) {
  const catalogService = new CatalogService(new FirebaseCatalogRepository());
  await catalogService.syncCatalogItem({
    assetReferenceId: entity.id,
    assetType: entity.getAssetType(),
    creatorUid: entity.creatorUid,
    publicName: entity.getTitle(),
    coverUrl: entity.getCoverUrl(),
    price,
    currency: 'USD',
    status: entity.getStatus() === 'published' ? 'published' : (entity.getStatus() === 'archived' ? 'archived' : 'draft'),
  });
}
