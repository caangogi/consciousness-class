import { ReferralPolicyEntity } from '../domain/entities/referral-policy.entity';
import { FundSplit } from '../../payments/domain/interfaces/payment-gateway.interface';

export class ReferralService {
  /**
   * Calculates the exact financial splits based on the referral policy.
   * Note: The platform fee is calculated later by the Orchestrator or PaymentGateway,
   * this service only calculates the Creator and Affiliate splits.
   */
  calculateSplits(
    amount: number,
    currency: string,
    policy: ReferralPolicyEntity,
    creatorAccountId: string,
    affiliateTier1AccountId?: string,
    affiliateTier2AccountId?: string
  ): FundSplit[] {
    const splits: FundSplit[] = [];
    let remainingAmount = amount;

    // 1. Calculate Tier 1 Affiliate (if exists)
    if (affiliateTier1AccountId && policy.tier1Percentage > 0) {
      const tier1Amount = (amount * policy.tier1Percentage) / 100;
      splits.push({
        destinationAccountId: affiliateTier1AccountId,
        amount: tier1Amount,
        currency,
        reason: 'tier1_affiliate',
      });
      remainingAmount -= tier1Amount;
    }

    // 2. Calculate Tier 2 Affiliate (if exists and allowed)
    // Note: Tier 2 is only possible if there is a Tier 1 who referred the buyer.
    if (affiliateTier1AccountId && affiliateTier2AccountId && policy.tier2Percentage > 0) {
      const tier2Amount = (amount * policy.tier2Percentage) / 100;
      splits.push({
        destinationAccountId: affiliateTier2AccountId,
        amount: tier2Amount,
        currency,
        reason: 'tier2_affiliate',
      });
      remainingAmount -= tier2Amount;
    }

    // 3. The remainder goes to the Creator
    if (remainingAmount > 0) {
      splits.push({
        destinationAccountId: creatorAccountId,
        amount: remainingAmount,
        currency,
        reason: 'creator_payout',
      });
    }

    return splits;
  }
}
