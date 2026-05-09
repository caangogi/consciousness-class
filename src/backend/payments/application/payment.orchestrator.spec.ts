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
});
