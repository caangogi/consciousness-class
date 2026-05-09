import { ReferralService } from '../../referrals/application/referral.service';
import { ReferralPolicyEntity } from '../../referrals/domain/entities/referral-policy.entity';

// Assuming UserRepository interface has these methods
interface IUserRepository {
  updateCreatorPendingRevenue(creatorUid: string, revenueAmount: number): Promise<void>;
  updateReferrerBalance(referrerUid: string, commissionAmount: number): Promise<void>;
  incrementSuccessfulReferrals(referrerUid: string): Promise<void>;
}

export interface StripePaymentData {
  grossAmount: number;
  currency: string;
  platformFeePercentage: number;
  policy?: ReferralPolicyEntity | null;
  creatorUid: string;
  affiliate1Uid?: string;
  affiliate2Uid?: string;
}

export class PaymentOrchestratorService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly referralService: ReferralService
  ) {}

  /**
   * Distributes funds from a successful Stripe Payment.
   * Calculates platform fee, then calculates splits on the NET amount, 
   * and updates user balances.
   */
  async distributeStripePayment(data: StripePaymentData): Promise<void> {
    const { grossAmount, currency, platformFeePercentage, policy, creatorUid, affiliate1Uid, affiliate2Uid } = data;

    // 1. Calculate Net Amount after Platform Fee
    const platformFee = grossAmount * platformFeePercentage;
    const netAmount = grossAmount - platformFee;

    // 2. Calculate Splits using Referral Service (agnostic of how much is the amount, it just applies percentages)
    let splits: any[] = [];
    if (policy) {
      splits = this.referralService.calculateSplits(
        netAmount,
        currency,
        policy,
        creatorUid,
        affiliate1Uid,
        affiliate2Uid
      );
    } else {
      splits = [{
        destinationAccountId: creatorUid,
        amount: netAmount,
        currency,
        reason: 'creator_payout',
      }];
    }

    // 3. Apply the splits to the respective User Balances
    for (const split of splits) {
      if (split.reason === 'tier1_affiliate' || split.reason === 'tier2_affiliate') {
        await this.userRepository.updateReferrerBalance(split.destinationAccountId, split.amount);
        await this.userRepository.incrementSuccessfulReferrals(split.destinationAccountId);
      } else if (split.reason === 'creator_payout') {
        await this.userRepository.updateCreatorPendingRevenue(split.destinationAccountId, split.amount);
      }
    }
  }
}
