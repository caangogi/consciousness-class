import type { ProcessedStripeEventEntity } from '../entities/processed-stripe-event.entity';

/**
 * Atomic write of a processed Stripe event marker.
 *
 * Implementations MUST guarantee first-writer-wins semantics under concurrent
 * re-deliveries. Returning `false` (already processed) tells the webhook
 * handler to short-circuit with a 200 OK so Stripe stops retrying.
 */
export interface IProcessedStripeEventRepository {
  /**
   * Atomically record that this event has been processed.
   * @returns true if newly inserted (first time), false if it already existed.
   *          Throws on any other infrastructure error.
   */
  markProcessed(event: ProcessedStripeEventEntity): Promise<boolean>;
}
