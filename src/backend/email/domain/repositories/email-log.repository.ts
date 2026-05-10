import type { EmailLogEntity } from '../entities/email-log.entity';

/**
 * Persistence port for the EmailLog audit trail.
 *
 * `save` is upsert semantics — used both for the initial pending entry and
 * for every subsequent markSent / markFailed / markBounced state change.
 * The infrastructure adapter MUST be idempotent on repeat saves of the
 * same id.
 */
export interface IEmailLogRepository {
  save(log: EmailLogEntity): Promise<void>;
  findById(id: string): Promise<EmailLogEntity | null>;
  /** All log entries originated by the same domain event id (correlation). */
  findByEventId(eventId: string): Promise<EmailLogEntity[]>;
}
