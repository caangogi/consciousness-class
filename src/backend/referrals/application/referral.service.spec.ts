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

  // ============================================================
  // F1.4a · Edge cases — TDD-strict gaps identified in audit
  // ============================================================
  describe('edge cases (F1.4a)', () => {
    it('throws when amount is zero (free product must not flow through splits)', () => {
      expect(() =>
        referralService.calculateSplits(
          0, 'eur', mockPolicy, 'creator_acc_1', 'aff1', 'aff2'
        )
      ).toThrow(/amount.*greater than zero/i);
    });

    it('throws when amount is negative (invalid input must fail loud)', () => {
      expect(() =>
        referralService.calculateSplits(
          -50, 'eur', mockPolicy, 'creator_acc_1', 'aff1', 'aff2'
        )
      ).toThrow(/amount.*greater than zero/i);
    });

    it('rounds tier splits to 2 decimals AND creator absorbs the rounding so sum equals amount exactly', () => {
      // amount=99.99, tier1=30%, tier2=10%
      // raw tier1 = 29.997 → round → 30.00
      // raw tier2 =  9.999 → round → 10.00
      // creator = 99.99 - 30.00 - 10.00 = 59.99
      // sum = 99.99 ✅ exact (no lost cents)
      const splits = referralService.calculateSplits(
        99.99, 'eur', mockPolicy, 'creator_acc_1', 'aff1', 'aff2'
      );
      const tier1 = splits.find(s => s.reason === 'tier1_affiliate');
      const tier2 = splits.find(s => s.reason === 'tier2_affiliate');
      const creator = splits.find(s => s.reason === 'creator_payout');

      expect(tier1?.amount).toBe(30.00);
      expect(tier2?.amount).toBe(10.00);
      expect(creator?.amount).toBe(59.99);

      const sum = splits.reduce((acc, s) => acc + s.amount, 0);
      expect(sum).toBeCloseTo(99.99, 10); // exact to 10 decimals
    });

    it('handles a tricky decimal case (7.77 EUR @ 33% tier1) without losing cents', () => {
      const policy33 = new ReferralPolicyEntity({
        id: 'p33', creatorUid: 'c1', name: '33%',
        tier1Percentage: 33, tier2Percentage: 0,
        isDefault: false, createdAt: '', updatedAt: '',
      });
      // raw tier1 = 7.77 * 0.33 = 2.5641 → round → 2.56
      // creator = 7.77 - 2.56 = 5.21
      // sum = 7.77 ✅
      const splits = referralService.calculateSplits(
        7.77, 'eur', policy33, 'creator_acc_1', 'aff1'
      );
      const sum = splits.reduce((acc, s) => acc + s.amount, 0);
      expect(sum).toBeCloseTo(7.77, 10);
    });
  });
});
