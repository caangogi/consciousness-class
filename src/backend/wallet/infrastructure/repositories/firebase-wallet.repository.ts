import { adminDb } from '@/lib/firebase/admin';
import { WalletEntity } from '@/backend/wallet/domain/entities/wallet.entity';
import { WalletTransactionEntity } from '@/backend/wallet/domain/entities/wallet-transaction.entity';
import * as admin from 'firebase-admin';

export class FirebaseWalletRepository {
  private collection = adminDb.collection('wallets');

  async getWallet(uid: string): Promise<WalletEntity> {
    const doc = await this.collection.doc(uid).get();
    if (!doc.exists) {
      // Auto-create wallet if it doesn't exist
      const newWallet = WalletEntity.create(uid);
      await this.collection.doc(uid).set(newWallet.toPlainObject());
      return newWallet;
    }
    return new WalletEntity(doc.data() as any);
  }

  /**
   * Translates a transaction into a wallet balance update and saves both atomically.
   */
  async processTransaction(transaction: WalletTransactionEntity): Promise<void> {
    const walletRef = this.collection.doc(transaction.walletId);
    const txRef = walletRef.collection('transactions').doc(transaction.id);

    await adminDb.runTransaction(async (t) => {
      const walletDoc = await t.get(walletRef);

      let wallet: WalletEntity;
      if (!walletDoc.exists) {
        wallet = WalletEntity.create(transaction.walletId);
        t.set(walletRef, wallet.toPlainObject());
      } else {
        wallet = new WalletEntity(walletDoc.data() as any);
      }

      // Add as pending balance (since all new transactions entering here start as pending)
      if (transaction.status === 'pending') {
        wallet = wallet.addPending(transaction.amount);
      } else if (transaction.status === 'cleared') {
        // If passed directly as cleared
        wallet = new WalletEntity({
          ...wallet.toPlainObject(),
          availableBalance: wallet.availableBalance + transaction.amount
        });
      }

      t.set(walletRef, wallet.toPlainObject());
      t.set(txRef, transaction.toPlainObject());
    });
  }

  async clearPendingTransaction(walletId: string, transactionId: string): Promise<void> {
    const walletRef = this.collection.doc(walletId);
    const txRef = walletRef.collection('transactions').doc(transactionId);

    await adminDb.runTransaction(async (t) => {
      const txDoc = await t.get(txRef);
      if (!txDoc.exists) throw new Error('Transaction not found');

      const tx = new WalletTransactionEntity(txDoc.data() as any);
      if (tx.status !== 'pending') return; // Already cleared or failed

      const walletDoc = await t.get(walletRef);
      if (!walletDoc.exists) throw new Error('Wallet not found');

      let wallet = new WalletEntity(walletDoc.data() as any);

      const clearedTx = tx.clear();
      wallet = wallet.clearPending(clearedTx.amount);

      t.set(walletRef, wallet.toPlainObject());
      t.set(txRef, clearedTx.toPlainObject());
    });
  }
}
