
// src/app/api/users/request-creator-role/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { UserService } from '@/features/user/application/user.service';
import { FirebaseUserRepository } from '@/features/user/infrastructure/repositories/firebase-user.repository';

export async function POST(request: NextRequest) {
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
      console.error('Error verifying ID token in /api/users/request-creator-role:', error);
      return NextResponse.json({ error: 'Unauthorized: Invalid ID token', details: error.message }, { status: 401 });
    }

    const uid = decodedToken.uid;

    const userRepository = new FirebaseUserRepository();
    const userService = new UserService(userRepository);

    // Ensure the user is requesting to change their own role and is currently a student
    const currentUserProfile = await userService.getUserProfile(uid);
    if (!currentUserProfile) {
        return NextResponse.json({ error: 'User profile not found.' }, { status: 404 });
    }
    if (currentUserProfile.role !== 'student') {
        return NextResponse.json({ error: `Forbidden: User role is already '${currentUserProfile.role}'. Only students can request to become creators.` }, { status: 403 });
    }

    const updatedUser = await userService.requestCreatorRole(uid);

    if (!updatedUser) {
      // This case should ideally be caught by earlier checks or userService throwing an error
      return NextResponse.json({ error: 'Failed to update user role. User may not exist or an internal error occurred.' }, { status: 500 });
    }

    return NextResponse.json({ message: 'User role updated to creator successfully', profile: updatedUser.toPlainObject() }, { status: 200 });

  } catch (error: any) {
    console.error('Error in POST /api/users/request-creator-role:', error);
    let errorMessage = 'Internal Server Error';
    let errorDetails = 'An unexpected error occurred while updating user role.';
    let statusCode = 500;

    if (error instanceof Error) {
      errorDetails = error.message;
      errorMessage = error.name === 'Error' ? 'Role Update Error' : error.name;
      if (error.message.startsWith('Forbidden:')) {
        statusCode = 403;
      } else if (error.message.includes('not found')) {
        statusCode = 404;
      }
    }
    
    const stack = process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : String(error)) : undefined;
    return NextResponse.json({ error: errorMessage, details: errorDetails, stack }, { status: statusCode });
  }
}
