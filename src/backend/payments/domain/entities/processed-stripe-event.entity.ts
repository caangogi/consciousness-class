/**
 * Marker that records "we have already processed this Stripe event".
 *
 * The Stripe event ID is the primary key. The atomic insert that gives us
 * idempotency is in the Firestore repo (uses .create() — first writer wins
 * under concurrent re-deliveries).
 */
export interface ProcessedStripeEventProperties {
  id: string;
  eventType: string;
  processedAt: Date | string;
}

export class ProcessedStripeEventEntity {
  public readonly id: string;
  public readonly eventType: string;
  public readonly processedAt: Date;

  private constructor(props: ProcessedStripeEventProperties) {
    this.id = props.id;
    this.eventType = props.eventType;
    this.processedAt = props.processedAt instanceof Date
      ? props.processedAt
      : new Date(props.processedAt);
  }

  static create(input: { id: string; eventType: string }): ProcessedStripeEventEntity {
    if (!input.id || input.id.trim() === '') {
      throw new Error('ProcessedStripeEvent: id is required and cannot be empty');
    }
    if (!input.eventType || input.eventType.trim() === '') {
      throw new Error('ProcessedStripeEvent: eventType is required and cannot be empty');
    }
    return new ProcessedStripeEventEntity({
      id: input.id,
      eventType: input.eventType,
      processedAt: new Date(),
    });
  }

  /** Used to rehydrate from Firestore reads. */
  static fromProperties(props: ProcessedStripeEventProperties): ProcessedStripeEventEntity {
    return new ProcessedStripeEventEntity(props);
  }

  toPlainObject(): { id: string; eventType: string; processedAt: string } {
    return {
      id: this.id,
      eventType: this.eventType,
      processedAt: this.processedAt.toISOString(),
    };
  }
}
