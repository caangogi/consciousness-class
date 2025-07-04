
// src/app/api/users/update-profile/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { FirebaseUserRepository } from '@/features/user/infrastructure/repositories/firebase-user.repository';
import { UserService } from '@/features/user/application/user.service';
import type { UpdateUserProfileDto } from '@/features/user/infrastructure/dto/update-user.dto';

export async function POST(request: NextRequest) {
  try {
    if (!adminAuth || !adminDb) {
      console.error('API /users/update-profile: CRITICAL: Firebase Admin SDK not available.');
      return NextResponse.json({ error: 'Server configuration error', details: 'Firebase Admin SDK not available.' }, { status: 503 });
    }

    const authorization = request.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing or invalid token format' }, { status: 401 });
    }
    const idToken = authorization.split('Bearer ')[1];

    if (!idToken) {
      return NextResponse.json({ error: 'Unauthorized: ID token is missing' }, { status: 401 });
    }

    const updateDto: UpdateUserProfileDto = await request.json();

    // Basic validation for the DTO
    const hasAtLeastOneField = updateDto.nombre !== undefined || 
                               updateDto.apellido !== undefined || 
                               updateDto.photoURL !== undefined ||
                               updateDto.bio !== undefined ||
                               updateDto.creatorVideoUrl !== undefined;

    if (!updateDto || !hasAtLeastOneField) {
      return NextResponse.json({ error: 'Bad Request: No update data provided or empty update.', details: 'At least one field (nombre, apellido, photoURL, bio, creatorVideoUrl) must be provided for update.' }, { status: 400 });
    }
    if (updateDto.nombre !== undefined && typeof updateDto.nombre !== 'string') {
        return NextResponse.json({ error: 'Bad Request: Invalid nombre format.'}, { status: 400});
    }
    if (updateDto.apellido !== undefined && typeof updateDto.apellido !== 'string') {
        return NextResponse.json({ error: 'Bad Request: Invalid apellido format.'}, { status: 400});
    }
    if (updateDto.photoURL !== undefined && updateDto.photoURL !== null && typeof updateDto.photoURL !== 'string') {
        return NextResponse.json({ error: 'Bad Request: Invalid photoURL format. Must be a string or null.'}, { status: 400});
    }
    if (updateDto.photoURL !== undefined && typeof updateDto.photoURL === 'string' && updateDto.photoURL.length > 0) {
        try {
            new URL(updateDto.photoURL); 
        } catch (_) {
            return NextResponse.json({ error: 'Bad Request: Invalid photoURL. Must be a valid URL string.'}, { status: 400});
        }
    }
    if (updateDto.bio !== undefined && typeof updateDto.bio !== 'string') {
        return NextResponse.json({ error: 'Bad Request: Invalid bio format.'}, { status: 400});
    }
    if (updateDto.creatorVideoUrl !== undefined && updateDto.creatorVideoUrl !== null && typeof updateDto.creatorVideoUrl !== 'string') {
        return NextResponse.json({ error: 'Bad Request: Invalid creatorVideoUrl format. Must be a string or null.'}, { status: 400});
    }
     if (updateDto.creatorVideoUrl !== undefined && typeof updateDto.creatorVideoUrl === 'string' && updateDto.creatorVideoUrl.length > 0) {
        try {
            new URL(updateDto.creatorVideoUrl);
        } catch (_) {
            return NextResponse.json({ error: 'Bad Request: Invalid creatorVideoUrl. Must be a valid URL string.'}, { status: 400});
        }
    }

    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch (error: any) {
      console.error('Error verifying ID token in /api/users/update-profile:', error);
      return NextResponse.json({ error: 'Unauthorized: Invalid ID token', details: error.message }, { status: 401 });
    }
    
    const uid = decodedToken.uid;

    const userRepository = new FirebaseUserRepository();
    const userService = new UserService(userRepository);

    console.log(`[API /users/update-profile] Calling userService.updateUserProfile for UID: ${uid} with DTO:`, JSON.stringify(updateDto));
    const updatedUserEntity = await userService.updateUserProfile(uid, updateDto);

    if (!updatedUserEntity) {
      console.warn(`[API /users/update-profile] User profile not found or update failed in Firestore for UID: ${uid}.`);
      return NextResponse.json({ error: 'User profile not found or update failed', details: `Could not update profile in Firestore for UID ${uid}.` }, { status: 404 });
    }

    const authUpdates: { displayName?: string; photoURL?: string | null } = {};
    
    if (updateDto.nombre !== undefined || updateDto.apellido !== undefined) {
        const currentNombre = updateDto.nombre !== undefined ? updateDto.nombre : updatedUserEntity.nombre;
        const currentApellido = updateDto.apellido !== undefined ? updateDto.apellido : updatedUserEntity.apellido;
        const newDisplayName = `${currentNombre} ${currentApellido}`.trim();
        if (newDisplayName && newDisplayName !== decodedToken.name) { 
            authUpdates.displayName = newDisplayName;
        }
    }

    if (updateDto.photoURL !== undefined) {
        if (updateDto.photoURL !== decodedToken.picture) { 
          authUpdates.photoURL = updateDto.photoURL; 
        }
    }
    
    if (Object.keys(authUpdates).length > 0) {
        try {
            console.log(`[API /users/update-profile] Updating Firebase Auth for UID: ${uid} with:`, authUpdates);
            await adminAuth.updateUser(uid, authUpdates);
            console.log(`[API /users/update-profile] Firebase Auth profile updated for UID: ${uid}`);
        } catch (authError: any) {
            console.error(`[API /users/update-profile] Error updating Firebase Auth profile for UID ${uid}:`, authError);
        }
    } else {
        console.log(`[API /users/update-profile] No changes required for Firebase Auth record for UID: ${uid}.`);
    }
    
    return NextResponse.json({ message: 'User profile updated successfully', profile: updatedUserEntity.toPlainObject() }, { status: 200 });

  } catch (error: any) {
    console.error('Error in POST /api/users/update-profile. Full error object:', error);
    let errorMessage = 'Internal Server Error';
    let errorDetails = 'An unexpected error occurred while updating the user profile.';
    
    if (error instanceof Error) {
      errorDetails = error.message;
      errorMessage = (error.name && error.name !== 'Error') ? error.name : 'User Profile Update Error';
    }
    
    const stack = process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : String(error)) : undefined;

    return NextResponse.json({ error: errorMessage, details: errorDetails, stack }, { status: 500 });
  }
}
