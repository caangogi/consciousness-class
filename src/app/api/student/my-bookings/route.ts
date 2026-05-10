import { NextResponse, type NextRequest } from 'next/server';
import { requireRoles } from '@/lib/auth/rbac';
import { FirebaseBookingRepository } from '@/backend/booking/infrastructure/repositories/firebase-booking.repository';
import { logger } from '@/lib/logger';

/**
 * GET /api/student/my-bookings
 *
 * Returns the authenticated user's bookings (as a patient), ordered by
 * startTime desc. Used by /dashboard/learning/my-bookings to render the
 * patient view (T5.1.1).
 *
 * The payload is intentionally raw — frontend rendering / formatting /
 * timezone choices belong to the page, not the API.
 *
 * Response:
 *   200 { bookings: BookingProperties[] }
 *   401 if no/invalid token
 *   500 on unexpected
 */
export async function GET(request: NextRequest) {
  const auth = await requireRoles(request, ['student', 'creator', 'admin', 'superadmin']);
  if ('error' in auth) return auth.error;

  try {
    const repo = new FirebaseBookingRepository();
    const bookings = await repo.getPatientBookings(auth.uid);
    return NextResponse.json({
      bookings: bookings.map((b) => b.toPlainObject()),
    });
  } catch (err) {
    logger.error('GET /api/student/my-bookings failed', { uid: auth.uid, err });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
