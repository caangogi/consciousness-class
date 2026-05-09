import { AssetEntity, AssetType, BaseAssetProperties } from '@/backend/shared/domain/interfaces/asset.interface';

export interface CommunityProperties extends BaseAssetProperties {
  isPrivate: boolean;
  communityGuidelines?: string;
  price: number;
  linkedMembershipId?: string | null;
  feedVisibilityDefault?: 'public' | 'members_only';
}

export class CommunityEntity implements AssetEntity {
  public id: string;
  public creatorUid: string;
  public title: string;
  public shortDescription: string;
  public coverUrl: string | null;
  public status: 'draft' | 'published' | 'archived' | 'in_review';
  public createdAt: Date;
  public updatedAt: Date;
  
  public isPrivate: boolean;
  public communityGuidelines: string | null;
  public price: number;
  public linkedMembershipId: string | null;
  public feedVisibilityDefault: 'public' | 'members_only';

  constructor(properties: CommunityProperties) {
    this.id = properties.id;
    this.creatorUid = properties.creatorUid;
    this.title = properties.title;
    this.shortDescription = properties.shortDescription;
    this.coverUrl = properties.coverUrl || null;
    this.status = properties.status;
    this.createdAt = new Date(properties.createdAt);
    this.updatedAt = new Date(properties.updatedAt);
    this.isPrivate = properties.isPrivate;
    this.communityGuidelines = properties.communityGuidelines || null;
    this.price = properties.price;
    this.linkedMembershipId = properties.linkedMembershipId || null;
    this.feedVisibilityDefault = properties.feedVisibilityDefault || 'members_only';
  }

  static create(input: Omit<CommunityProperties, 'id' | 'createdAt' | 'updatedAt' | 'status'> & { id?: string }): CommunityEntity {
    const now = new Date();
    return new CommunityEntity({
      ...input,
      id: input.id || crypto.randomUUID(),
      status: 'draft',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });
  }

  getAssetType(): AssetType { return 'community'; }
  getTitle(): string { return this.title; }
  getCoverUrl(): string | null { return this.coverUrl; }
  getStatus(): string { return this.status; }

  toPlainObject(): any {
    return {
      id: this.id,
      creatorUid: this.creatorUid,
      title: this.title,
      shortDescription: this.shortDescription,
      coverUrl: this.coverUrl,
      status: this.status,
      isPrivate: this.isPrivate,
      communityGuidelines: this.communityGuidelines,
      price: this.price,
      linkedMembershipId: this.linkedMembershipId,
      feedVisibilityDefault: this.feedVisibilityDefault,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString()
    };
  }
}

