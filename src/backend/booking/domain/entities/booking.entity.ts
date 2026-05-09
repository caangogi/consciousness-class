export type BookingStatus = 'pending_payment' | 'scheduled' | 'completed' | 'cancelled';

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
  paymentSessionId?: string | null; // For tracking unpaid bookings
  notes?: string | null;
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
    this.createdAt = new Date(properties.createdAt);
    this.updatedAt = new Date(properties.updatedAt);
  }

  static create(input: Omit<BookingProperties, 'id' | 'createdAt' | 'updatedAt' | 'status'> & { status?: BookingStatus }): BookingEntity {
    const now = new Date();
    return new BookingEntity({
      ...input,
      id: crypto.randomUUID(),
      status: input.status || 'pending_payment',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });
  }

  confirm(): void {
    this.status = 'scheduled';
    this.updatedAt = new Date();
  }

  cancel(): void {
    this.status = 'cancelled';
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
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}
