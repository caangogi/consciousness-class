export interface TimeSlot {
  start: string; // Format "HH:mm" (24h)
  end: string;   // Format "HH:mm" (24h)
}

export interface DaySchedule {
  active: boolean;
  slots: TimeSlot[];
}

// 0 = Sunday, 1 = Monday, ..., 6 = Saturday
export type WeeklySchedule = Record<number, DaySchedule>;

export interface AvailabilityProperties {
  id: string; // Typically matches creatorUid
  creatorUid: string;
  timezone: string; // e.g. "Europe/Madrid"
  weeklySchedule: WeeklySchedule;
  exceptions: Array<{ date: string; available: boolean }>; // date format: "YYYY-MM-DD"
  createdAt: Date | string;
  updatedAt: Date | string;
}

export class AvailabilityEntity {
  public id: string;
  public creatorUid: string;
  public timezone: string;
  public weeklySchedule: WeeklySchedule;
  public exceptions: Array<{ date: string; available: boolean }>;
  public createdAt: Date;
  public updatedAt: Date;

  constructor(properties: AvailabilityProperties) {
    this.id = properties.id;
    this.creatorUid = properties.creatorUid;
    this.timezone = properties.timezone;
    this.weeklySchedule = properties.weeklySchedule;
    this.exceptions = properties.exceptions || [];
    this.createdAt = new Date(properties.createdAt);
    this.updatedAt = new Date(properties.updatedAt);
  }

  static create(input: Omit<AvailabilityProperties, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): AvailabilityEntity {
    const now = new Date();
    return new AvailabilityEntity({
      ...input,
      id: input.id || input.creatorUid,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });
  }

  // Helper to generate a default 9-5 schedule for Mon-Fri
  static generateDefaultSchedule(): WeeklySchedule {
    const defaultSlot = [{ start: '09:00', end: '13:00' }, { start: '14:00', end: '17:00' }];
    return {
      0: { active: false, slots: [] },
      1: { active: true, slots: [...defaultSlot] },
      2: { active: true, slots: [...defaultSlot] },
      3: { active: true, slots: [...defaultSlot] },
      4: { active: true, slots: [...defaultSlot] },
      5: { active: true, slots: [...defaultSlot] },
      6: { active: false, slots: [] },
    };
  }

  toPlainObject(): any {
    return {
      id: this.id,
      creatorUid: this.creatorUid,
      timezone: this.timezone,
      weeklySchedule: this.weeklySchedule,
      exceptions: this.exceptions,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}
