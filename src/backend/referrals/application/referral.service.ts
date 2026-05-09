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
    if (amount <= 0) {
      throw new Error('Amount must be greater than zero — free or invalid amounts cannot flow through splits');
    }

    const splits: FundSplit[] = [];
    let remainingAmount = amount;

    // 1. Tier 1 Affiliate (if exists). Round to 2 decimals to avoid sub-cent drift.
    if (affiliateTier1AccountId && policy.tier1Percentage > 0) {
      const tier1Amount = round2((amount * policy.tier1Percentage) / 100);
      splits.push({
        destinationAccountId: affiliateTier1AccountId,
        amount: tier1Amount,
        currency,
        reason: 'tier1_affiliate',
      });
      remainingAmount -= tier1Amount;
    }

    // 2. Tier 2 Affiliate (only valid if there is a Tier 1).
    if (affiliateTier1AccountId && affiliateTier2AccountId && policy.tier2Percentage > 0) {
      const tier2Amount = round2((amount * policy.tier2Percentage) / 100);
      splits.push({
        destinationAccountId: affiliateTier2AccountId,
        amount: tier2Amount,
        currency,
        reason: 'tier2_affiliate',
      });
      remainingAmount -= tier2Amount;
    }

    // 3. Creator absorbs the rounding residual so the sum equals `amount` exactly.
    //    Round the residual to 2 decimals to clean up tiny float artifacts (e.g. 59.989999...).
    const creatorAmount = round2(remainingAmount);
    if (creatorAmount > 0) {
      splits.push({
        destinationAccountId: creatorAccountId,
        amount: creatorAmount,
        currency,
        reason: 'creator_payout',
      });
    }

    return splits;
  }
}

/** Round to 2 decimals (half-up). Domain values are EUR/USD-like currencies. */
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
