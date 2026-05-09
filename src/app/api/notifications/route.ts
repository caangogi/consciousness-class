import { NextResponse, type NextRequest } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { FirebaseNotificationRepository } from '@/backend/community/infrastructure/repositories/firebase-notification.repository';

const notifRepo = new FirebaseNotificationRepository();

async function getAuthUser(request: NextRequest) {
  const auth = request.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  try { return await adminAuth.verifyIdToken(auth.split('Bearer ')[1]); }
  catch { return null; }
}

// GET /api/notifications
export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const notifications = await notifRepo.getForUser(user.uid, 30);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return NextResponse.json({
    notifications: notifications.map(n => n.toPlainObject()),
    unreadCount,
  });
}

// PATCH /api/notifications — Mark all as read
export async function PATCH(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await notifRepo.markAllAsRead(user.uid);
  return NextResponse.json({ success: true });
}
