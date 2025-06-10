
// src/app/api/users/create-profile/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    // Verificar si el Admin SDK se inicializó correctamente
    if (!adminAuth || !adminDb) {
      console.error('CRITICAL: Firebase Admin SDK not initialized. Check server logs for admin.ts errors.');
      return NextResponse.json({ error: 'Server configuration error', details: 'Firebase Admin SDK not available. Please check server logs.' }, { status: 503 }); // 503 Service Unavailable
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
        console.error('Error verifying ID token:', error);
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
    console.error('Error creating user profile in /api/users/create-profile:', error);
    // Asegurarse de que siempre se devuelva JSON en caso de error
    let errorMessage = 'Internal Server Error';
    let errorDetails = error.message || 'An unexpected error occurred.';
    
    if (error.code === 'auth/id-token-expired') {
        errorMessage = 'Unauthorized: Token expired.';
        errorDetails = 'The provided ID token has expired. Please re-authenticate.';
    }
    // Puedes añadir más manejadores de errores específicos aquí

    return NextResponse.json({ error: errorMessage, details: errorDetails, stack: process.env.NODE_ENV === 'development' ? error.stack : undefined }, { status: 500 });
  }
}
