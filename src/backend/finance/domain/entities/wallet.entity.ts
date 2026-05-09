export type WalletCurrency = 'EUR' | 'USD';

export interface WalletProperties {
  id: string; // usually matches the UID
  uid: string;
  currency: WalletCurrency;
  availableBalance: number;
  pendingBalance: number;
  totalWithdrawn: number;
  createdAt: string;
  updatedAt: string;
}

export class WalletEntity {
  public id: string;
  public uid: string;
  public currency: WalletCurrency;
  public availableBalance: number;
  public pendingBalance: number;
  public totalWithdrawn: number;
  public createdAt: Date;
  public updatedAt: Date;

  constructor(props: WalletProperties) {
    this.id = props.id;
    this.uid = props.uid;
    this.currency = props.currency;
    this.availableBalance = props.availableBalance || 0;
    this.pendingBalance = props.pendingBalance || 0;
    this.totalWithdrawn = props.totalWithdrawn || 0;
    this.createdAt = new Date(props.createdAt);
    this.updatedAt = new Date(props.updatedAt);
  }

  static create(uid: string, currency: WalletCurrency = 'EUR'): WalletEntity {
    const now = new Date().toISOString();
    return new WalletEntity({
      id: uid,
      uid,
      currency,
      availableBalance: 0,
      pendingBalance: 0,
      totalWithdrawn: 0,
      createdAt: now,
      updatedAt: now,
    });
  }

  addPending(amount: number): WalletEntity {
    return new WalletEntity({
      ...this.toPlainObject(),
      pendingBalance: this.pendingBalance + amount,
      updatedAt: new Date().toISOString(),
    });
  }

  clearPending(amount: number): WalletEntity {
    return new WalletEntity({
      ...this.toPlainObject(),
      pendingBalance: Math.max(0, this.pendingBalance - amount),
      availableBalance: this.availableBalance + amount,
      updatedAt: new Date().toISOString(),
    });
  }

  withdraw(amount: number): WalletEntity {
    if (this.availableBalance < amount) throw new Error('Saldo insuficiente para retiro');
    return new WalletEntity({
      ...this.toPlainObject(),
      availableBalance: this.availableBalance - amount,
      totalWithdrawn: this.totalWithdrawn + amount,
      updatedAt: new Date().toISOString(),
    });
  }

  toPlainObject(): WalletProperties {
    return {
      id: this.id,
      uid: this.uid,
      currency: this.currency,
      availableBalance: this.availableBalance,
      pendingBalance: this.pendingBalance,
      totalWithdrawn: this.totalWithdrawn,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}
