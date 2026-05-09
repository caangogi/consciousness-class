import { NextResponse, type NextRequest } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { FirebaseCommunityPostRepository } from '@/backend/community/infrastructure/repositories/firebase-community-post.repository';

const postRepo = new FirebaseCommunityPostRepository();

async function getAuthUser(request: NextRequest) {
  const auth = request.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  try { return await adminAuth.verifyIdToken(auth.split('Bearer ')[1]); }
  catch { return null; }
}

// POST /api/community/[id]/posts/[postId]/mark-answer
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; postId: string }> }
) {
  const { id: communityId, postId } = await params;
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const communityDoc = await adminDb.collection('communities').doc(communityId).get();
  if (!communityDoc.exists || communityDoc.data()?.creatorUid !== user.uid) {
    return NextResponse.json({ error: 'Only the creator can mark official answers' }, { status: 403 });
  }

  const post = await postRepo.getById(communityId, postId);
  if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

  const updated = new (post.constructor as any)({
    ...post.toPlainObject(),
    isOfficialAnswer: !post.isOfficialAnswer,
    updatedAt: new Date().toISOString(),
  });
  await postRepo.update(updated);

  return NextResponse.json({ isOfficialAnswer: updated.isOfficialAnswer });
}
