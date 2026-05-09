import { NextResponse, type NextRequest } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { FirebaseCommunityCommentRepository } from '@/backend/community/infrastructure/repositories/firebase-community-comment.repository';
import { FirebaseNotificationRepository } from '@/backend/community/infrastructure/repositories/firebase-notification.repository';
import { CommunityCommentEntity } from '@/backend/community/domain/entities/community-comment.entity';
import { NotificationEntity } from '@/backend/community/domain/entities/notification.entity';
import { resolveUserProfile } from '@/lib/community/resolve-user-profile';

const commentRepo = new FirebaseCommunityCommentRepository();
const notifRepo = new FirebaseNotificationRepository();

async function getAuthUser(request: NextRequest) {
  const auth = request.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  try { return await adminAuth.verifyIdToken(auth.split('Bearer ')[1]); }
  catch { return null; }
}

// GET /api/community/[id]/posts/[postId]/comments
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; postId: string }> }
) {
  try {
    const { id: communityId, postId } = await params;
    const comments = await commentRepo.getComments(communityId, postId);
    return NextResponse.json({ comments: comments.map(c => c.toPlainObject()) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/community/[id]/posts/[postId]/comments
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; postId: string }> }
) {
  const { id: communityId, postId } = await params;
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { content, parentCommentId } = body;

  if (!content?.trim()) {
    return NextResponse.json({ error: 'Content is required' }, { status: 400 });
  }

  const { displayName, photoURL } = await resolveUserProfile(user.uid);

  const comment = CommunityCommentEntity.create({
    postId,
    communityId,
    authorUid: user.uid,
    authorDisplayName: displayName,
    authorAvatarUrl: photoURL,
    content,
    parentCommentId: parentCommentId || null,
  });

  await commentRepo.create(communityId, postId, comment);

  // Notify post author or parent comment author
  try {
    const postSnap = await adminDb
      .collection('communities').doc(communityId)
      .collection('posts').doc(postId)
      .get();
    const postData = postSnap.data();

    if (parentCommentId) {
      // Reply to a comment — notify that comment's author
      const parentSnap = await adminDb
        .collection('communities').doc(communityId)
        .collection('posts').doc(postId)
        .collection('comments').doc(parentCommentId)
        .get();
      const parentData = parentSnap.data();
      if (parentData && parentData.authorUid !== user.uid) {
        await notifRepo.create(NotificationEntity.create({
          recipientUid: parentData.authorUid,
          type: 'reply',
          actorUid: user.uid,
          actorDisplayName: displayName,
          actorAvatarUrl: photoURL,
          entityType: 'comment',
          entityId: comment.id,
          communityId,
          message: `${displayName} respondió a tu comentario`,
          deepLink: `/comunidad/${communityId}?post=${postId}`,
        }));
      }
    } else if (postData && postData.authorUid !== user.uid) {
      // Reply to a post — notify post author
      await notifRepo.create(NotificationEntity.create({
        recipientUid: postData.authorUid,
        type: 'new_comment',
        actorUid: user.uid,
        actorDisplayName: displayName,
        actorAvatarUrl: photoURL,
        entityType: 'post',
        entityId: postId,
        communityId,
        message: `${displayName} comentó en tu publicación`,
        deepLink: `/comunidad/${communityId}?post=${postId}`,
      }));
    }
  } catch (e) {
    console.warn('Notification failed (non-blocking):', e);
  }

  return NextResponse.json({ comment: comment.toPlainObject() }, { status: 201 });
}
