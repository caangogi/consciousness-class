
// src/app/api/courses/[courseId]/enroll/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { EnrollmentService } from '@/features/enrollment/application/enrollment.service';
import { FirebaseUserRepository } from '@/features/user/infrastructure/repositories/firebase-user.repository';
import { FirebaseCourseRepository } from '@/features/course/infrastructure/repositories/firebase-course.repository';

interface RouteParams {
  params: { courseId: string };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const courseId = params.courseId;
    if (!courseId) {
      return NextResponse.json({ error: 'Bad Request: Missing course ID in path.' }, { status: 400 });
    }

    const authorization = request.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing or invalid token format' }, { status: 401 });
    }
    const idToken = authorization.split('Bearer ')[1];

    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch (error: any) {
      console.error('Error verifying ID token in /api/courses/[courseId]/enroll:', error);
      return NextResponse.json({ error: 'Unauthorized: Invalid ID token', details: error.message }, { status: 401 });
    }
    const userId = decodedToken.uid;

    const userRepository = new FirebaseUserRepository();
    const courseRepository = new FirebaseCourseRepository();
    const enrollmentService = new EnrollmentService(userRepository, courseRepository);

    await enrollmentService.enrollStudentToCourse(userId, courseId);

    return NextResponse.json({ message: 'Successfully enrolled in course.' }, { status: 200 });

  } catch (error: any) {
    console.error(`Error in POST /api/courses/${params.courseId}/enroll:`, error);
    let errorMessage = 'Internal Server Error';
    let errorDetails = 'An unexpected error occurred during enrollment.';
    let statusCode = 500;

    if (error instanceof Error) {
      errorDetails = error.message;
      errorMessage = error.name === 'Error' ? 'Enrollment Error' : error.name;
      if (error.message.includes('not found')) {
        statusCode = 404;
      } else if (error.message.includes('already enrolled') || error.message.includes('not currently available')) {
        statusCode = 409; // Conflict or Bad Request if trying to enroll in unavailable
      } else if (error.message.startsWith('Forbidden:')) {
        statusCode = 403;
      }
    }
    
    const stack = process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : String(error)) : undefined;
    return NextResponse.json({ error: errorMessage, details: errorDetails, stack }, { status: statusCode });
  }
}
