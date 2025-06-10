
// src/app/api/users/create-profile/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { FirebaseUserRepository } from '@/features/user/infrastructure/repositories/firebase-user.repository';
import { UserService } from '@/features/user/application/user.service';
import type { CreateUserDto } from '@/features/user/infrastructure/dto/create-user.dto';

export async function POST(request: NextRequest) {
  try {
    if (!adminAuth || !adminDb) {
      console.error('API /users/create-profile: CRITICAL: Firebase Admin SDK (adminAuth or adminDb) is not available. Check server logs for errors related to FIREBASE_ADMIN_PROJECT_ID, etc.');
      return NextResponse.json({ error: 'Server configuration error', details: 'Firebase Admin SDK (auth or db) not available. Please check server startup logs.' }, { status: 503 });
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

    if (!email) {
        // This should not happen if the token is valid and came from Firebase Auth email/password
        console.error('Error in POST /api/users/create-profile: Decoded token is missing email for UID:', uid);
        return NextResponse.json({ error: 'Invalid token data: Email missing from token' }, { status: 400 });
    }

    const userRepository = new FirebaseUserRepository();
    const userService = new UserService(userRepository);

    const createUserDto: CreateUserDto = {
      uid,
      email,
      nombre,
      apellido,
      referralCode: usedReferralCode || null,
      // role will default to 'student' in UserService/UserEntity
    };

    const userProfile = await userService.createUserProfile(createUserDto);

    return NextResponse.json({ message: 'User profile created successfully', userId: userProfile.uid, profile: userProfile.toPlainObject() }, { status: 201 });

  } catch (error: any) {
    console.error('Error in POST /api/users/create-profile. Full error object:', error);
    let errorMessage = 'Internal Server Error';
    let errorDetails = 'An unexpected error occurred while creating the user profile.';
    
    if (error instanceof Error) {
      errorDetails = error.message;
      errorMessage = error.name === 'Error' ? 'User Profile Creation Error' : error.name; // More specific error name if available
    }
    
    // Attempt to preserve stack in development for easier debugging.
    const stack = process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : String(error)) : undefined;

    return NextResponse.json({ error: errorMessage, details: errorDetails, stack }, { status: 500 });
  }
}
