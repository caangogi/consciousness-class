export interface ReferralPolicyProperties {
  id: string;
  creatorUid: string;
  name: string;
  description?: string;
  tier1Percentage: number; // e.g. 30 (for 30%)
  tier2Percentage: number; // e.g. 10 (for 10%)
  isDefault: boolean;
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
}

export class ReferralPolicyEntity {
  public id: string;
  public creatorUid: string;
  public name: string;
  public description?: string;
  public tier1Percentage: number;
  public tier2Percentage: number;
  public isDefault: boolean;
  public createdAt: Date;
  public updatedAt: Date;

  constructor(properties: ReferralPolicyProperties) {
    this.id = properties.id;
    this.creatorUid = properties.creatorUid;
    this.name = properties.name;
    this.description = properties.description;
    
    // Validate percentages
    if (properties.tier1Percentage < 0 || properties.tier1Percentage > 100) {
        throw new Error("Tier 1 percentage must be between 0 and 100");
    }
    if (properties.tier2Percentage < 0 || properties.tier2Percentage > 100) {
        throw new Error("Tier 2 percentage must be between 0 and 100");
    }
    if (properties.tier1Percentage + properties.tier2Percentage > 100) {
        throw new Error("Total referral commission cannot exceed 100%");
    }

    this.tier1Percentage = properties.tier1Percentage;
    this.tier2Percentage = properties.tier2Percentage;
    this.isDefault = properties.isDefault;
    this.createdAt = new Date(properties.createdAt);
    this.updatedAt = new Date(properties.updatedAt);
  }

  toPlainObject(): ReferralPolicyProperties {
    return {
      id: this.id,
      creatorUid: this.creatorUid,
      name: this.name,
      description: this.description,
      tier1Percentage: this.tier1Percentage,
      tier2Percentage: this.tier2Percentage,
      isDefault: this.isDefault,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}
