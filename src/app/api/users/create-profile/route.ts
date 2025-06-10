// src/app/api/users/create-profile/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing or invalid token' }, { status: 401 });
    }
    const idToken = authorization.split('Bearer ')[1];

    const { nombre, apellido, referralCode: usedReferralCode } = await request.json();

    if (!idToken) {
      return NextResponse.json({ error: 'Unauthorized: ID token is missing' }, { status: 401 });
    }
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
    console.error('Error creating user profile:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
