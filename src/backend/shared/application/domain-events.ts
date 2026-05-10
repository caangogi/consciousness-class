/**
 * In-process domain event bus.
 *
 * Pub/sub used to decouple the Stripe webhook handler (and other call sites
 * that mutate domain state) from cross-cutting reactions like sending
 * emails, updating analytics, kicking off CRM workflows, etc.
 *
 * Design choices:
 * - In-process (not Pub/Sub / queue) for MVP. Swappable later — call sites
 *   only depend on the abstract `domainEvents.emit(...)`. Migrating to a
 *   real broker means writing a new bus impl with the same interface.
 * - Failure isolation: a handler that throws does NOT prevent the others
 *   from running, and emit() never throws. A webhook MUST be able to 200
 *   OK to Stripe regardless of how badly the email subscriber is doing.
 * - Await semantics: emit() resolves only AFTER all handlers settle, so
 *   the caller (e.g. the webhook handler) can confidently `await` before
 *   responding to Stripe.
 * - Failures are logged via the F1.5 structured logger so they show up in
 *   Cloud Logging with severity=ERROR.
 *
 * Usage:
 *   import { domainEvents } from '@/backend/shared/application/domain-events';
 *
 *   // At app startup, in subscriber files (e.g. src/lib/email/handlers.ts):
 *   domainEvents.on('booking.confirmed', sendBookingConfirmationEmail);
 *
 *   // At the call site (e.g. webhook handler):
 *   await domainEvents.emit('booking.confirmed', { bookingId, ... });
 */
import { logger } from '@/lib/logger';

// ============================================================================
// Type contract
// ============================================================================

export interface DomainEventPayloads {
  /** A booking has been confirmed (payment captured, slot reserved).
   *  Fired from the Stripe webhook after bookingService.confirmBooking. */
  'booking.confirmed': {
    bookingId: string;
    creatorUid: string;
    patientUid: string;
    patientEmail: string | null;
    startTime: string; // ISO 8601
    endTime: string;   // ISO 8601
    assetId: string;
  };

  /** A booking has been cancelled (by patient, creator, or system).
   *  refundEligible reflects the strict 24h rule from BookingEntity.cancel().
   *  Wiring of the emit() lands in T5.1.3 (cancel endpoint). */
  'booking.cancelled': {
    bookingId: string;
    creatorUid: string;
    patientUid: string;
    patientEmail: string | null;
    refundEligible: boolean | null;
    cancelledBy: 'patient' | 'creator' | 'system';
  };

  /** A new enrollment has been recorded (any asset type).
   *  Fired from the Stripe webhook after enrollmentService.enrollStudentToAsset. */
  'enrollment.created': {
    enrollmentId: string;
    studentUid: string;
    studentEmail: string | null;
    creatorUid: string;
    assetId: string;
    assetType: string; // 'course' | 'membership' | 'coaching' | 'community' | 'podcast' | 'download'
    paymentMode: 'paid_one_time' | 'paid_subscription' | 'free';
  };
}

export type DomainEventName = keyof DomainEventPayloads;

export type DomainEventHandler<E extends DomainEventName> = (
  payload: DomainEventPayloads[E]
) => Promise<void> | void;

// ============================================================================
// Bus
// ============================================================================

export class DomainEventBus {
  private handlers: Map<DomainEventName, Array<DomainEventHandler<any>>> = new Map();

  /** Register a handler for an event. Multiple handlers per event are allowed. */
  on<E extends DomainEventName>(event: E, handler: DomainEventHandler<E>): void {
    const list = this.handlers.get(event) ?? [];
    list.push(handler as DomainEventHandler<any>);
    this.handlers.set(event, list);
  }

  /**
   * Emit an event. Calls every registered handler in parallel, isolates
   * failures, and resolves only after all settle. NEVER throws.
   */
  async emit<E extends DomainEventName>(
    event: E,
    payload: DomainEventPayloads[E]
  ): Promise<void> {
    const list = this.handlers.get(event) ?? [];
    if (list.length === 0) return;

    const results = await Promise.allSettled(
      list.map((handler) => Promise.resolve().then(() => handler(payload)))
    );

    const failures = results.filter(
      (r): r is PromiseRejectedResult => r.status === 'rejected'
    );

    if (failures.length > 0) {
      logger.error(
        `Domain event '${event}' had ${failures.length} handler failure(s)`,
        {
          event,
          totalHandlers: list.length,
          failures: failures.map((f) =>
            f.reason instanceof Error
              ? { name: f.reason.name, message: f.reason.message, stack: f.reason.stack }
              : { reason: String(f.reason) }
          ),
        }
      );
    }
  }

  /** Test helper. NEVER use in production code paths. */
  clear(): void {
    this.handlers.clear();
  }
}

// ============================================================================
// Singleton
// ============================================================================

/**
 * App-wide singleton. Subscribers register against this instance at module
 * load time (e.g. src/lib/email/handlers.ts). Call sites import this and
 * invoke emit().
 */
export const domainEvents = new DomainEventBus();
