import { NextResponse, type NextRequest } from 'next/server';
import { requireRoles } from '@/lib/auth/rbac';
import { FirebaseBookingRepository } from '@/backend/booking/infrastructure/repositories/firebase-booking.repository';
import { logger } from '@/lib/logger';

/**
 * GET /api/creator/my-bookings
 *
 * Returns the authenticated creator's bookings (where they are the host),
 * ordered by startTime desc. Used by /dashboard/coaching/bookings to
 * render the creator view (T5.1.2).
 *
 * Authorization: only creator/admin/superadmin roles. The query is
 * implicitly scoped to the requester's uid (creators only see their own).
 *
 * Response:
 *   200 { bookings: BookingProperties[] }
 *   401 if no/invalid token
 *   500 on unexpected
 */
export async function GET(request: NextRequest) {
  const auth = await requireRoles(request, ['creator', 'admin', 'superadmin']);
  if ('error' in auth) return auth.error;

  try {
    const repo = new FirebaseBookingRepository();
    const bookings = await repo.getCreatorBookings(auth.uid);
    return NextResponse.json({
      bookings: bookings.map((b) => b.toPlainObject()),
    });
  } catch (err) {
    logger.error('GET /api/creator/my-bookings failed', { uid: auth.uid, err });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
