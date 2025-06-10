
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
    if (!updateDto || (updateDto.nombre === undefined && updateDto.apellido === undefined && updateDto.photoURL === undefined)) {
      return NextResponse.json({ error: 'Bad Request: No update data provided or empty update.', details: 'At least one field (nombre, apellido, photoURL) must be provided for update.' }, { status: 400 });
    }
    if (updateDto.nombre !== undefined && typeof updateDto.nombre !== 'string') {
        return NextResponse.json({ error: 'Bad Request: Invalid nombre format.'}, { status: 400});
    }
    if (updateDto.apellido !== undefined && typeof updateDto.apellido !== 'string') {
        return NextResponse.json({ error: 'Bad Request: Invalid apellido format.'}, { status: 400});
    }
    // Validate photoURL: if present, it must be a string (URL) or null (to remove photo).
    if (updateDto.photoURL !== undefined && updateDto.photoURL !== null && typeof updateDto.photoURL !== 'string') {
        return NextResponse.json({ error: 'Bad Request: Invalid photoURL format. Must be a string or null.'}, { status: 400});
    }
    if (updateDto.photoURL !== undefined && typeof updateDto.photoURL === 'string' && updateDto.photoURL.length > 0) {
        try {
            new URL(updateDto.photoURL); // Check if it's a valid URL format
        } catch (_) {
            return NextResponse.json({ error: 'Bad Request: Invalid photoURL. Must be a valid URL string.'}, { status: 400});
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

    // Update Firestore document
    console.log(`[API /users/update-profile] Calling userService.updateUserProfile for UID: ${uid} with DTO:`, JSON.stringify(updateDto));
    const updatedUserEntity = await userService.updateUserProfile(uid, updateDto);

    if (!updatedUserEntity) {
      console.warn(`[API /users/update-profile] User profile not found or update failed in Firestore for UID: ${uid}. This might happen if userService.updateUserProfile returned null.`);
      return NextResponse.json({ error: 'User profile not found or update failed', details: `Could not update profile in Firestore for UID ${uid}.` }, { status: 404 });
    }

    // Prepare data for Firebase Auth update
    const authUpdates: { displayName?: string; photoURL?: string | null } = {};
    
    // Only update displayName if nombre or apellido are actually changing or being set
    if (updateDto.nombre !== undefined || updateDto.apellido !== undefined) {
        const currentNombre = updateDto.nombre !== undefined ? updateDto.nombre : updatedUserEntity.nombre;
        const currentApellido = updateDto.apellido !== undefined ? updateDto.apellido : updatedUserEntity.apellido;
        const newDisplayName = `${currentNombre} ${currentApellido}`.trim();
        // Only update if newDisplayName is different from current auth display name or if newDisplayName is not empty
        if (newDisplayName && newDisplayName !== decodedToken.name) { 
            authUpdates.displayName = newDisplayName;
        } else if (!newDisplayName && decodedToken.name) { // If new name is empty, but auth had a name, clear it (optional behavior)
            // authUpdates.displayName = ""; // Or decide not to update displayName if it becomes empty
        }
    }

    // Update photoURL in Firebase Auth if it was provided in the DTO
    // This includes setting it to null if dto.photoURL is null
    if (updateDto.photoURL !== undefined) {
        if (updateDto.photoURL !== decodedToken.picture) { // Only update if different
          authUpdates.photoURL = updateDto.photoURL; // This can be string URL or null
        }
    }
    
    // Update Firebase Auth user record if there are relevant changes
    if (Object.keys(authUpdates).length > 0) {
        try {
            console.log(`[API /users/update-profile] Updating Firebase Auth for UID: ${uid} with:`, authUpdates);
            await adminAuth.updateUser(uid, authUpdates);
            console.log(`[API /users/update-profile] Firebase Auth profile updated for UID: ${uid}`);
        } catch (authError: any) {
            console.error(`[API /users/update-profile] Error updating Firebase Auth profile for UID ${uid}:`, authError);
            // This is non-fatal if Firestore updated, but important to log.
            // Consider if this should make the whole request fail or return a partial success.
            // For now, we'll proceed as Firestore update was primary.
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
      // Use a more specific error name if available and not too generic
      errorMessage = (error.name && error.name !== 'Error') ? error.name : 'User Profile Update Error';
    }
    
    const stack = process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : String(error)) : undefined;

    return NextResponse.json({ error: errorMessage, details: errorDetails, stack }, { status: 500 });
  }
}

