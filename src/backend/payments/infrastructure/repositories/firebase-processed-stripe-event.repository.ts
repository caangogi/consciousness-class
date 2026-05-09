import { adminDb } from '@/lib/firebase/admin';
import type { ProcessedStripeEventEntity } from '../../domain/entities/processed-stripe-event.entity';
import type { IProcessedStripeEventRepository } from '../../domain/repositories/processed-stripe-event.repository';

const COLLECTION = 'processedStripeEvents';

/** Different Firestore SDK paths surface "already exists" differently. */
function isAlreadyExistsError(err: any): boolean {
  if (!err) return false;
  // gRPC code 6 == ALREADY_EXISTS in google.rpc.Code
  if (err.code === 6) return true;
  // Some SDKs/transport layers surface it as a string code
  if (typeof err.code === 'string' && err.code.toLowerCase() === 'already-exists') return true;
  // Defensive: some wrappers leave the gRPC name in the message
  if (typeof err.message === 'string' && err.message.includes('ALREADY_EXISTS')) return true;
  return false;
}

export class FirebaseProcessedStripeEventRepository
  implements IProcessedStripeEventRepository
{
  // Injectable for tests; defaults to the singleton adminDb.
  constructor(private readonly db: any = adminDb) {}

  async markProcessed(event: ProcessedStripeEventEntity): Promise<boolean> {
    const ref = this.db.collection(COLLECTION).doc(event.id);
    try {
      await ref.create(event.toPlainObject());
      return true;
    } catch (err: any) {
      if (isAlreadyExistsError(err)) return false;
      throw err;
    }
  }
}
