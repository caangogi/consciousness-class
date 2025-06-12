
// src/app/api/creator/courses/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { CourseService } from '@/features/course/application/course.service';
import { FirebaseCourseRepository } from '@/features/course/infrastructure/repositories/firebase-course.repository';

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
      console.error('Error verifying ID token in /api/creator/courses:', error);
      return NextResponse.json({ error: 'Unauthorized: Invalid ID token', details: error.message }, { status: 401 });
    }

    const creatorUid = decodedToken.uid;

    // Optional: You might want to verify if the user has a 'creator' role from custom claims or Firestore.
    // For now, we assume if they are calling this endpoint, they are requesting *their* courses.
    // const userRecord = await adminAuth.getUser(creatorUid);
    // if (userRecord.customClaims?.role !== 'creator') {
    //   return NextResponse.json({ error: 'Forbidden: User is not a creator' }, { status: 403 });
    // }

    const courseRepository = new FirebaseCourseRepository();
    const courseService = new CourseService(courseRepository);

    const courses = await courseService.getCoursesByCreator(creatorUid);
    const coursesData = courses.map(course => course.toPlainObject());

    return NextResponse.json({ courses: coursesData }, { status: 200 });

  } catch (error: any) {
    console.error('Error in GET /api/creator/courses:', error);
    let errorMessage = 'Internal Server Error';
    let errorDetails = 'An unexpected error occurred while fetching creator courses.';
    
    if (error instanceof Error) {
      errorDetails = error.message;
      errorMessage = error.name === 'Error' ? 'Creator Courses Fetch Error' : error.name;
    }
    
    const stack = process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : String(error)) : undefined;

    return NextResponse.json({ error: errorMessage, details: errorDetails, stack }, { status: 500 });
  }
}
