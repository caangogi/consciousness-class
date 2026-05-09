import type { AssetType } from '@/backend/shared/domain/interfaces/asset.interface';

export type AccessType = 'free' | 'paid_one_time' | 'paid_subscription' | 'admin_grant' | 'legacy';
export type EnrollmentStatus = 'active' | 'revoked' | 'expired';

export interface EnrollmentProperties {
  uid: string;           // User UID (the owner)
  assetId: string;       // ID of the enrolled asset (courseId, communityId, etc.)
  assetType: AssetType;
  accessType: AccessType;
  sourceId: string | null; // catalogItemId, stripeSessionId, or null for free/admin
  enrolledAt: string;    // ISO timestamp
  status: EnrollmentStatus;
}

export class EnrollmentEntity {
  public uid: string;
  public assetId: string;
  public assetType: AssetType;
  public accessType: AccessType;
  public sourceId: string | null;
  public enrolledAt: Date;
  public status: EnrollmentStatus;

  constructor(props: EnrollmentProperties) {
    this.uid = props.uid;
    this.assetId = props.assetId;
    this.assetType = props.assetType;
    this.accessType = props.accessType;
    this.sourceId = props.sourceId ?? null;
    this.enrolledAt = new Date(props.enrolledAt);
    this.status = props.status;
  }

  static create(input: Omit<EnrollmentProperties, 'enrolledAt' | 'status'> & { status?: EnrollmentStatus }): EnrollmentEntity {
    return new EnrollmentEntity({
      ...input,
      status: input.status ?? 'active',
      enrolledAt: new Date().toISOString(),
    });
  }

  isActive(): boolean {
    return this.status === 'active';
  }

  revoke(): EnrollmentEntity {
    return new EnrollmentEntity({ ...this.toPlainObject(), status: 'revoked' });
  }

  toPlainObject(): EnrollmentProperties {
    return {
      uid: this.uid,
      assetId: this.assetId,
      assetType: this.assetType,
      accessType: this.accessType,
      sourceId: this.sourceId,
      enrolledAt: this.enrolledAt.toISOString(),
      status: this.status,
    };
  }
}
