import { NextResponse, type NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { FirebaseAvailabilityRepository } from '@/backend/booking/infrastructure/repositories/firebase-availability.repository';
import { AvailabilityEntity } from '@/backend/booking/domain/entities/availability.entity';

const repo = new FirebaseAvailabilityRepository();

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    // Automatically generates default if not exists
    const availability = await repo.getOrCreateDefault(decodedToken.uid);
    
    return NextResponse.json({ availability: availability.toPlainObject() });
  } catch (error: any) {
    console.error('Error in GET /api/creator/availability:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    const body = await request.json();
    
    // Validate minimally required fields from client
    if (!body.timezone || !body.weeklySchedule) {
      return NextResponse.json({ error: 'Bad Request: missing timezone or weeklySchedule' }, { status: 400 });
    }

    const availability = AvailabilityEntity.create({
      creatorUid: decodedToken.uid,
      timezone: body.timezone,
      weeklySchedule: body.weeklySchedule,
      exceptions: body.exceptions || [],
    });

    await repo.save(availability);

    return NextResponse.json({ success: true, availability: availability.toPlainObject() });
  } catch (error: any) {
    console.error('Error in POST /api/creator/availability:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
