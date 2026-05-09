import { CatalogItemEntity } from '../domain/entities/catalog-item.entity';
import type { ICatalogRepository } from '../domain/repositories/catalog.repository';
import type { AssetType } from '@/backend/shared/domain/interfaces/asset.interface';

interface SyncCatalogItemDto {
  assetReferenceId: string;
  assetType: AssetType;
  creatorUid: string;
  publicName: string;
  coverUrl?: string | null;
  price: number;
  currency: string;
  status: 'draft' | 'published' | 'archived';
}

export class CatalogService {
  constructor(private readonly catalogRepository: ICatalogRepository) {}

  /**
   * Upserts a catalog item based on its asset reference.
   * If the item doesn't exist, it creates a new unique catalog ID.
   * If it exists, it updates the fields gracefully.
   */
  async syncCatalogItem(dto: SyncCatalogItemDto): Promise<CatalogItemEntity> {
    const existing = await this.catalogRepository.findByAssetReferenceId(dto.assetReferenceId);

    if (existing) {
      existing.publicName = dto.publicName;
      existing.coverUrl = dto.coverUrl || null;
      existing.price = dto.price;
      existing.currency = dto.currency;
      existing.status = dto.status;
      existing.updatedAt = new Date();
      await this.catalogRepository.save(existing);
      return existing;
    } else {
      const crypto = require('crypto');
      const newId = crypto.randomUUID();
      const entity = new CatalogItemEntity({
        id: newId,
        assetReferenceId: dto.assetReferenceId,
        assetType: dto.assetType,
        creatorUid: dto.creatorUid,
        publicName: dto.publicName,
        coverUrl: dto.coverUrl,
        price: dto.price,
        currency: dto.currency,
        status: dto.status,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      await this.catalogRepository.save(entity);
      return entity;
    }
  }

  async getCatalogItemsByCreator(creatorUid: string): Promise<CatalogItemEntity[]> {
    return await this.catalogRepository.findAllByCreator(creatorUid);
  }
}
