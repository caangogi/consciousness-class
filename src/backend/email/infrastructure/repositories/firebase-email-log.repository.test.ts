/**
 * FirebaseEmailLogRepository tests with a mock Firestore.
 * Test-after rigorous (per documentation/testing-strategy.md).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FirebaseEmailLogRepository } from './firebase-email-log.repository';
import { EmailLogEntity } from '../../domain/entities/email-log.entity';

function makeMockDb() {
  const docs = new Map<string, any>();
  const docMock = (id: string) => ({
    set: vi.fn(async (data: any) => { docs.set(id, data); }),
    get: vi.fn(async () => ({
      exists: docs.has(id),
      data: () => docs.get(id),
    })),
  });
  const collectionMock = {
    doc: vi.fn((id: string) => docMock(id)),
    where: vi.fn(),
  };
  // where().get() returns docs filtered by eventId
  collectionMock.where = vi.fn((field: string, op: string, value: any) => ({
    get: vi.fn(async () => ({
      docs: Array.from(docs.values())
        .filter((d) => d[field] === value)
        .map((d) => ({ data: () => d })),
    })),
  }));
  const db = { collection: vi.fn(() => collectionMock) };
  return { db, docs };
}

describe('FirebaseEmailLogRepository', () => {
  let log: EmailLogEntity;

  beforeEach(() => {
    log = EmailLogEntity.create({
      recipientEmail: 'patient@example.com',
      template: 'booking_confirmed_patient',
      eventId: 'evt_42',
    });
  });

  describe('save()', () => {
    it('writes the plainObject under collection emailLogs with doc id == log.id', async () => {
      const { db } = makeMockDb();
      const repo = new FirebaseEmailLogRepository(db);
      await repo.save(log);
      expect(db.collection).toHaveBeenCalledWith('emailLogs');
    });

    it('is idempotent on repeat saves of the same entity (state mutation case)', async () => {
      const { db, docs } = makeMockDb();
      const repo = new FirebaseEmailLogRepository(db);
      await repo.save(log); // status=pending
      log.markSent('resend_msg_1');
      await repo.save(log); // status=sent → overwrite, no second doc
      expect(docs.size).toBe(1);
      const stored = docs.get(log.id);
      expect(stored.status).toBe('sent');
      expect(stored.providerMessageId).toBe('resend_msg_1');
    });
  });

  describe('findById()', () => {
    it('rehydrates a saved entity', async () => {
      const { db } = makeMockDb();
      const repo = new FirebaseEmailLogRepository(db);
      await repo.save(log);
      const found = await repo.findById(log.id);
      expect(found).not.toBeNull();
      expect(found!.id).toBe(log.id);
      expect(found!.recipientEmail).toBe('patient@example.com');
      expect(found!.status).toBe('pending');
    });

    it('returns null for unknown id', async () => {
      const { db } = makeMockDb();
      const repo = new FirebaseEmailLogRepository(db);
      const found = await repo.findById('does_not_exist');
      expect(found).toBeNull();
    });
  });

  describe('findByEventId()', () => {
    it('returns all logs that share the same eventId (correlation query)', async () => {
      const { db } = makeMockDb();
      const repo = new FirebaseEmailLogRepository(db);

      const log1 = EmailLogEntity.create({
        recipientEmail: 'p1@x.com', template: 't', eventId: 'evt_42',
      });
      const log2 = EmailLogEntity.create({
        recipientEmail: 'p2@x.com', template: 't', eventId: 'evt_42',
      });
      const otherEvent = EmailLogEntity.create({
        recipientEmail: 'p3@x.com', template: 't', eventId: 'evt_99',
      });

      await repo.save(log1);
      await repo.save(log2);
      await repo.save(otherEvent);

      const results = await repo.findByEventId('evt_42');
      expect(results).toHaveLength(2);
      expect(results.map((r) => r.recipientEmail).sort()).toEqual([
        'p1@x.com', 'p2@x.com',
      ]);
    });

    it('returns empty array when no logs match', async () => {
      const { db } = makeMockDb();
      const repo = new FirebaseEmailLogRepository(db);
      const results = await repo.findByEventId('evt_nothing');
      expect(results).toEqual([]);
    });
  });
});
