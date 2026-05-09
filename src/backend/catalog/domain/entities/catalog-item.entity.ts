import { AssetType } from '@/backend/shared/domain/interfaces/asset.interface';

export interface CatalogItemProperties {
  id: string; // The ID of the catalog listing
  assetReferenceId: string; // The ID in the specialized collection (e.g. course.id)
  assetType: AssetType;
  creatorUid: string;
  publicName: string;
  coverUrl?: string | null;
  price: number; 
  currency: string;
  referralPolicyId?: string | null; // Ref to ReferralPolicyEntity
  status: 'draft' | 'published' | 'archived'; // Independent of the asset draft status, this hides it from storefront
  createdAt: string;
  updatedAt: string;
}

/**
 * Entidad Facade. Es lo único que interactúan la tienda virtual (Storefront) y las pasarelas
 * de pago (Stripe) para un checkout universal unificado.
 */
export class CatalogItemEntity {
  public id: string;
  public assetReferenceId: string;
  public assetType: AssetType;
  public creatorUid: string;
  public publicName: string;
  public coverUrl: string | null;
  public price: number;
  public currency: string;
  public referralPolicyId: string | null;
  public status: 'draft' | 'published' | 'archived';
  public createdAt: Date;
  public updatedAt: Date;

  constructor(properties: CatalogItemProperties) {
    this.id = properties.id;
    this.assetReferenceId = properties.assetReferenceId;
    this.assetType = properties.assetType;
    this.creatorUid = properties.creatorUid;
    this.publicName = properties.publicName;
    this.coverUrl = properties.coverUrl || null;
    this.price = properties.price;
    this.currency = properties.currency;
    this.referralPolicyId = properties.referralPolicyId || null;
    this.status = properties.status;
    this.createdAt = new Date(properties.createdAt);
    this.updatedAt = new Date(properties.updatedAt);
  }

  toPlainObject(): CatalogItemProperties {
    return {
      id: this.id,
      assetReferenceId: this.assetReferenceId,
      assetType: this.assetType,
      creatorUid: this.creatorUid,
      publicName: this.publicName,
      coverUrl: this.coverUrl,
      price: this.price,
      currency: this.currency,
      referralPolicyId: this.referralPolicyId,
      status: this.status,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}
