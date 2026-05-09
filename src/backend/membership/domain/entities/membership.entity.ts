import { AssetEntity, AssetType, BaseAssetProperties } from '@/backend/shared/domain/interfaces/asset.interface';

export interface MembershipProperties extends BaseAssetProperties {
  billingInterval: 'monthly' | 'yearly';
  trialDays: number;
  price: number;
}

export class MembershipEntity implements AssetEntity {
  public id: string;
  public creatorUid: string;
  public title: string;
  public shortDescription: string;
  public coverUrl: string | null;
  public status: 'draft' | 'published' | 'archived' | 'in_review';
  public createdAt: Date;
  public updatedAt: Date;
  
  public billingInterval: 'monthly' | 'yearly';
  public trialDays: number;
  public price: number;

  constructor(properties: MembershipProperties) {
    this.id = properties.id;
    this.creatorUid = properties.creatorUid;
    this.title = properties.title;
    this.shortDescription = properties.shortDescription;
    this.coverUrl = properties.coverUrl || null;
    this.status = properties.status;
    this.createdAt = new Date(properties.createdAt);
    this.updatedAt = new Date(properties.updatedAt);
    this.billingInterval = properties.billingInterval;
    this.trialDays = properties.trialDays;
    this.price = properties.price;
  }

  static create(input: Omit<MembershipProperties, 'id' | 'createdAt' | 'updatedAt' | 'status'> & { id?: string }): MembershipEntity {
    const now = new Date();
    return new MembershipEntity({
      ...input,
      id: input.id || crypto.randomUUID(),
      status: 'draft',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });
  }

  getAssetType(): AssetType { return 'membership'; }
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
      billingInterval: this.billingInterval,
      trialDays: this.trialDays,
      price: this.price,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString()
    };
  }
}

