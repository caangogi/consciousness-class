import { describe, it, expect } from 'vitest';
import { ReferralService } from './referral.service';
import { ReferralPolicyEntity } from '../domain/entities/referral-policy.entity';

describe('ReferralService', () => {
  const referralService = new ReferralService();

  const mockPolicy = new ReferralPolicyEntity({
    id: 'policy_1',
    creatorUid: 'creator_1',
    name: 'Standard Policy',
    tier1Percentage: 30, // 30%
    tier2Percentage: 10, // 10%
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const mockZeroPolicy = new ReferralPolicyEntity({
    id: 'policy_zero',
    creatorUid: 'creator_1',
    name: 'Zero Policy',
    tier1Percentage: 0,
    tier2Percentage: 0,
    isDefault: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  it('should calculate splits correctly with both tier 1 and tier 2 affiliates', () => {
    const amount = 100;
    const currency = 'eur';

    const splits = referralService.calculateSplits(
      amount,
      currency,
      mockPolicy,
      'creator_acc_1',
      'affiliate_tier1_acc',
      'affiliate_tier2_acc'
    );

    expect(splits).toHaveLength(3); // Creator, Tier1, Tier2
    
    const tier1Split = splits.find(s => s.reason === 'tier1_affiliate');
    const tier2Split = splits.find(s => s.reason === 'tier2_affiliate');
    const creatorSplit = splits.find(s => s.reason === 'creator_payout');

    expect(tier1Split?.amount).toBe(30); // 30% of 100
    expect(tier1Split?.destinationAccountId).toBe('affiliate_tier1_acc');
    
    expect(tier2Split?.amount).toBe(10); // 10% of 100
    expect(tier2Split?.destinationAccountId).toBe('affiliate_tier2_acc');

    expect(creatorSplit?.amount).toBe(60); // Remaining 60%
    expect(creatorSplit?.destinationAccountId).toBe('creator_acc_1');
  });

  it('should calculate splits correctly with ONLY tier 1 affiliate', () => {
    const amount = 100;
    const splits = referralService.calculateSplits(
      amount,
      'eur',
      mockPolicy,
      'creator_acc_1',
      'affiliate_tier1_acc',
      undefined // No tier 2
    );

    expect(splits).toHaveLength(2); // Creator, Tier1
    
    const tier1Split = splits.find(s => s.reason === 'tier1_affiliate');
    const creatorSplit = splits.find(s => s.reason === 'creator_payout');

    expect(tier1Split?.amount).toBe(30); 
    // Since tier 2 is absent, the creator should keep that 10%, so 100 - 30 = 70.
    expect(creatorSplit?.amount).toBe(70); 
  });

  it('should calculate correctly with NO affiliates (all to creator)', () => {
    const amount = 100;
    const splits = referralService.calculateSplits(
      amount,
      'eur',
      mockPolicy,
      'creator_acc_1',
      undefined,
      undefined
    );

    expect(splits).toHaveLength(1); // Creator only
    const creatorSplit = splits.find(s => s.reason === 'creator_payout');
    expect(creatorSplit?.amount).toBe(100); 
  });

  it('should calculate correctly when policy has 0% commissions', () => {
    const amount = 100;
    const splits = referralService.calculateSplits(
      amount,
      'eur',
      mockZeroPolicy,
      'creator_acc_1',
      'affiliate_tier1_acc',
      'affiliate_tier2_acc'
    );

    expect(splits).toHaveLength(1); // Since amounts are 0, it should probably filter them out or assign all to creator
    const creatorSplit = splits.find(s => s.reason === 'creator_payout');
    expect(creatorSplit?.amount).toBe(100); 
  });
});
