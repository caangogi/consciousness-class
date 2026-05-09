import { AssetEntity, AssetType, BaseAssetProperties } from '@/backend/shared/domain/interfaces/asset.interface';

export interface PodcastProperties extends BaseAssetProperties {
  rssFeedUrl?: string;
  totalEpisodes: number;
  price: number;
}

export class PodcastEntity implements AssetEntity {
  public id: string;
  public creatorUid: string;
  public title: string;
  public shortDescription: string;
  public coverUrl: string | null;
  public status: 'draft' | 'published' | 'archived' | 'in_review';
  public createdAt: Date;
  public updatedAt: Date;
  
  public rssFeedUrl: string | null;
  public totalEpisodes: number;
  public price: number;

  constructor(properties: PodcastProperties) {
    this.id = properties.id;
    this.creatorUid = properties.creatorUid;
    this.title = properties.title;
    this.shortDescription = properties.shortDescription;
    this.coverUrl = properties.coverUrl || null;
    this.status = properties.status;
    this.createdAt = new Date(properties.createdAt);
    this.updatedAt = new Date(properties.updatedAt);
    this.rssFeedUrl = properties.rssFeedUrl || null;
    this.totalEpisodes = properties.totalEpisodes;
    this.price = properties.price;
  }

  static create(input: Omit<PodcastProperties, 'id' | 'createdAt' | 'updatedAt' | 'status'> & { id?: string }): PodcastEntity {
    const now = new Date();
    return new PodcastEntity({
      ...input,
      id: input.id || crypto.randomUUID(),
      status: 'draft',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });
  }

  getAssetType(): AssetType { return 'podcast'; }
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
      rssFeedUrl: this.rssFeedUrl,
      totalEpisodes: this.totalEpisodes,
      price: this.price,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString()
    };
  }
}

