import { NextResponse, type NextRequest } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { EnrollmentService } from '@/backend/enrollment/application/enrollment.service';

async function getAuthUser(request: NextRequest) {
  const auth = request.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  try { return await adminAuth.verifyIdToken(auth.split('Bearer ')[1]); }
  catch { return null; }
}

const enrollmentService = new EnrollmentService();

// POST /api/community/[id]/join
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: communityId } = await params;
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Verify community exists and is joinable for free
    const communityDoc = await adminDb.collection('communities').doc(communityId).get();
    if (!communityDoc.exists) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 });
    }

    const data = communityDoc.data()!;

    // Block paid communities — they require a Stripe subscription
    if (data.price && data.price > 0) {
      return NextResponse.json({ error: 'This community requires a paid subscription' }, { status: 403 });
    }

    // Idempotent enroll — creates user doc if not exists via set({ merge: true })
    await enrollmentService.enrollStudentToAsset(
      user.uid,
      communityId,
      'community',
      'free',
      null
    );

    return NextResponse.json({ success: true, isMember: true });
  } catch (error: any) {
    console.error('Join community error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
