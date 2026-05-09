/**
 * ProcessedStripeEventEntity — TDD-strict (per documentation/testing-strategy.md).
 *
 * Domain value object that records "we have already processed this Stripe event".
 * The Stripe event ID is the primary key — see the Firestore repo for the
 * atomic upsert that makes idempotency a hard guarantee, not a check-then-act
 * race.
 *
 * F1.4b · audit gap: webhook handler currently has NO idempotency check, so
 * Stripe re-deliveries (which happen on every 5xx response and on transient
 * network errors) re-execute enrollment, payout distribution, and subscription
 * sync — causing double-charges and double-commissions.
 */
import { describe, it, expect } from 'vitest';
import { ProcessedStripeEventEntity } from './processed-stripe-event.entity';

describe('ProcessedStripeEventEntity', () => {
  describe('create()', () => {
    it('builds a valid entity with id, eventType and a fresh processedAt', () => {
      const e = ProcessedStripeEventEntity.create({
        id: 'evt_1Abc23',
        eventType: 'checkout.session.completed',
      });
      expect(e.id).toBe('evt_1Abc23');
      expect(e.eventType).toBe('checkout.session.completed');
      expect(e.processedAt).toBeInstanceOf(Date);
      // freshly stamped, must be within the last second
      expect(Date.now() - e.processedAt.getTime()).toBeLessThan(1000);
    });

    it('throws when id is empty (Stripe event id is mandatory)', () => {
      expect(() =>
        ProcessedStripeEventEntity.create({ id: '', eventType: 'x' })
      ).toThrow(/id.*required|empty/i);
    });

    it('throws when id is only whitespace', () => {
      expect(() =>
        ProcessedStripeEventEntity.create({ id: '   ', eventType: 'x' })
      ).toThrow(/id.*required|empty/i);
    });

    it('throws when eventType is empty', () => {
      expect(() =>
        ProcessedStripeEventEntity.create({ id: 'evt_1', eventType: '' })
      ).toThrow(/eventType.*required|empty/i);
    });
  });

  describe('toPlainObject()', () => {
    it('serializes processedAt as ISO string for Firestore', () => {
      const e = ProcessedStripeEventEntity.create({
        id: 'evt_xyz',
        eventType: 'invoice.payment_succeeded',
      });
      const obj = e.toPlainObject();
      expect(obj.id).toBe('evt_xyz');
      expect(obj.eventType).toBe('invoice.payment_succeeded');
      expect(typeof obj.processedAt).toBe('string');
      // valid ISO 8601
      expect(() => new Date(obj.processedAt)).not.toThrow();
      expect(new Date(obj.processedAt).toISOString()).toBe(obj.processedAt);
    });
  });
});
