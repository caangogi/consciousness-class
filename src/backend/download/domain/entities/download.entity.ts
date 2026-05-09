import { AssetEntity, AssetType, BaseAssetProperties } from '@/backend/shared/domain/interfaces/asset.interface';

export interface DownloadProperties extends BaseAssetProperties {
  fileUrl: string;
  fileSizeKB: number;
  price: number;
}

export class DownloadEntity implements AssetEntity {
  public id: string;
  public creatorUid: string;
  public title: string;
  public shortDescription: string;
  public coverUrl: string | null;
  public status: 'draft' | 'published' | 'archived' | 'in_review';
  public createdAt: Date;
  public updatedAt: Date;
  
  public fileUrl: string;
  public fileSizeKB: number;
  public price: number;

  constructor(properties: DownloadProperties) {
    this.id = properties.id;
    this.creatorUid = properties.creatorUid;
    this.title = properties.title;
    this.shortDescription = properties.shortDescription;
    this.coverUrl = properties.coverUrl || null;
    this.status = properties.status;
    this.createdAt = new Date(properties.createdAt);
    this.updatedAt = new Date(properties.updatedAt);
    this.fileUrl = properties.fileUrl;
    this.fileSizeKB = properties.fileSizeKB;
    this.price = properties.price;
  }

  static create(input: Omit<DownloadProperties, 'id' | 'createdAt' | 'updatedAt' | 'status'> & { id?: string }): DownloadEntity {
    const now = new Date();
    return new DownloadEntity({
      ...input,
      id: input.id || crypto.randomUUID(),
      status: 'draft',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });
  }

  getAssetType(): AssetType { return 'download'; }
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
      fileUrl: this.fileUrl,
      fileSizeKB: this.fileSizeKB,
      price: this.price,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString()
    };
  }
}

