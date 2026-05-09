import { NextResponse, type NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { FirebaseNotificationRepository } from '@/backend/community/infrastructure/repositories/firebase-notification.repository';

const notifRepo = new FirebaseNotificationRepository();

async function getAuthUser(request: NextRequest) {
  const auth = request.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  try { return await adminAuth.verifyIdToken(auth.split('Bearer ')[1]); }
  catch { return null; }
}

// PATCH /api/notifications/[id]/read
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await notifRepo.markAsRead(user.uid, id);
  return NextResponse.json({ success: true });
}
