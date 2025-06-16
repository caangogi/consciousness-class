
// src/app/api/student/my-commissions/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

const COMMISSIONS_COLLECTION = 'comisionesRegistradas';

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
      console.error('Error verifying ID token in /api/student/my-commissions:', error);
      return NextResponse.json({ error: 'Unauthorized: Invalid ID token', details: error.message }, { status: 401 });
    }
    const userId = decodedToken.uid;

    if (!adminDb) {
        console.error('[API /student/my-commissions] CRITICAL: adminDb is not initialized.');
        return NextResponse.json({ error: 'Server configuration error', details: 'Database not available.' }, { status: 503 });
    }

    const commissionsSnapshot = await adminDb.collection(COMMISSIONS_COLLECTION)
      .where('referenteUid', '==', userId)
      .orderBy('fechaCreacion', 'desc')
      .get();

    if (commissionsSnapshot.empty) {
      return NextResponse.json({ commissions: [] }, { status: 200 });
    }

    const commissions = commissionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ commissions }, { status: 200 });

  } catch (error: any) {
    console.error('Error in GET /api/student/my-commissions:', error);
    let errorMessage = 'Internal Server Error';
    let errorDetails = 'An unexpected error occurred while fetching commissions.';
    
    if (error instanceof Error) {
      errorDetails = error.message;
      errorMessage = error.name === 'Error' ? 'Commissions Fetch Error' : error.name;
    }
    
    const stack = process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : String(error)) : undefined;
    return NextResponse.json({ error: errorMessage, details: errorDetails, stack }, { status: 500 });
  }
}

    