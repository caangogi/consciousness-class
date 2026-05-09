import { NextResponse, type NextRequest } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { isCommunityMember } from '@/lib/community/check-membership';

async function getAuthUser(request: NextRequest) {
  const auth = request.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  try { return await adminAuth.verifyIdToken(auth.split('Bearer ')[1]); }
  catch { return null; }
}

// GET /api/community/[id]
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: communityId } = await params;
    const user = await getAuthUser(request);

    const doc = await adminDb.collection('communities').doc(communityId).get();
    if (!doc.exists) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 });
    }

    const data = doc.data()!;
    let isMember = false;

    if (user) {
      isMember = await isCommunityMember(user.uid, communityId, data);
    }

    const responseData = {
      id: doc.id,
      title: data.title,
      shortDescription: data.shortDescription,
      coverUrl: data.coverUrl,
      creatorUid: data.creatorUid,
      isPrivate: data.isPrivate,
      communityGuidelines: data.communityGuidelines,
      price: data.price,
      // Only include settings if it's the creator viewing it
      ...(user?.uid === data.creatorUid ? {
        linkedMembershipId: data.linkedMembershipId,
        feedVisibilityDefault: data.feedVisibilityDefault
      } : {}),
      isMember
    };

    return NextResponse.json({ community: responseData }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching community:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/community/[id]
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: communityId } = await params;
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const doc = await adminDb.collection('communities').doc(communityId).get();
    if (!doc.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (doc.data()?.creatorUid !== user.uid) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const updates = await request.json();
    
    const allowedUpdates: any = {};
    if (updates.feedVisibilityDefault !== undefined) allowedUpdates.feedVisibilityDefault = updates.feedVisibilityDefault;
    if (updates.linkedMembershipId !== undefined) allowedUpdates.linkedMembershipId = updates.linkedMembershipId;
    
    allowedUpdates.updatedAt = new Date().toISOString();

    await adminDb.collection('communities').doc(communityId).update(allowedUpdates);

    return NextResponse.json({ success: true, updates: allowedUpdates });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
