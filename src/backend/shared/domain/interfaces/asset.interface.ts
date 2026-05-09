export type AssetType = 'course' | 'membership' | 'download' | 'podcast' | 'coaching' | 'community';

export interface BaseAssetProperties {
  id: string; // Internal domain ID (e.g., inside /cursos/ collection)
  creatorUid: string;
  title: string;
  shortDescription: string;
  coverUrl?: string | null;
  status: 'draft' | 'published' | 'archived' | 'in_review';
  createdAt: string; 
  updatedAt: string;
}

/**
 * Universal Interface that all asset entities (Course, Podcast, Membership) must implement.
 * This guarantees that the Domain Entity can be safely mapped into a CatalogItem Entity.
 */
export interface AssetEntity {
  id: string;
  creatorUid: string;
  getAssetType(): AssetType;
  getTitle(): string;
  getCoverUrl(): string | null;
  getStatus(): string;
  toPlainObject(): any;
}
