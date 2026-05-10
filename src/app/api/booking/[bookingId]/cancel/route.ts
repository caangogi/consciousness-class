import { NextResponse, type NextRequest } from 'next/server';
import { requireRoles } from '@/lib/auth/rbac';
import { BookingService } from '@/backend/booking/application/booking.service';
import { FirebaseBookingRepository } from '@/backend/booking/infrastructure/repositories/firebase-booking.repository';
import { domainEvents } from '@/backend/shared/application/domain-events';
import { logger } from '@/lib/logger';

/**
 * POST /api/booking/[bookingId]/cancel
 *
 * Cancels a booking. Authorization: the requester must be either the
 * booking's patient, the booking's creator, or an admin/superadmin.
 *
 * Response shape:
 *   200 { booking: { id, status: 'cancelled', refundEligible: boolean | null } }
 *   401 if no/invalid token
 *   403 if requester is not patient, creator, admin or superadmin
 *   404 if booking not found
 *   409 if booking is in a terminal state and cannot be cancelled
 *   500 on unexpected errors
 */
export async function POST(
  request: NextRequest,
  context: { params: { bookingId: string } | Promise<{ params: { bookingId: string } }> }
) {
  // Next 15 changed params from sync to async; support both shapes safely.
  const params = await Promise.resolve((context as any).params);
  const bookingId: string = params?.bookingId;

  if (!bookingId) {
    return NextResponse.json({ error: 'Missing bookingId' }, { status: 400 });
  }

  // Auth: any authenticated role is admitted. Authorization (per-booking)
  // is checked below against the booking's patient/creator UIDs.
  const auth = await requireRoles(request, ['student', 'creator', 'admin', 'superadmin']);
  if ('error' in auth) return auth.error;

  const bookingRepo = new FirebaseBookingRepository();
  const bookingService = new BookingService(bookingRepo);

  // Load FIRST to check authorization before mutating anything.
  const booking = await bookingRepo.getById(bookingId);
  if (!booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }

  const isPatient = booking.patientUid === auth.uid;
  const isCreator = booking.creatorUid === auth.uid;
  const isAdmin = auth.role === 'admin' || auth.role === 'superadmin';
  if (!isPatient && !isCreator && !isAdmin) {
    return NextResponse.json(
      { error: 'Prohibido: no eres el paciente ni el creador de esta reserva' },
      { status: 403 }
    );
  }

  const cancelledBy: 'patient' | 'creator' | 'system' = isPatient
    ? 'patient'
    : isCreator
    ? 'creator'
    : 'system'; // admin override is treated as system for the audit trail

  try {
    const updated = await bookingService.cancelBooking(bookingId, new Date());

    // Fire-and-await: subscribers (e.g. T4.1.2 email handler) react inside
    // the same request lifecycle. The bus isolates handler failures so a
    // bad subscriber cannot 500 this endpoint.
    await domainEvents.emit('booking.cancelled', {
      bookingId: updated.id,
      creatorUid: updated.creatorUid,
      patientUid: updated.patientUid,
      patientEmail: updated.patientEmail,
      refundEligible: updated.refundEligible,
      cancelledBy,
    });

    logger.info('Booking cancelled', {
      bookingId,
      cancelledBy,
      refundEligible: updated.refundEligible,
      requesterUid: auth.uid,
    });

    return NextResponse.json({
      booking: {
        id: updated.id,
        status: updated.status,
        refundEligible: updated.refundEligible,
        cancelledAt: updated.updatedAt.toISOString(),
      },
    });
  } catch (err: any) {
    if (typeof err?.message === 'string' && /illegal transition/i.test(err.message)) {
      logger.warn('Cancel rejected by entity guard', { bookingId, error: err.message });
      return NextResponse.json(
        { error: err.message },
        { status: 409 } // Conflict — booking is in a terminal state
      );
    }
    logger.error('Cancel booking failed', { bookingId, err });
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
