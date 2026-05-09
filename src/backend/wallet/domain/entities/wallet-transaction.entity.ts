export type TransactionType = 'sale' | 'commission_tier_1' | 'commission_tier_2' | 'payout' | 'refund';
export type TransactionStatus = 'pending' | 'cleared' | 'failed';

export interface WalletTransactionProperties {
  id: string;
  walletId: string;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  sourceAssetId?: string;
  relatedStripeChargeId?: string;
  description?: string;
  createdAt: string;
  clearedAt?: string | null;
}

export class WalletTransactionEntity {
  public id: string;
  public walletId: string;
  public type: TransactionType;
  public amount: number;
  public status: TransactionStatus;
  public sourceAssetId?: string;
  public relatedStripeChargeId?: string;
  public description?: string;
  public createdAt: Date;
  public clearedAt?: Date | null;

  constructor(props: WalletTransactionProperties) {
    this.id = props.id;
    this.walletId = props.walletId;
    this.type = props.type;
    this.amount = props.amount;
    this.status = props.status;
    this.sourceAssetId = props.sourceAssetId;
    this.relatedStripeChargeId = props.relatedStripeChargeId;
    this.description = props.description;
    this.createdAt = new Date(props.createdAt);
    this.clearedAt = props.clearedAt ? new Date(props.clearedAt) : null;
  }

  static create(props: Omit<WalletTransactionProperties, 'id' | 'createdAt' | 'status' | 'clearedAt'>): WalletTransactionEntity {
    return new WalletTransactionEntity({
      ...props,
      id: crypto.randomUUID(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
  }

  clear(): WalletTransactionEntity {
    return new WalletTransactionEntity({
      ...this.toPlainObject(),
      status: 'cleared',
      clearedAt: new Date().toISOString(),
    });
  }

  fail(): WalletTransactionEntity {
    return new WalletTransactionEntity({
      ...this.toPlainObject(),
      status: 'failed',
    });
  }

  toPlainObject(): WalletTransactionProperties {
    return {
      id: this.id,
      walletId: this.walletId,
      type: this.type,
      amount: this.amount,
      status: this.status,
      sourceAssetId: this.sourceAssetId,
      relatedStripeChargeId: this.relatedStripeChargeId,
      description: this.description,
      createdAt: this.createdAt.toISOString(),
      clearedAt: this.clearedAt?.toISOString() || null,
    };
  }
}
