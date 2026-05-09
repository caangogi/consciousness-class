export type BookingStatus =
  | 'pending_payment'
  | 'scheduled'
  | 'completed'
  | 'cancelled'
  | 'no_show';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const NO_SHOW_GRACE_MS = 30 * 60 * 1000;

export interface BookingProperties {
  id: string;
  assetId: string; // ID of the Coaching Asset being booked
  creatorUid: string;
  patientUid: string;
  patientName?: string;
  patientEmail?: string;
  startTime: Date | string;
  endTime: Date | string;
  status: BookingStatus;
  meetLink?: string | null;
  paymentSessionId?: string | null;
  notes?: string | null;
  refundEligible?: boolean | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export class BookingEntity {
  public id: string;
  public assetId: string;
  public creatorUid: string;
  public patientUid: string;
  public patientName: string | null;
  public patientEmail: string | null;
  public startTime: Date;
  public endTime: Date;
  public status: BookingStatus;
  public meetLink: string | null;
  public paymentSessionId: string | null;
  public notes: string | null;
  public refundEligible: boolean | null;
  public createdAt: Date;
  public updatedAt: Date;

  constructor(properties: BookingProperties) {
    this.id = properties.id;
    this.assetId = properties.assetId;
    this.creatorUid = properties.creatorUid;
    this.patientUid = properties.patientUid;
    this.patientName = properties.patientName || null;
    this.patientEmail = properties.patientEmail || null;
    this.startTime = new Date(properties.startTime);
    this.endTime = new Date(properties.endTime);
    this.status = properties.status;
    this.meetLink = properties.meetLink || null;
    this.paymentSessionId = properties.paymentSessionId || null;
    this.notes = properties.notes || null;
    this.refundEligible = properties.refundEligible ?? null;
    this.createdAt = new Date(properties.createdAt);
    this.updatedAt = new Date(properties.updatedAt);
  }

  static create(
    input: Omit<BookingProperties, 'id' | 'createdAt' | 'updatedAt' | 'status'> & {
      status?: BookingStatus;
    }
  ): BookingEntity {
    const now = new Date();
    return new BookingEntity({
      ...input,
      id: crypto.randomUUID(),
      status: input.status || 'pending_payment',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });
  }

  /** pending_payment → scheduled. Throws from any other state. */
  confirm(): void {
    if (this.status !== 'pending_payment') {
      throw new Error(
        `Illegal transition: cannot confirm a booking in status '${this.status}'`
      );
    }
    this.status = 'scheduled';
    this.touch();
  }

  /**
   * pending_payment → cancelled (refundEligible stays null, no payment).
   * scheduled       → cancelled, refundEligible computed vs 24h window.
   * Throws from completed / cancelled / no_show.
   */
  cancel(now: Date): void {
    if (this.status !== 'pending_payment' && this.status !== 'scheduled') {
      throw new Error(
        `Illegal transition: cannot cancel a booking in status '${this.status}'`
      );
    }
    if (this.status === 'scheduled') {
      const msUntilStart = this.startTime.getTime() - now.getTime();
      this.refundEligible = msUntilStart > ONE_DAY_MS;
    }
    this.status = 'cancelled';
    this.touch();
  }

  /** scheduled → completed. Only after endTime. Throws otherwise. */
  complete(now: Date): void {
    if (this.status !== 'scheduled') {
      throw new Error(
        `Illegal transition: cannot complete a booking in status '${this.status}'`
      );
    }
    if (now.getTime() < this.endTime.getTime()) {
      throw new Error('Cannot complete a booking before endTime');
    }
    this.status = 'completed';
    this.touch();
  }

  /** scheduled → no_show. Only ≥30min after endTime (grace period). */
  markNoShow(now: Date): void {
    if (this.status !== 'scheduled') {
      throw new Error(
        `Illegal transition: cannot mark no_show a booking in status '${this.status}'`
      );
    }
    if (now.getTime() < this.endTime.getTime() + NO_SHOW_GRACE_MS) {
      throw new Error('Cannot mark no_show within the 30-minute grace period after endTime');
    }
    this.status = 'no_show';
    this.touch();
  }

  private touch(): void {
    this.updatedAt = new Date();
  }

  toPlainObject(): any {
    return {
      id: this.id,
      assetId: this.assetId,
      creatorUid: this.creatorUid,
      patientUid: this.patientUid,
      patientName: this.patientName,
      patientEmail: this.patientEmail,
      startTime: this.startTime.toISOString(),
      endTime: this.endTime.toISOString(),
      status: this.status,
      meetLink: this.meetLink,
      paymentSessionId: this.paymentSessionId,
      notes: this.notes,
      refundEligible: this.refundEligible,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}
