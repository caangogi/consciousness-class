
// src/app/api/superadmin/users/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { UserService } from '@/features/user/application/user.service';
import { FirebaseUserRepository } from '@/features/user/infrastructure/repositories/firebase-user.repository';

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
      console.error('Error verifying ID token in /api/superadmin/users:', error);
      return NextResponse.json({ error: 'Unauthorized: Invalid ID token', details: error.message }, { status: 401 });
    }
    
    const userProfile = await new FirebaseUserRepository().findByUid(decodedToken.uid);
    const isSuperAdmin = userProfile?.role === 'superadmin' || decodedToken.email === process.env.SUPERADMIN_DEV_EMAIL;


    if (!isSuperAdmin) {
       return NextResponse.json({ error: 'Forbidden: User does not have superadmin privileges.' }, { status: 403 });
    }

    const userRepository = new FirebaseUserRepository();
    const userService = new UserService(userRepository);

    // Fetch, for example, the 50 most recently created users
    const users = await userService.getAllUsers(50, 'createdAt', 'desc');
    const usersData = users.map(user => user.toPlainObject());

    return NextResponse.json({ users: usersData }, { status: 200 });

  } catch (error: any) {
    console.error('Error in GET /api/superadmin/users:', error);
    let errorMessage = 'Internal Server Error';
    let errorDetails = 'An unexpected error occurred while fetching users.';
    
    if (error instanceof Error) {
      errorDetails = error.message;
      errorMessage = error.name === 'Error' ? 'Users Fetch Error' : error.name;
       if (error.message.startsWith('Forbidden:')) {
        return NextResponse.json({ error: 'Forbidden', details: error.message }, { status: 403 });
      }
    }
    
    const stack = process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : String(error)) : undefined;
    return NextResponse.json({ error: errorMessage, details: errorDetails, stack }, { status: statusCode });
  }
}
    
