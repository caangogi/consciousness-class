import { NextResponse, type NextRequest } from 'next/server';
import { adminAuth, adminDb, adminStorage } from '@/lib/firebase/admin';
import { FirebaseCommunityPostRepository } from '@/backend/community/infrastructure/repositories/firebase-community-post.repository';

const postRepo = new FirebaseCommunityPostRepository();

async function getAuthUser(request: NextRequest) {
  const auth = request.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  try { return await adminAuth.verifyIdToken(auth.split('Bearer ')[1]); }
  catch { return null; }
}

// PATCH /api/community/[id]/posts/[postId]/pin
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; postId: string }> }
) {
  const { id: communityId, postId } = await params;
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const communityDoc = await adminDb.collection('communities').doc(communityId).get();
  if (!communityDoc.exists || communityDoc.data()?.creatorUid !== user.uid) {
    return NextResponse.json({ error: 'Only the creator can pin posts' }, { status: 403 });
  }

  const post = await postRepo.getById(communityId, postId);
  if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

  const updated = post.pinnedAt ? post.unpin() : post.pin();
  await postRepo.update(updated);

  return NextResponse.json({ pinned: !!updated.pinnedAt });
}

// DELETE /api/community/[id]/posts/[postId]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; postId: string }> }
) {
  const { id: communityId, postId } = await params;
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const communityDoc = await adminDb.collection('communities').doc(communityId).get();
  const post = await postRepo.getById(communityId, postId);
  if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

  const isCreator = communityDoc.data()?.creatorUid === user.uid;
  const isAuthor = post.authorUid === user.uid;

  if (!isCreator && !isAuthor) {
    return NextResponse.json({ error: 'Not authorized to delete this post' }, { status: 403 });
  }

  // Purge attachments from Firebase Storage
  if (post.attachments && post.attachments.length > 0) {
    const bucket = adminStorage!.bucket(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
    for (const att of post.attachments) {
      try {
        if (att.url.includes('firebasestorage.googleapis.com')) {
          const match = att.url.match(/\/o\/([^?]+)/);
          if (match && match[1]) {
            const filePath = decodeURIComponent(match[1]);
            await bucket.file(filePath).delete().catch(e => console.warn('Could not delete file:', filePath, e));
          }
        }
      } catch (e) {
        console.warn('Error parsing/deleting attachment URL:', att.url, e);
      }
    }
  }

  await postRepo.delete(communityId, postId);
  return NextResponse.json({ success: true });
}
