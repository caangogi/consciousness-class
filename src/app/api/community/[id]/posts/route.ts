import { NextResponse, type NextRequest } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { FirebaseCommunityPostRepository } from '@/backend/community/infrastructure/repositories/firebase-community-post.repository';
import { CommunityPostEntity } from '@/backend/community/domain/entities/community-post.entity';
import { FirebaseNotificationRepository } from '@/backend/community/infrastructure/repositories/firebase-notification.repository';
import { NotificationEntity } from '@/backend/community/domain/entities/notification.entity';
import { resolveUserProfile } from '@/lib/community/resolve-user-profile';
import { isCommunityMember } from '@/lib/community/check-membership';

const postRepo = new FirebaseCommunityPostRepository();
const notifRepo = new FirebaseNotificationRepository();

async function getAuthUser(request: NextRequest) {
  const auth = request.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  try {
    return await adminAuth.verifyIdToken(auth.split('Bearer ')[1]);
  } catch {
    return null;
  }
}

// GET /api/community/[id]/posts
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: communityId } = await params;
  const user = await getAuthUser(request);

  // Check community visibility
  const communityDoc = await adminDb.collection('communities').doc(communityId).get();
  if (!communityDoc.exists) {
    return NextResponse.json({ error: 'Community not found' }, { status: 404 });
  }

  const isCommunityPrivate = communityDoc.data()?.isPrivate;
  const isCreator = user?.uid === communityDoc.data()?.creatorUid;
  const memberAccess = user ? await isCommunityMember(user.uid, communityId, communityDoc.data()!) : false;
  const hasAccess = !isCommunityPrivate || isCreator || memberAccess;

  const posts = await postRepo.getPosts(communityId, hasAccess);

  // If no access, filter to public only
  const filtered = hasAccess ? posts : posts.filter(p => p.visibility === 'public');
  const isAdmin = isCreator;

  return NextResponse.json({
    posts: filtered.map(p => p.toPlainObject()),
    isAdmin,
    isMember: memberAccess,
  });
}

// POST /api/community/[id]/posts
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: communityId } = await params;
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const communityDoc = await adminDb.collection('communities').doc(communityId).get();
  if (!communityDoc.exists) {
    return NextResponse.json({ error: 'Community not found' }, { status: 404 });
  }

  const communityData = communityDoc.data()!;
  const isCreator = user.uid === communityData.creatorUid;
  const memberAccess = await isCommunityMember(user.uid, communityId, communityData);

  if (!isCreator && !memberAccess) {
    return NextResponse.json({ error: 'Not a member of this community' }, { status: 403 });
  }

  const body = await request.json();
  const { content, postType, visibility, attachments, catalogItemRef } = body;

  if (!content?.trim()) {
    return NextResponse.json({ error: 'Content is required' }, { status: 400 });
  }

  // Only creator can post announcements, free_content, product_showcase
  const creatorOnlyTypes = ['announcement', 'free_content', 'product_showcase'];
  if (creatorOnlyTypes.includes(postType) && !isCreator) {
    return NextResponse.json({ error: 'Only the creator can post this type' }, { status: 403 });
  }

  const { displayName, photoURL } = await resolveUserProfile(user.uid);

  const post = CommunityPostEntity.create({
    communityId,
    authorUid: user.uid,
    authorDisplayName: displayName,
    authorAvatarUrl: photoURL,
    content,
    postType: postType || 'text',
    visibility: visibility || communityData.feedVisibilityDefault || 'members_only',
    attachments: attachments || [],
    catalogItemRef: catalogItemRef || null,
  });

  await postRepo.create(post);

  // Notify all members (simplified: notify creator if someone else posts)
  if (!isCreator) {
    const notif = NotificationEntity.create({
      recipientUid: communityData.creatorUid,
      type: 'new_post',
      actorUid: user.uid,
      actorDisplayName: displayName,
      actorAvatarUrl: photoURL,
      entityType: 'post',
      entityId: post.id,
      communityId,
      message: `${displayName} publicó en tu comunidad "${communityData.title}"`,
      deepLink: `/comunidad/${communityId}?post=${post.id}`,
    });
    await notifRepo.create(notif).catch(console.warn);
  }

  return NextResponse.json({ post: post.toPlainObject() }, { status: 201 });
}
