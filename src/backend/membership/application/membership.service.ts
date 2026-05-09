import { MembershipEntity } from '../domain/entities/membership.entity';
import { FirebaseMembershipRepository, IMembershipRepository } from '../infrastructure/repositories/firebase-membership.repository';
import { syncAssetToCatalog } from '@/backend/shared/application/catalog-sync.helper';

export interface CreateMembershipDto {
  title: string;
  shortDescription: string;
  price: number;
  billingInterval: 'monthly' | 'yearly';
  trialDays: number;
  coverUrl?: string | null;
}

export class MembershipService {
  constructor(private readonly repo: IMembershipRepository) {}

  async create(dto: CreateMembershipDto, creatorUid: string): Promise<MembershipEntity> {
    const entity = MembershipEntity.create({ ...dto, creatorUid });
    await this.repo.save(entity);
    await syncAssetToCatalog(entity, entity.price);
    return entity;
  }

  async findAllByCreator(creatorUid: string): Promise<MembershipEntity[]> {
    return this.repo.findAllByCreator(creatorUid);
  }
}
