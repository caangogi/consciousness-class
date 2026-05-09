import { NextResponse, type NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { BookingService } from '@/backend/booking/application/booking.service';

const bookingService = new BookingService();

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const patientUid = decodedToken.uid;
    const patientEmail = decodedToken.email;

    const body = await request.json();
    const { creatorUid, assetId, startTime, endTime } = body;

    if (!creatorUid || !assetId || !startTime || !endTime) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Try to reserve the slot (this throws if the slot is taken)
    const booking = await bookingService.reserveSlot(
      creatorUid,
      patientUid,
      assetId,
      startTime,
      endTime,
      undefined,
      patientEmail
    );

    return NextResponse.json({ success: true, bookingId: booking.id, booking: booking.toPlainObject() });
  } catch (error: any) {
    console.error('Error in POST /api/booking/reserve:', error);
    
    // Check if it's our concurrency overlap error
    if (error.message.includes('ya no está disponible')) {
      return NextResponse.json({ error: error.message }, { status: 409 }); // 409 Conflict
    }

    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
