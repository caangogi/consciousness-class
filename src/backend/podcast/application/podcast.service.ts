import { PodcastEntity } from '../domain/entities/podcast.entity';
import { FirebasePodcastRepository, IPodcastRepository } from '../infrastructure/repositories/firebase-podcast.repository';
import { syncAssetToCatalog } from '@/backend/shared/application/catalog-sync.helper';

export interface CreatePodcastDto {
  title: string;
  shortDescription: string;
  price: number;
  rssFeedUrl?: string;
  coverUrl?: string | null;
}

export class PodcastService {
  constructor(private readonly repo: IPodcastRepository) {}

  async create(dto: CreatePodcastDto, creatorUid: string): Promise<PodcastEntity> {
    const entity = PodcastEntity.create({ ...dto, creatorUid, totalEpisodes: 0 });
    await this.repo.save(entity);
    await syncAssetToCatalog(entity, entity.price);
    return entity;
  }

  async findAllByCreator(creatorUid: string): Promise<PodcastEntity[]> {
    return this.repo.findAllByCreator(creatorUid);
  }
}
