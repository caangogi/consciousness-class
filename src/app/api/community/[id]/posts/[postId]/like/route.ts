import { NextResponse, type NextRequest } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { FirebaseCommunityPostRepository } from '@/backend/community/infrastructure/repositories/firebase-community-post.repository';
import { FirebaseNotificationRepository } from '@/backend/community/infrastructure/repositories/firebase-notification.repository';
import { NotificationEntity } from '@/backend/community/domain/entities/notification.entity';

const postRepo = new FirebaseCommunityPostRepository();
const notifRepo = new FirebaseNotificationRepository();

async function getAuthUser(request: NextRequest) {
  const auth = request.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  try { return await adminAuth.verifyIdToken(auth.split('Bearer ')[1]); }
  catch { return null; }
}

// PATCH /api/community/[id]/posts/[postId]/like
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; postId: string }> }
) {
  const { id: communityId, postId } = await params;
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const result = await postRepo.toggleLike(communityId, postId, user.uid);

  // Notify post author if liked
  if (result.liked) {
    const post = await postRepo.getById(communityId, postId);
    if (post && post.authorUid !== user.uid) {
      const userDoc = await adminDb.collection('usuarios').doc(user.uid).get();
      const userData = userDoc.data();
      const notif = NotificationEntity.create({
        recipientUid: post.authorUid,
        type: 'like',
        actorUid: user.uid,
        actorDisplayName: userData?.displayName || 'Usuario',
        actorAvatarUrl: userData?.photoURL || null,
        entityType: 'post',
        entityId: postId,
        communityId,
        message: `A ${userData?.displayName || 'alguien'} le gustó tu publicación`,
        deepLink: `/comunidad/${communityId}?post=${postId}`,
      });
      await notifRepo.create(notif).catch(console.warn);
    }
  }

  return NextResponse.json(result);
}
