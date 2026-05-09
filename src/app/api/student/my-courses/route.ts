import { NextResponse, type NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { FirebaseEnrollmentRepository } from '@/backend/enrollment/infrastructure/repositories/firebase-enrollment.repository';
import { adminDb } from '@/lib/firebase/admin';

const enrollmentRepo = new FirebaseEnrollmentRepository();

export async function GET(request: NextRequest) {
  try {
    const authorization = request.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing or invalid token format' }, { status: 401 });
    }
    const idToken = authorization.split('Bearer ')[1];

    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch (error: any) {
      return NextResponse.json({ error: 'Unauthorized: Invalid ID token', details: error.message }, { status: 401 });
    }
    const userId = decodedToken.uid;

    // Get all active enrollments from the subcollection
    const enrollments = await enrollmentRepo.getEnrollments(userId);

    if (enrollments.length === 0) {
      return NextResponse.json({ enrolledItems: [] }, { status: 200 });
    }

    const enrolledIds = enrollments.map(e => e.assetId);

    // Fetch catalog item details for the enrolled assets (batch in chunks of 10)
    const enrolledItems: any[] = [];
    const chunks: string[][] = [];
    for (let i = 0; i < enrolledIds.length; i += 10) {
      chunks.push(enrolledIds.slice(i, i + 10));
    }

    for (const chunk of chunks) {
      const snap = await adminDb.collection('catalog_items')
        .where('assetReferenceId', 'in', chunk)
        .get();
      snap.docs.forEach(doc => {
        const enrollment = enrollments.find(e => e.assetId === doc.data().assetReferenceId);
        enrolledItems.push({
          ...doc.data(),
          enrolledAt: enrollment?.enrolledAt.toISOString(),
          accessType: enrollment?.accessType,
          assetType: enrollment?.assetType,
        });
      });
    }

    return NextResponse.json({ enrolledItems }, { status: 200 });

  } catch (error: any) {
    console.error('Error in GET /api/student/my-courses:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
