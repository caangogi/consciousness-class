/**
 * DomainEventBus — TDD-strict.
 *
 * Lightweight in-process pub/sub for domain events. Used by Fase 4.1
 * (transactional email), Fase 5.1 (booking lifecycle UX), Fase 4.2 (CRM
 * triggers), and any future cross-module reaction.
 *
 * Contract pinned by these tests:
 *   - on(event, handler) registers a handler for that event
 *   - emit(event, payload) calls every registered handler with the payload
 *   - All handlers run; if one throws, the others still run, and emit()
 *     does NOT throw (errors are logged via the F1.5 structured logger,
 *     never propagate to the caller — a webhook MUST NOT 500 because the
 *     email handler had a bad day)
 *   - emit() resolves only after every handler settled (so the caller
 *     can await it confidently before returning a response to Stripe)
 *   - emit() with zero handlers registered is a no-op (no crash)
 *   - Multiple handlers per event are supported
 *   - Payload typing is strict (TypeScript surface — checked at compile time
 *     via the DomainEventPayloads map; runtime tests verify the value passes
 *     through unchanged)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DomainEventBus, type DomainEventPayloads } from './domain-events';

describe('DomainEventBus', () => {
  let bus: DomainEventBus;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    bus = new DomainEventBus();
    // The logger writes failures to stderr. Silence it so test output stays clean.
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('on() + emit()', () => {
    it('calls a registered handler with the exact payload', async () => {
      const handler = vi.fn();
      bus.on('enrollment.created', handler);

      const payload: DomainEventPayloads['enrollment.created'] = {
        enrollmentId: 'e_1',
        studentUid: 's_1',
        studentEmail: 's@example.com',
        creatorUid: 'c_1',
        assetId: 'a_1',
        assetType: 'course',
        paymentMode: 'paid_one_time',
      };
      await bus.emit('enrollment.created', payload);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(payload);
    });

    it('calls every handler registered for the same event', async () => {
      const h1 = vi.fn();
      const h2 = vi.fn();
      const h3 = vi.fn();
      bus.on('booking.confirmed', h1);
      bus.on('booking.confirmed', h2);
      bus.on('booking.confirmed', h3);

      await bus.emit('booking.confirmed', {
        bookingId: 'b_1',
        creatorUid: 'c_1',
        patientUid: 'p_1',
        patientEmail: 'p@example.com',
        startTime: '2026-06-01T10:00:00Z',
        endTime: '2026-06-01T11:00:00Z',
        assetId: 'a_1',
      });

      expect(h1).toHaveBeenCalledTimes(1);
      expect(h2).toHaveBeenCalledTimes(1);
      expect(h3).toHaveBeenCalledTimes(1);
    });

    it('does not invoke handlers registered for OTHER events', async () => {
      const bookingHandler = vi.fn();
      const enrollmentHandler = vi.fn();
      bus.on('booking.confirmed', bookingHandler);
      bus.on('enrollment.created', enrollmentHandler);

      await bus.emit('enrollment.created', {
        enrollmentId: 'e_1', studentUid: 's_1', studentEmail: null,
        creatorUid: 'c_1', assetId: 'a_1', assetType: 'course',
        paymentMode: 'paid_one_time',
      });

      expect(enrollmentHandler).toHaveBeenCalledTimes(1);
      expect(bookingHandler).not.toHaveBeenCalled();
    });

    it('is a safe no-op when no handlers are registered for an event', async () => {
      // Must not throw.
      await expect(
        bus.emit('booking.cancelled', {
          bookingId: 'b_1', creatorUid: 'c_1', patientUid: 'p_1',
          patientEmail: null, refundEligible: false, cancelledBy: 'patient',
        })
      ).resolves.toBeUndefined();
    });
  });

  describe('failure isolation', () => {
    it('keeps other handlers running when one throws synchronously', async () => {
      const ok1 = vi.fn();
      const bad = vi.fn(() => { throw new Error('handler exploded'); });
      const ok2 = vi.fn();
      bus.on('enrollment.created', ok1);
      bus.on('enrollment.created', bad);
      bus.on('enrollment.created', ok2);

      await bus.emit('enrollment.created', {
        enrollmentId: 'e_x', studentUid: 's_x', studentEmail: null,
        creatorUid: 'c_x', assetId: 'a_x', assetType: 'course',
        paymentMode: 'free',
      });

      expect(ok1).toHaveBeenCalled();
      expect(bad).toHaveBeenCalled();
      expect(ok2).toHaveBeenCalled();
    });

    it('keeps other handlers running when one rejects asynchronously', async () => {
      const ok = vi.fn(async () => {});
      const bad = vi.fn(async () => { throw new Error('async fail'); });
      bus.on('booking.confirmed', bad);
      bus.on('booking.confirmed', ok);

      await bus.emit('booking.confirmed', {
        bookingId: 'b_1', creatorUid: 'c_1', patientUid: 'p_1',
        patientEmail: null, startTime: 't', endTime: 't', assetId: 'a',
      });

      expect(ok).toHaveBeenCalled();
      expect(bad).toHaveBeenCalled();
    });

    it('emit() resolves WITHOUT throwing even when every handler fails', async () => {
      bus.on('booking.cancelled', () => { throw new Error('one'); });
      bus.on('booking.cancelled', async () => { throw new Error('two'); });

      // emit() must NOT propagate — a webhook handler relies on this so it
      // can still 200 OK back to Stripe.
      await expect(
        bus.emit('booking.cancelled', {
          bookingId: 'b', creatorUid: 'c', patientUid: 'p',
          patientEmail: null, refundEligible: null, cancelledBy: 'system',
        })
      ).resolves.toBeUndefined();
    });

    it('logs failures via the structured logger (so they reach Cloud Logging)', async () => {
      bus.on('enrollment.created', () => { throw new Error('boom'); });
      await bus.emit('enrollment.created', {
        enrollmentId: 'e', studentUid: 's', studentEmail: null,
        creatorUid: 'c', assetId: 'a', assetType: 'course',
        paymentMode: 'free',
      });
      // F1.5 logger routes ERROR to console.error (in dev) and to stderr
      // JSON in prod. Either way, console.error is the channel.
      expect(consoleErrorSpy).toHaveBeenCalled();
      // Must mention the event name + count of failures somewhere in the log.
      const calls = consoleErrorSpy.mock.calls.flat().map(String).join(' ');
      expect(calls).toMatch(/enrollment\.created/);
    });
  });

  describe('await semantics', () => {
    it('waits for all async handlers before resolving', async () => {
      const order: string[] = [];
      bus.on('booking.confirmed', async () => {
        await new Promise(r => setTimeout(r, 10));
        order.push('handler-A');
      });
      bus.on('booking.confirmed', async () => {
        await new Promise(r => setTimeout(r, 5));
        order.push('handler-B');
      });

      await bus.emit('booking.confirmed', {
        bookingId: 'b', creatorUid: 'c', patientUid: 'p',
        patientEmail: null, startTime: 't', endTime: 't', assetId: 'a',
      });
      order.push('after-emit');

      // 'after-emit' must come last — both handlers settled before emit() resolved.
      expect(order).toEqual(expect.arrayContaining(['handler-A', 'handler-B']));
      expect(order[order.length - 1]).toBe('after-emit');
    });
  });
});
