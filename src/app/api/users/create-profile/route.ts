
// src/app/api/users/create-profile/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    // Verificar si el Admin SDK se inicializó correctamente
    if (!adminAuth || !adminDb) {
      console.error('API /users/create-profile: CRITICAL: Firebase Admin SDK (adminAuth or adminDb) is not available. This usually means initialization failed in admin.ts. Check server logs for details regarding FIREBASE_ADMIN_CREDENTIALS_JSON.');
      return NextResponse.json({ error: 'Server configuration error', details: 'Firebase Admin SDK not available. Please check server startup logs for errors related to FIREBASE_ADMIN_CREDENTIALS_JSON.' }, { status: 503 }); // 503 Service Unavailable
    }

    const authorization = request.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing or invalid token format' }, { status: 401 });
    }
    const idToken = authorization.split('Bearer ')[1];

    if (!idToken) {
      return NextResponse.json({ error: 'Unauthorized: ID token is missing' }, { status: 401 });
    }

    const { nombre, apellido, referralCode: usedReferralCode } = await request.json();

     if (!nombre || !apellido) {
      return NextResponse.json({ error: 'Missing required fields: nombre and apellido' }, { status: 400 });
    }

    let decodedToken;
    try {
        decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch (error: any) {
        console.error('Error verifying ID token in /api/users/create-profile:', error);
        return NextResponse.json({ error: 'Unauthorized: Invalid ID token', details: error.message }, { status: 401 });
    }
    
    const uid = decodedToken.uid;
    const email = decodedToken.email;

    // Create user document in Firestore
    const userDocRef = adminDb.collection('usuarios').doc(uid);

    // Generate a unique referral code for the new user
    const generatedReferralCode = `CONSCIOUS-${uid.substring(0, 6).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const userProfileData = {
      uid,
      email,
      nombre,
      apellido,
      displayName: `${nombre} ${apellido}`,
      role: 'student', // Default role
      createdAt: new Date().toISOString(),
      referralCodeGenerated: generatedReferralCode,
      referredBy: usedReferralCode || null,
      cursosComprados: [],
      referidosExitosos: 0,
      balanceCredito: 0,
      // photoURL can be updated later if user uploads a profile picture
    };

    await userDocRef.set(userProfileData);

    return NextResponse.json({ message: 'User profile created successfully', userId: uid, profile: userProfileData }, { status: 201 });

  } catch (error: any) {
    console.error('Error in POST /api/users/create-profile. Full error object:', error);
    // Asegurarse de que siempre se devuelva JSON en caso de error
    let errorMessage = 'Internal Server Error';
    let errorDetails = 'An unexpected error occurred while creating the user profile.';
    
    if (error instanceof Error) { // Check if error is an instance of Error
        errorDetails = error.message;
        if ((error as any).code === 'auth/id-token-expired') { // Check for specific Firebase error codes if applicable
            errorMessage = 'Unauthorized: Token expired.';
            errorDetails = 'The provided ID token has expired. Please re-authenticate.';
        }
    }
    
    // Consider logging the stack trace in development for more detailed debugging
    const stack = process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : String(error)) : undefined;

    return NextResponse.json({ error: errorMessage, details: errorDetails, stack }, { status: 500 });
  }
}
