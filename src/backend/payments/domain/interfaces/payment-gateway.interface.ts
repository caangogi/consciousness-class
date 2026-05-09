export interface FundSplit {
  destinationAccountId: string; // e.g. Stripe Connect Account ID or Wallet Address
  amount: number;
  currency: string;
  reason: 'creator_payout' | 'platform_fee' | 'tier1_affiliate' | 'tier2_affiliate';
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  platformFeeAmount?: number;
  error?: string;
}

export interface PaymentGateway {
  /**
   * Procesa un pago principal proveniente del estudiante/comprador.
   * Dependiendo de la pasarela, esto podría retener los fondos o depositarlos directamente al creador.
   */
  processPayment(amount: number, currency: string, sourceToken: string): Promise<PaymentResult>;

  /**
   * Distribuye o liquida fondos basado en las políticas de referidos.
   * Esto soporta pagos abstractos (ej. Acumulativos que luego se pagan en batch, o Stripe Payouts).
   */
  distributeFunds(totalAmount: number, splits: FundSplit[]): Promise<void>;
}
