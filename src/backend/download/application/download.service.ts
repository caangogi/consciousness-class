import { DownloadEntity } from '../domain/entities/download.entity';
import type { IDownloadRepository } from '../domain/repositories/download.repository';
import type { CreateDownloadDto } from '../infrastructure/dto/create-download.dto';
import { CatalogService } from '@/backend/catalog/application/catalog.service';
import { FirebaseCatalogRepository } from '@/backend/catalog/infrastructure/repositories/firebase-catalog.repository';

export class DownloadService {
  constructor(private readonly downloadRepository: IDownloadRepository) {}

  async createDownload(dto: CreateDownloadDto, creatorUid: string): Promise<DownloadEntity> {
    const downloadEntity = DownloadEntity.create({
      ...dto,
      creatorUid,
    });

    await this.downloadRepository.save(downloadEntity);

    // Sync with Unified Catalog
    const catalogService = new CatalogService(new FirebaseCatalogRepository());
    await catalogService.syncCatalogItem({
      assetReferenceId: downloadEntity.id,
      assetType: 'download',
      creatorUid: downloadEntity.creatorUid,
      publicName: downloadEntity.title,
      coverUrl: downloadEntity.coverUrl,
      price: downloadEntity.price,
      currency: 'USD',
      status: downloadEntity.status === 'published' ? 'published' : (downloadEntity.status === 'archived' ? 'archived' : 'draft'),
    });

    return downloadEntity;
  }

  async getDownloadsByCreator(creatorUid: string): Promise<DownloadEntity[]> {
    return this.downloadRepository.findAllByCreator(creatorUid);
  }
}
