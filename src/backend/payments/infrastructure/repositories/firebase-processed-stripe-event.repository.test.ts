/**
 * FirebaseProcessedStripeEventRepository — TDD-strict.
 *
 * Atomic insert of a processed Stripe event marker. Uses Firestore's
 * `.create()` (NOT `.set()`) — `.create()` throws ALREADY_EXISTS on duplicate
 * doc id, which is exactly the lock semantics we need: the FIRST writer wins,
 * any concurrent re-delivery sees the duplicate and is told to skip.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FirebaseProcessedStripeEventRepository } from './firebase-processed-stripe-event.repository';
import { ProcessedStripeEventEntity } from '../../domain/entities/processed-stripe-event.entity';

function makeMockDb(createImpl: (data: any) => Promise<any>) {
  const docMock = { create: vi.fn(createImpl) };
  const collectionMock = { doc: vi.fn(() => docMock) };
  const db = { collection: vi.fn(() => collectionMock) };
  return { db, docMock, collectionMock };
}

describe('FirebaseProcessedStripeEventRepository.markProcessed', () => {
  let event: ProcessedStripeEventEntity;

  beforeEach(() => {
    event = ProcessedStripeEventEntity.create({
      id: 'evt_1A2B3C',
      eventType: 'checkout.session.completed',
    });
  });

  it('returns true on first insert and writes the event payload', async () => {
    const { db, docMock, collectionMock } = makeMockDb(() => Promise.resolve());
    const repo = new FirebaseProcessedStripeEventRepository(db as any);

    const result = await repo.markProcessed(event);

    expect(result).toBe(true);
    expect(db.collection).toHaveBeenCalledWith('processedStripeEvents');
    expect(collectionMock.doc).toHaveBeenCalledWith('evt_1A2B3C');
    expect(docMock.create).toHaveBeenCalledTimes(1);
    expect(docMock.create).toHaveBeenCalledWith(event.toPlainObject());
  });

  it('returns false on duplicate (ALREADY_EXISTS) without rethrowing', async () => {
    const alreadyExistsErr: any = new Error('ALREADY_EXISTS');
    alreadyExistsErr.code = 6; // gRPC code for ALREADY_EXISTS
    const { db } = makeMockDb(() => Promise.reject(alreadyExistsErr));
    const repo = new FirebaseProcessedStripeEventRepository(db as any);

    const result = await repo.markProcessed(event);

    expect(result).toBe(false);
  });

  it('also recognizes ALREADY_EXISTS via the textual code field', async () => {
    // Some Firestore SDKs surface the code as the string "already-exists"
    const err: any = new Error('Document already exists');
    err.code = 'already-exists';
    const { db } = makeMockDb(() => Promise.reject(err));
    const repo = new FirebaseProcessedStripeEventRepository(db as any);

    const result = await repo.markProcessed(event);
    expect(result).toBe(false);
  });

  it('re-throws on any other error (e.g. PERMISSION_DENIED, network)', async () => {
    const permErr: any = new Error('PERMISSION_DENIED');
    permErr.code = 7; // gRPC code for PERMISSION_DENIED
    const { db } = makeMockDb(() => Promise.reject(permErr));
    const repo = new FirebaseProcessedStripeEventRepository(db as any);

    await expect(repo.markProcessed(event)).rejects.toThrow(/PERMISSION_DENIED/);
  });
});
