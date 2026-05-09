import { NextResponse, type NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const postType = searchParams.get('type'); // optional filter

    let query = adminDb
      .collection('community_feed_index')
      .orderBy('createdAt', 'desc')
      .limit(limit) as any;

    if (postType) {
      query = adminDb
        .collection('community_feed_index')
        .where('postType', '==', postType)
        .orderBy('createdAt', 'desc')
        .limit(limit);
    }

    if (cursor) {
      const cursorDoc = await adminDb.collection('community_feed_index').doc(cursor).get();
      if (cursorDoc.exists) query = query.startAfter(cursorDoc);
    }

    const snap = await query.get();
    const posts = snap.docs.map((d: any) => d.data());
    const nextCursor = posts.length === limit ? posts[posts.length - 1].id : null;

    // Enrich with community info
    const communityIds = [...new Set(posts.map((p: any) => p.communityId))] as string[];
    const communityDocs = await Promise.all(
      communityIds.map(id => adminDb.collection('communities').doc(id).get())
    );
    const communityMap: Record<string, any> = {};
    communityDocs.forEach(doc => {
      if (doc.exists) communityMap[doc.id] = doc.data();
    });

    const enriched = posts.map((p: any) => ({
      ...p,
      community: communityMap[p.communityId]
        ? {
            id: p.communityId,
            title: communityMap[p.communityId].title,
            coverUrl: communityMap[p.communityId].coverUrl,
          }
        : null,
    }));

    return NextResponse.json({ posts: enriched, nextCursor }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
