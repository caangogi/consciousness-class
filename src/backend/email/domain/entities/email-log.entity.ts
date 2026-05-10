/**
 * EmailLogEntity — append-only audit trail of every transactional email
 * the platform attempts to deliver.
 *
 * Why an entity (not just a console.log line):
 *  - Diagnose "I never received the confirmation" tickets without grepping
 *    server logs.
 *  - Compute the Fase 4.1 métrica norte: "% bookings con email entregado <5min".
 *  - Detect bounces / failures and alert the creator in-app (Fase 4.2).
 *  - Enforce per-creator rate limits (Fase 4.2).
 *
 * Lifecycle of a single log entry:
 *   create()  → status='pending', attempts=0
 *   markSent(providerMessageId)  → status='sent',   sentAt=now
 *   markFailed(error)            → status='failed', error stored, attempts++
 *   markBounced(error)           → status='bounced' (terminal — no retry)
 */

export type EmailLogStatus = 'pending' | 'sent' | 'failed' | 'bounced';

export type EmailProvider = 'resend' | 'creator_smtp';

/** Slug identifying which template was used. Constrained at the call site
 *  (handlers know their own template). Typing as `string` here avoids a
 *  circular dep on the templates module. */
export type EmailTemplateSlug = string;

export interface EmailLogProperties {
  id: string;
  recipientEmail: string;
  template: EmailTemplateSlug;
  /** Id of the originating domain event (e.g. Stripe webhook event id),
   *  for correlation with `webhookLogs`. */
  eventId: string | null;
  status: EmailLogStatus;
  provider: EmailProvider;
  /** Id assigned by the email provider (Resend message id). Available
   *  once status === 'sent'. */
  providerMessageId: string | null;
  /** Last error message if status ∈ {'failed', 'bounced'}. */
  error: string | null;
  /** How many delivery attempts have been made. Increments on each retry. */
  attempts: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  sentAt: Date | string | null;
}

export class EmailLogEntity {
  public readonly id: string;
  public readonly recipientEmail: string;
  public readonly template: EmailTemplateSlug;
  public readonly eventId: string | null;
  public status: EmailLogStatus;
  public readonly provider: EmailProvider;
  public providerMessageId: string | null;
  public error: string | null;
  public attempts: number;
  public readonly createdAt: Date;
  public updatedAt: Date;
  public sentAt: Date | null;

  private constructor(props: EmailLogProperties) {
    this.id = props.id;
    this.recipientEmail = props.recipientEmail;
    this.template = props.template;
    this.eventId = props.eventId;
    this.status = props.status;
    this.provider = props.provider;
    this.providerMessageId = props.providerMessageId;
    this.error = props.error;
    this.attempts = props.attempts;
    this.createdAt = props.createdAt instanceof Date ? props.createdAt : new Date(props.createdAt);
    this.updatedAt = props.updatedAt instanceof Date ? props.updatedAt : new Date(props.updatedAt);
    this.sentAt = props.sentAt
      ? (props.sentAt instanceof Date ? props.sentAt : new Date(props.sentAt))
      : null;
  }

  static create(input: {
    recipientEmail: string;
    template: EmailTemplateSlug;
    eventId?: string | null;
    provider?: EmailProvider;
  }): EmailLogEntity {
    if (!input.recipientEmail || input.recipientEmail.trim() === '') {
      throw new Error('EmailLog: recipientEmail is required');
    }
    if (!input.template || input.template.trim() === '') {
      throw new Error('EmailLog: template is required');
    }
    const now = new Date();
    return new EmailLogEntity({
      id: crypto.randomUUID(),
      recipientEmail: input.recipientEmail,
      template: input.template,
      eventId: input.eventId ?? null,
      status: 'pending',
      provider: input.provider ?? 'resend',
      providerMessageId: null,
      error: null,
      attempts: 0,
      createdAt: now,
      updatedAt: now,
      sentAt: null,
    });
  }

  /** pending | failed → sent. Throws from any other state. */
  markSent(providerMessageId: string): void {
    if (this.status !== 'pending' && this.status !== 'failed') {
      throw new Error(`EmailLog: cannot markSent from status '${this.status}'`);
    }
    this.status = 'sent';
    this.providerMessageId = providerMessageId;
    this.error = null;
    this.sentAt = new Date();
    this.attempts += 1;
    this.touch();
  }

  /** pending | failed → failed (allows retry). Increments attempts. */
  markFailed(error: string): void {
    if (this.status !== 'pending' && this.status !== 'failed') {
      throw new Error(`EmailLog: cannot markFailed from status '${this.status}'`);
    }
    this.status = 'failed';
    this.error = error;
    this.attempts += 1;
    this.touch();
  }

  /** Terminal — no further retries. */
  markBounced(error: string): void {
    if (this.status === 'bounced') {
      throw new Error('EmailLog: already bounced');
    }
    this.status = 'bounced';
    this.error = error;
    this.touch();
  }

  /** Used to rehydrate from Firestore reads. */
  static fromProperties(props: EmailLogProperties): EmailLogEntity {
    return new EmailLogEntity(props);
  }

  toPlainObject(): {
    id: string;
    recipientEmail: string;
    template: string;
    eventId: string | null;
    status: EmailLogStatus;
    provider: EmailProvider;
    providerMessageId: string | null;
    error: string | null;
    attempts: number;
    createdAt: string;
    updatedAt: string;
    sentAt: string | null;
  } {
    return {
      id: this.id,
      recipientEmail: this.recipientEmail,
      template: this.template,
      eventId: this.eventId,
      status: this.status,
      provider: this.provider,
      providerMessageId: this.providerMessageId,
      error: this.error,
      attempts: this.attempts,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      sentAt: this.sentAt ? this.sentAt.toISOString() : null,
    };
  }

  private touch(): void {
    this.updatedAt = new Date();
  }
}
