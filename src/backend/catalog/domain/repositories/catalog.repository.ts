import { CatalogItemEntity } from '../entities/catalog-item.entity';

export interface ICatalogRepository {
  save(item: CatalogItemEntity): Promise<void>;
  findById(id: string): Promise<CatalogItemEntity | null>;
  findAllByCreator(creatorUid: string): Promise<CatalogItemEntity[]>;
  findByAssetReferenceId(assetReferenceId: string): Promise<CatalogItemEntity | null>;
}
