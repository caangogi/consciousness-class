import { AssetEntity, AssetType, BaseAssetProperties } from '@/backend/shared/domain/interfaces/asset.interface';

export interface CoachingProperties extends BaseAssetProperties {
  durationMinutes: number;
  meetingLink?: string;
  price: number;
}

export class CoachingEntity implements AssetEntity {
  public id: string;
  public creatorUid: string;
  public title: string;
  public shortDescription: string;
  public coverUrl: string | null;
  public status: 'draft' | 'published' | 'archived' | 'in_review';
  public createdAt: Date;
  public updatedAt: Date;
  
  public durationMinutes: number;
  public meetingLink: string | null;
  public price: number;

  constructor(properties: CoachingProperties) {
    this.id = properties.id;
    this.creatorUid = properties.creatorUid;
    this.title = properties.title;
    this.shortDescription = properties.shortDescription;
    this.coverUrl = properties.coverUrl || null;
    this.status = properties.status;
    this.createdAt = new Date(properties.createdAt);
    this.updatedAt = new Date(properties.updatedAt);
    this.durationMinutes = properties.durationMinutes;
    this.meetingLink = properties.meetingLink || null;
    this.price = properties.price;
  }

  static create(input: Omit<CoachingProperties, 'id' | 'createdAt' | 'updatedAt' | 'status'> & { id?: string }): CoachingEntity {
    const now = new Date();
    return new CoachingEntity({
      ...input,
      id: input.id || crypto.randomUUID(),
      status: 'draft',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });
  }

  getAssetType(): AssetType { return 'coaching'; }
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
      durationMinutes: this.durationMinutes,
      meetingLink: this.meetingLink,
      price: this.price,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString()
    };
  }
}

