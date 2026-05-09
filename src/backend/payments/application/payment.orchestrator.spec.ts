import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PaymentOrchestratorService } from './payment.orchestrator.service';
import { ReferralService } from '../../referrals/application/referral.service';
import { ReferralPolicyEntity } from '../../referrals/domain/entities/referral-policy.entity';
import { FundSplit } from '../domain/interfaces/payment-gateway.interface';

// Mock dependencies
const mockUserRepository = {
  updateCreatorPendingRevenue: vi.fn(),
  updateReferrerBalance: vi.fn(),
  incrementSuccessfulReferrals: vi.fn(),
};

const mockReferralService = new ReferralService();

describe('PaymentOrchestratorService', () => {
  let orchestrator: PaymentOrchestratorService;

  beforeEach(() => {
    vi.clearAllMocks();
    orchestrator = new PaymentOrchestratorService(
      mockUserRepository as any,
      mockReferralService
    );
  });

  it('should distribute funds correctly for a purchase with tier 1 and tier 2 affiliates', async () => {
    const policy = new ReferralPolicyEntity({
      id: 'p1', creatorUid: 'c1', name: 'Test', tier1Percentage: 30, tier2Percentage: 10, isDefault: true, createdAt: '', updatedAt: ''
    });

    await orchestrator.distributeStripePayment({
      grossAmount: 100,
      currency: 'eur',
      platformFeePercentage: 0.20, // 20%
      policy,
      creatorUid: 'creator123',
      affiliate1Uid: 'aff1',
      affiliate2Uid: 'aff2'
    });

    // Validations
    // 100 gross. Platform fee = 20. Net to distribute = 80.
    // Tier 1: 30% of 80 = 24
    // Tier 2: 10% of 80 = 8
    // Creator: 60% of 80 = 48

    expect(mockUserRepository.updateReferrerBalance).toHaveBeenCalledWith('aff1', 24);
    expect(mockUserRepository.incrementSuccessfulReferrals).toHaveBeenCalledWith('aff1');
    
    expect(mockUserRepository.updateReferrerBalance).toHaveBeenCalledWith('aff2', 8);
    expect(mockUserRepository.incrementSuccessfulReferrals).toHaveBeenCalledWith('aff2');

    expect(mockUserRepository.updateCreatorPendingRevenue).toHaveBeenCalledWith('creator123', 48);
  });

  it('should distribute funds correctly with only tier 1 affiliate', async () => {
    const policy = new ReferralPolicyEntity({
      id: 'p1', creatorUid: 'c1', name: 'Test', tier1Percentage: 30, tier2Percentage: 10, isDefault: true, createdAt: '', updatedAt: ''
    });

    await orchestrator.distributeStripePayment({
      grossAmount: 100,
      currency: 'eur',
      platformFeePercentage: 0.20,
      policy,
      creatorUid: 'creator123',
      affiliate1Uid: 'aff1'
    });

    // 80 Net. 
    // Tier 1: 30% of 80 = 24
    // Creator: 70% of 80 = 56
    
    expect(mockUserRepository.updateReferrerBalance).toHaveBeenCalledWith('aff1', 24);
    expect(mockUserRepository.incrementSuccessfulReferrals).toHaveBeenCalledWith('aff1');
    expect(mockUserRepository.updateReferrerBalance).not.toHaveBeenCalledWith('aff2', expect.anything());

    expect(mockUserRepository.updateCreatorPendingRevenue).toHaveBeenCalledWith('creator123', 56);
  });

  it('should distribute funds entirely to creator if no affiliates', async () => {
    const policy = new ReferralPolicyEntity({
      id: 'p1', creatorUid: 'c1', name: 'Test', tier1Percentage: 30, tier2Percentage: 10, isDefault: true, createdAt: '', updatedAt: ''
    });

    await orchestrator.distributeStripePayment({
      grossAmount: 100,
      currency: 'eur',
      platformFeePercentage: 0.20,
      policy,
      creatorUid: 'creator123'
    });

    // 80 Net.
    // Creator: 100% of 80 = 80

    expect(mockUserRepository.updateReferrerBalance).not.toHaveBeenCalled();
    expect(mockUserRepository.updateCreatorPendingRevenue).toHaveBeenCalledWith('creator123', 80);
  });

  // ============================================================
  // F1.4a · Edge cases — TDD-strict gaps identified in audit
  // ============================================================
  describe('edge cases (F1.4a)', () => {
    it('throws when policy.tier1 + policy.tier2 + platformFee*100 > 100', async () => {
      // Policy is internally valid (tier1+tier2 = 90 ≤ 100)
      // but combined with a 20% platform fee, total is 110% — illegal.
      const policy = new ReferralPolicyEntity({
        id: 'p_high', creatorUid: 'c1', name: 'Aggressive',
        tier1Percentage: 80, tier2Percentage: 10,
        isDefault: false, createdAt: '', updatedAt: '',
      });

      await expect(
        orchestrator.distributeStripePayment({
          grossAmount: 100,
          currency: 'eur',
          platformFeePercentage: 0.20, // 80 + 10 + 20 = 110%
          policy,
          creatorUid: 'creator123',
          affiliate1Uid: 'aff1',
          affiliate2Uid: 'aff2',
        })
      ).rejects.toThrow(/exceed.*100|sum.*100/i);

      // No writes happened — must fail before touching repo
      expect(mockUserRepository.updateCreatorPendingRevenue).not.toHaveBeenCalled();
      expect(mockUserRepository.updateReferrerBalance).not.toHaveBeenCalled();
    });

    it('accepts the boundary case tier1+tier2+platform = 100 exactly', async () => {
      // 70 + 10 + 20 = 100 — legal, creator gets 0 net but no error.
      const policy = new ReferralPolicyEntity({
        id: 'p_edge', creatorUid: 'c1', name: 'Boundary',
        tier1Percentage: 70, tier2Percentage: 10,
        isDefault: false, createdAt: '', updatedAt: '',
      });

      await orchestrator.distributeStripePayment({
        grossAmount: 100,
        currency: 'eur',
        platformFeePercentage: 0.20,
        policy,
        creatorUid: 'creator123',
        affiliate1Uid: 'aff1',
        affiliate2Uid: 'aff2',
      });

      // 100 gross. platform=20. net=80. tier1=70% of 80=56. tier2=10% of 80=8.
      // creator = 80 - 56 - 8 = 16.
      expect(mockUserRepository.updateReferrerBalance).toHaveBeenCalledWith('aff1', 56);
      expect(mockUserRepository.updateReferrerBalance).toHaveBeenCalledWith('aff2', 8);
      expect(mockUserRepository.updateCreatorPendingRevenue).toHaveBeenCalledWith('creator123', 16);
    });
  });
});
