import { NextResponse, type NextRequest } from 'next/server';
import { requireRoles } from '@/lib/auth/rbac';
import { BookingService } from '@/backend/booking/application/booking.service';
import { FirebaseBookingRepository } from '@/backend/booking/infrastructure/repositories/firebase-booking.repository';
import { logger } from '@/lib/logger';

/**
 * POST /api/booking/[bookingId]/mark-no-show
 *
 * Marks a confirmed booking as no-show after the patient failed to attend.
 *
 * Authorization (stricter than /cancel):
 *   - ONLY the booking's creator OR an admin/superadmin can mark no-show.
 *   - The patient can NEVER mark their own no-show. That would let a
 *     patient escape paying just by claiming to be a no-show themselves.
 *
 * Response shape:
 *   200 { booking: { id, status: 'no_show', markedAt } }
 *   400 if bookingId is missing
 *   401 if no token
 *   403 if requester is not creator/admin
 *   404 if booking not found
 *   409 if entity guard rejects:
 *       - status is not 'scheduled' ("illegal transition")
 *       - now is still inside the +30min grace window after endTime
 *         ("grace")
 *   500 on unexpected failure
 *
 * No domain event is emitted today — there is no consumer wired for
 * 'booking.no_show' yet. If a creator-side analytics or in-app
 * notification ever needs it, add the event type to DomainEventPayloads
 * and the emit() call here.
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

  // Load FIRST for the per-booking authorization check.
  const booking = await bookingRepo.getById(bookingId);
  if (!booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }

  const isCreator = booking.creatorUid === auth.uid;
  const isAdmin = auth.role === 'admin' || auth.role === 'superadmin';
  if (!isCreator && !isAdmin) {
    return NextResponse.json(
      { error: 'Prohibido: solo el creador de esta reserva puede marcarla como no-show' },
      { status: 403 }
    );
  }

  try {
    const updated = await bookingService.markNoShow(bookingId, new Date());
    logger.info('Booking marked as no-show', {
      bookingId,
      requesterUid: auth.uid,
      isAdmin,
    });
    return NextResponse.json({
      booking: {
        id: updated.id,
        status: updated.status,
        markedAt: updated.updatedAt.toISOString(),
      },
    });
  } catch (err: any) {
    if (typeof err?.message === 'string' && /illegal transition|grace/i.test(err.message)) {
      logger.warn('No-show rejected by entity guard', { bookingId, error: err.message });
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    logger.error('Mark no-show failed', { bookingId, err });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
