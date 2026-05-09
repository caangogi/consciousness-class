import { CommunityEntity } from '../domain/entities/community.entity';
import { FirebaseCommunityRepository, ICommunityRepository } from '../infrastructure/repositories/firebase-community.repository';
import { syncAssetToCatalog } from '@/backend/shared/application/catalog-sync.helper';

export interface CreateCommunityDto {
  title: string;
  shortDescription: string;
  price: number;
  isPrivate: boolean;
  communityGuidelines?: string;
  coverUrl?: string | null;
}

export class CommunityService {
  constructor(private readonly repo: ICommunityRepository) {}

  async create(dto: CreateCommunityDto, creatorUid: string): Promise<CommunityEntity> {
    const entity = CommunityEntity.create({ ...dto, creatorUid });
    await this.repo.save(entity);
    await syncAssetToCatalog(entity, entity.price);
    return entity;
  }

  async findAllByCreator(creatorUid: string): Promise<CommunityEntity[]> {
    return this.repo.findAllByCreator(creatorUid);
  }
}
