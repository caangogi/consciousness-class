import { NextResponse, type NextRequest } from 'next/server';
import { requireRoles } from '@/lib/auth/rbac';
import { BookingService } from '@/backend/booking/application/booking.service';
import { FirebaseBookingRepository } from '@/backend/booking/infrastructure/repositories/firebase-booking.repository';
import { logger } from '@/lib/logger';

/**
 * POST /api/booking/[bookingId]/complete
 *
 * Marks a confirmed booking as completed (the session happened).
 *
 * Authorization (mirror of mark-no-show):
 *   - requireRoles gate: creator | admin | superadmin only.
 *   - Per-booking check: only the booking's creator OR an admin/
 *     superadmin can mark complete. The patient never can — completion
 *     is a creator-side acknowledgment ("I delivered the session").
 *
 * Response shape:
 *   200 { booking: { id, status: 'completed', completedAt } }
 *   400 missing bookingId
 *   401 no token
 *   403 not creator/admin
 *   404 booking not found
 *   409 entity guard:
 *       - status not 'scheduled' → "illegal transition"
 *       - called BEFORE endTime  → "before endTime"
 *   500 unexpected
 *
 * No domain event today — DomainEventPayloads has no booking.completed.
 * Add it when the first consumer wires up (Fase 4.x review-request
 * email is the most plausible candidate).
 */
export async function POST(
  request: NextRequest,
  context: { params: { bookingId: string } | Promise<{ params: { bookingId: string } }> }
) {
  const params = await Promise.resolve((context as any).params);
  const bookingId: string = params?.bookingId;

  if (!bookingId) {
    return NextResponse.json({ error: 'Missing bookingId' }, { status: 400 });
  }

  const auth = await requireRoles(request, ['creator', 'admin', 'superadmin']);
  if ('error' in auth) return auth.error;

  const bookingRepo = new FirebaseBookingRepository();
  const bookingService = new BookingService(bookingRepo);

  const booking = await bookingRepo.getById(bookingId);
  if (!booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }

  const isCreator = booking.creatorUid === auth.uid;
  const isAdmin = auth.role === 'admin' || auth.role === 'superadmin';
  if (!isCreator && !isAdmin) {
    return NextResponse.json(
      { error: 'Prohibido: solo el creador puede marcar la sesión como completada' },
      { status: 403 }
    );
  }

  try {
    const updated = await bookingService.completeBooking(bookingId, new Date());
    logger.info('Booking marked as completed', {
      bookingId,
      requesterUid: auth.uid,
      isAdmin,
    });
    return NextResponse.json({
      booking: {
        id: updated.id,
        status: updated.status,
        completedAt: updated.updatedAt.toISOString(),
      },
    });
  } catch (err: any) {
    if (typeof err?.message === 'string' && /illegal transition|before endTime/i.test(err.message)) {
      logger.warn('Complete rejected by entity guard', { bookingId, error: err.message });
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    logger.error('Complete booking failed', { bookingId, err });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
