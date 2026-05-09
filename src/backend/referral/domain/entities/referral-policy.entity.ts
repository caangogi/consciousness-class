export interface ReferralPolicy {
  isAffiliationEnabled: boolean;
  commissionType: 'percentage' | 'fixed';
  level1Rate: number; // e.g., 30 for 30% or $30
  level2Rate: number; // e.g., 10 for 10% or $10 (0 means single-tier)
}

export const DEFAULT_REFERRAL_POLICY: ReferralPolicy = {
  isAffiliationEnabled: false,
  commissionType: 'percentage',
  level1Rate: 30,
  level2Rate: 0,
};
