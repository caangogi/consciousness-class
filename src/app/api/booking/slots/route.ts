import { NextResponse, type NextRequest } from 'next/server';
import { BookingService } from '@/backend/booking/application/booking.service';
import { FirebaseCoachingRepository } from '@/backend/coaching/infrastructure/repositories/firebase-coaching.repository';

const bookingService = new BookingService();
const coachingRepo = new FirebaseCoachingRepository();

// GET /api/booking/slots?creatorUid=XXX&assetId=YYY&year=2026&month=5
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const creatorUid = searchParams.get('creatorUid');
    const assetId = searchParams.get('assetId');
    const yearStr = searchParams.get('year');
    const monthStr = searchParams.get('month');

    if (!creatorUid || !assetId || !yearStr || !monthStr) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);

    // Get the duration of the coaching session
    const coachingAsset = await coachingRepo.findById(assetId);
    if (!coachingAsset) {
      return NextResponse.json({ error: 'Coaching asset not found' }, { status: 404 });
    }

    const durationMinutes = coachingAsset.durationMinutes || 60;

    // Calculate slots
    const slots = await bookingService.getAvailableSlots(creatorUid, year, month, durationMinutes);

    return NextResponse.json({ slots });
  } catch (error: any) {
    console.error('Error in GET /api/booking/slots:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
