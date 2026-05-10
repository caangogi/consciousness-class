import { FirebaseAvailabilityRepository } from '../infrastructure/repositories/firebase-availability.repository';
import { FirebaseBookingRepository } from '../infrastructure/repositories/firebase-booking.repository';
import { AvailabilityEntity } from '../domain/entities/availability.entity';
import { BookingEntity, BookingStatus } from '../domain/entities/booking.entity';
import { addMinutes, isBefore, isAfter, isEqual, startOfMonth, endOfMonth, eachDayOfInterval, format, parseISO } from 'date-fns';
import { formatInTimeZone, toZonedTime, fromZonedTime } from 'date-fns-tz';

export interface Slot {
  startTime: string; // ISO string (UTC)
  endTime: string;   // ISO string (UTC)
}

export class BookingService {
  private availabilityRepo: any;
  private bookingRepo: any;

  // Optional injection for unit tests. Defaults to the Firebase impls so
  // existing callers (`new BookingService()`) keep working unchanged.
  // TODO: introduce IBookingRepository / IAvailabilityRepository interfaces
  // when the booking domain gets its own hexagonal cleanup pass.
  constructor(bookingRepo?: any, availabilityRepo?: any) {
    this.bookingRepo = bookingRepo ?? new FirebaseBookingRepository();
    this.availabilityRepo = availabilityRepo ?? new FirebaseAvailabilityRepository();
  }

  /**
   * Calculates the available slots for a given creator in a specific month.
   * Algorithm: Base Availability - Existing Bookings - Exceptions
   */
  async getAvailableSlots(creatorUid: string, year: number, month: number, durationMinutes: number = 60): Promise<Slot[]> {
    // 1. Get Base Availability
    const availability = await this.availabilityRepo.getOrCreateDefault(creatorUid);
    const timezone = availability.timezone;

    // 2. Define the exact search interval (Start to End of Month in UTC)
    // We construct the local start of the month, then convert to UTC to fetch bookings.
    const localStartStr = `${year}-${String(month).padStart(2, '0')}-01T00:00:00`;
    const localStartDate = fromZonedTime(localStartStr, timezone);
    const localEndDate = endOfMonth(localStartDate);

    // 3. Get existing bookings in this range
    const existingBookings = await this.bookingRepo.getCreatorBookingsInRange(
      creatorUid,
      localStartDate.toISOString(),
      localEndDate.toISOString()
    );

    // Helper: check if a proposed slot overlaps with any existing booking
    const isOverlapping = (start: Date, end: Date) => {
      return existingBookings.some(booking => {
        const bStart = booking.startTime;
        const bEnd = booking.endTime;
        // Overlap condition: (StartA < EndB) and (EndA > StartB)
        return start < bEnd && end > bStart;
      });
    };

    const availableSlots: Slot[] = [];
    const daysInMonth = eachDayOfInterval({ start: localStartDate, end: localEndDate });
    const now = new Date();

    // 4. Generate slots day by day
    for (const day of daysInMonth) {
      const dayOfWeek = day.getDay(); // 0 = Sunday, 6 = Saturday
      const daySchedule = availability.weeklySchedule[dayOfWeek];

      // Check if day is active in weekly schedule
      if (!daySchedule || !daySchedule.active) continue;

      // Check exceptions (vacations/blocked dates)
      const dateStr = formatInTimeZone(day, timezone, 'yyyy-MM-dd');
      const exception = availability.exceptions.find(e => e.date === dateStr);
      if (exception && !exception.available) continue; // Day is blocked

      // Process each slot block defined by the creator (e.g., 09:00 - 13:00)
      for (const block of daySchedule.slots) {
        // block.start e.g. "09:00"
        const [startHour, startMin] = block.start.split(':').map(Number);
        const [endHour, endMin] = block.end.split(':').map(Number);

        // Construct exact Local Time Dates
        const blockStartLocal = new Date(day);
        blockStartLocal.setHours(startHour, startMin, 0, 0);

        const blockEndLocal = new Date(day);
        blockEndLocal.setHours(endHour, endMin, 0, 0);

        // Convert local time blocks to UTC
        const blockStartUTC = fromZonedTime(blockStartLocal, timezone);
        const blockEndUTC = fromZonedTime(blockEndLocal, timezone);

        // Generate discrete slots of `durationMinutes` inside this block
        let currentSlotStart = blockStartUTC;
        while (currentSlotStart < blockEndUTC) {
          const currentSlotEnd = addMinutes(currentSlotStart, durationMinutes);
          
          // Ensure the slot doesn't exceed the block end time
          if (currentSlotEnd <= blockEndUTC) {
            // Prevent booking in the past
            if (currentSlotStart > now) {
              if (!isOverlapping(currentSlotStart, currentSlotEnd)) {
                availableSlots.push({
                  startTime: currentSlotStart.toISOString(),
                  endTime: currentSlotEnd.toISOString(),
                });
              }
            }
          }
          // Move to next possible slot (we can advance by durationMinutes or a smaller interval like 30m)
          // Standard: advance by the duration itself to avoid awkward fragmented gaps.
          currentSlotStart = currentSlotEnd; 
        }
      }
    }

    return availableSlots;
  }

  /**
   * Reserves a slot. Verifies availability again to prevent double-booking race conditions.
   */
  async reserveSlot(
    creatorUid: string,
    patientUid: string,
    assetId: string, // The Coaching product ID
    startTimeIso: string,
    endTimeIso: string,
    patientName?: string,
    patientEmail?: string
  ): Promise<BookingEntity> {
    const start = parseISO(startTimeIso);
    const end = parseISO(endTimeIso);

    // Concurrency check: Are there any bookings exactly overlapping?
    // In a high-traffic app, we'd use a Firestore Transaction here.
    const overlappingBookings = await this.bookingRepo.getCreatorBookingsInRange(creatorUid, startTimeIso, endTimeIso);
    const hasOverlap = overlappingBookings.some(booking => {
      return start < booking.endTime && end > booking.startTime;
    });

    if (hasOverlap) {
      throw new Error('El horario seleccionado ya no está disponible.');
    }

    // Create the booking in pending_payment state
    const booking = BookingEntity.create({
      assetId,
      creatorUid,
      patientUid,
      patientName,
      patientEmail,
      startTime: startTimeIso,
      endTime: endTimeIso,
      status: 'pending_payment'
    });

    await this.bookingRepo.save(booking);
    return booking;
  }

  /**
   * Links a pending booking to a Stripe Checkout Session so the webhook can confirm it.
   */
  async attachPaymentSession(bookingId: string, sessionId: string): Promise<void> {
    const booking = await this.bookingRepo.getById(bookingId);
    if (!booking) throw new Error('Booking not found');
    booking.paymentSessionId = sessionId;
    await this.bookingRepo.save(booking);
  }

  /**
   * Confirms a booking (called by Webhook after successful payment)
   */
  async confirmBooking(bookingId: string): Promise<BookingEntity> {
    const booking = await this.bookingRepo.getById(bookingId);
    if (!booking) throw new Error('Booking not found');

    booking.confirm();
    // Here we would ideally integrate Google Meet generation and save it to `meetLink`

    await this.bookingRepo.save(booking);
    return booking;
  }

  /**
   * Cancels a booking. Computes refundEligible per the strict 24h rule
   * (encapsulated in BookingEntity.cancel — see F1.3 tests).
   *
   * The route layer is responsible for:
   *   - authorization (verifying the requester can cancel this booking)
   *   - emitting `booking.cancelled` with the cancelledBy actor (the
   *     service does not know who triggered the cancellation)
   */
  async cancelBooking(bookingId: string, now: Date): Promise<BookingEntity> {
    const booking = await this.bookingRepo.getById(bookingId);
    if (!booking) throw new Error('Booking not found');

    booking.cancel(now); // throws on illegal transition; route maps to 409
    await this.bookingRepo.save(booking);
    return booking;
  }
}
