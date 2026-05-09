/**
 * BookingEntity state machine — TDD-strict (per documentation/testing-strategy.md).
 *
 * These tests codify the product rules from documentation/index.html · Fase 5.1:
 *
 *   "Transición scheduled → cancelled con <24h debe marcar refundEligible: false"
 *   "Slot no debe ser reservable si solapa con otro booking scheduled"
 *   "no-show solo es transición válida desde scheduled y solo después de slot.endTime"
 *
 * Plus the implicit state-machine rules every booking lifecycle must enforce:
 *   pending_payment → scheduled (only via confirm)
 *   pending_payment → cancelled (free, no refund concern)
 *   scheduled       → completed (only after endTime)
 *   scheduled       → cancelled (calculates refundEligible vs 24h window)
 *   scheduled       → no_show   (only after endTime + 30min buffer)
 *
 * Any other transition MUST throw — silent acceptance of an illegal transition
 * is the kind of bug that causes double-charges, missed refunds, or zombie
 * bookings.
 */
import { describe, it, expect } from 'vitest';
import { BookingEntity, type BookingProperties, type BookingStatus } from './booking.entity';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const MIN = 60 * 1000;

/** Fixed reference "now" so tests are deterministic.
 *  Set in the past so `new Date()` (real time) is always after NOW —
 *  needed by the updatedAt test below. */
const NOW = new Date('2024-01-15T10:00:00Z');

/** Build a booking in any state with a startTime relative to NOW. */
function makeBooking(overrides: {
  status?: BookingStatus;
  startOffsetMs?: number;  // ms from NOW (positive = future)
  durationMs?: number;
} = {}): BookingEntity {
  const startOffset = overrides.startOffsetMs ?? 7 * DAY;
  const duration = overrides.durationMs ?? HOUR;
  const start = new Date(NOW.getTime() + startOffset);
  const end = new Date(start.getTime() + duration);
  return new BookingEntity({
    id: 'b1',
    assetId: 'asset_coaching_1',
    creatorUid: 'creator_1',
    patientUid: 'patient_1',
    patientName: 'Ana',
    patientEmail: 'ana@example.com',
    startTime: start,
    endTime: end,
    status: overrides.status ?? 'pending_payment',
    createdAt: NOW,
    updatedAt: NOW,
  });
}

describe('BookingEntity · state machine', () => {
  // ============================================================
  // Construction defaults
  // ============================================================
  describe('create()', () => {
    it("defaults new bookings to status 'pending_payment'", () => {
      const b = BookingEntity.create({
        assetId: 'asset_1', creatorUid: 'c', patientUid: 'p',
        startTime: new Date(NOW.getTime() + DAY),
        endTime: new Date(NOW.getTime() + DAY + HOUR),
      });
      expect(b.status).toBe('pending_payment');
    });
  });

  // ============================================================
  // confirm(): pending_payment → scheduled (and only that)
  // ============================================================
  describe('confirm()', () => {
    it('transitions pending_payment → scheduled', () => {
      const b = makeBooking({ status: 'pending_payment' });
      b.confirm();
      expect(b.status).toBe('scheduled');
    });

    it.each<BookingStatus>(['scheduled', 'completed', 'cancelled', 'no_show'])(
      'throws when current status is %s (illegal transition)',
      (status) => {
        const b = makeBooking({ status });
        expect(() => b.confirm()).toThrow(/illegal transition/i);
      }
    );
  });

  // ============================================================
  // cancel(): allowed from pending_payment OR scheduled.
  // Refund eligibility depends on remaining time vs 24h window.
  // ============================================================
  describe('cancel()', () => {
    it('cancels from pending_payment without computing refundEligible', () => {
      const b = makeBooking({ status: 'pending_payment', startOffsetMs: 7 * DAY });
      b.cancel(NOW);
      expect(b.status).toBe('cancelled');
      // No payment yet → refund question is moot
      expect(b.refundEligible).toBeNull();
    });

    it('cancels from scheduled with refundEligible=true when >24h to startTime', () => {
      const b = makeBooking({
        status: 'scheduled',
        startOffsetMs: 25 * HOUR, // 25h ahead → eligible
      });
      b.cancel(NOW);
      expect(b.status).toBe('cancelled');
      expect(b.refundEligible).toBe(true);
    });

    it('cancels from scheduled with refundEligible=false when <24h to startTime', () => {
      const b = makeBooking({
        status: 'scheduled',
        startOffsetMs: 23 * HOUR, // 23h ahead → NOT eligible
      });
      b.cancel(NOW);
      expect(b.status).toBe('cancelled');
      expect(b.refundEligible).toBe(false);
    });

    it('treats exactly 24h as NOT eligible (strict > 24h)', () => {
      const b = makeBooking({ status: 'scheduled', startOffsetMs: 24 * HOUR });
      b.cancel(NOW);
      expect(b.refundEligible).toBe(false);
    });

    it.each<BookingStatus>(['completed', 'cancelled', 'no_show'])(
      'throws when current status is %s (cannot cancel a terminal booking)',
      (status) => {
        const b = makeBooking({ status });
        expect(() => b.cancel(NOW)).toThrow(/illegal transition/i);
      }
    );
  });

  // ============================================================
  // complete(): only from scheduled, only after endTime
  // ============================================================
  describe('complete()', () => {
    it('transitions scheduled → completed when called after endTime', () => {
      const b = makeBooking({
        status: 'scheduled',
        startOffsetMs: -2 * HOUR,   // started 2h ago
        durationMs: HOUR,            // ended 1h ago
      });
      b.complete(NOW);
      expect(b.status).toBe('completed');
    });

    it('throws when called before endTime (session not yet finished)', () => {
      const b = makeBooking({
        status: 'scheduled',
        startOffsetMs: HOUR,         // starts in 1h
        durationMs: HOUR,
      });
      expect(() => b.complete(NOW)).toThrow(/before endTime/i);
    });

    it.each<BookingStatus>(['pending_payment', 'cancelled', 'completed', 'no_show'])(
      'throws when current status is %s',
      (status) => {
        const b = makeBooking({ status, startOffsetMs: -2 * HOUR, durationMs: HOUR });
        expect(() => b.complete(NOW)).toThrow(/illegal transition/i);
      }
    );
  });

  // ============================================================
  // markNoShow(): only from scheduled, only after endTime + 30min
  // ============================================================
  describe('markNoShow()', () => {
    it('transitions scheduled → no_show when called >30min after endTime', () => {
      const b = makeBooking({
        status: 'scheduled',
        startOffsetMs: -2 * HOUR,    // started 2h ago
        durationMs: HOUR,             // ended 1h ago
      });
      b.markNoShow(NOW);              // 1h > 30min → OK
      expect(b.status).toBe('no_show');
    });

    it('throws when called within 30min after endTime (still in grace)', () => {
      const b = makeBooking({
        status: 'scheduled',
        startOffsetMs: -75 * MIN,     // started 75min ago
        durationMs: HOUR,              // ended 15min ago → within 30min grace
      });
      expect(() => b.markNoShow(NOW)).toThrow(/grace/i);
    });

    it('throws when called before endTime', () => {
      const b = makeBooking({
        status: 'scheduled',
        startOffsetMs: 30 * MIN,      // hasn't started
        durationMs: HOUR,
      });
      expect(() => b.markNoShow(NOW)).toThrow(/grace|before/i);
    });

    it.each<BookingStatus>(['pending_payment', 'cancelled', 'completed', 'no_show'])(
      'throws when current status is %s',
      (status) => {
        const b = makeBooking({
          status,
          startOffsetMs: -2 * HOUR,
          durationMs: HOUR,
        });
        expect(() => b.markNoShow(NOW)).toThrow(/illegal transition/i);
      }
    );
  });

  // ============================================================
  // updatedAt is bumped on every successful transition
  // ============================================================
  describe('updatedAt', () => {
    it('is bumped after a successful state transition', async () => {
      const b = makeBooking({ status: 'pending_payment' });
      const before = b.updatedAt.getTime();
      // Force at least 1ms gap
      await new Promise((r) => setTimeout(r, 2));
      b.confirm();
      expect(b.updatedAt.getTime()).toBeGreaterThan(before);
    });
  });
});
