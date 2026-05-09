import { CoachingEntity } from '../domain/entities/coaching.entity';
import { FirebaseCoachingRepository, ICoachingRepository } from '../infrastructure/repositories/firebase-coaching.repository';
import { syncAssetToCatalog } from '@/backend/shared/application/catalog-sync.helper';

export interface CreateCoachingDto {
  title: string;
  shortDescription: string;
  price: number;
  durationMinutes: number;
  meetingLink?: string;
  coverUrl?: string | null;
}

export class CoachingService {
  constructor(private readonly repo: ICoachingRepository) {}

  async create(dto: CreateCoachingDto, creatorUid: string): Promise<CoachingEntity> {
    const entity = CoachingEntity.create({ ...dto, creatorUid });
    await this.repo.save(entity);
    await syncAssetToCatalog(entity, entity.price);
    return entity;
  }

  async findAllByCreator(creatorUid: string): Promise<CoachingEntity[]> {
    return this.repo.findAllByCreator(creatorUid);
  }
}
