
// src/app/api/learn/progress/[courseId]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { UserCourseProgressService } from '@/features/progress/application/user-course-progress.service';
import { FirebaseUserCourseProgressRepository } from '@/features/progress/infrastructure/repositories/firebase-user-course-progress.repository';

interface RouteParams {
  params: { courseId: string };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
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
      return NextResponse.json({ error: 'Unauthorized: Invalid ID token', details: error.message }, { status: 401 });
    }
    const userId = decodedToken.uid;

    const progressRepository = new FirebaseUserCourseProgressRepository();
    const progressService = new UserCourseProgressService(progressRepository);

    const completedLessonIdsSet = await progressService.getCompletedLessons(userId, courseId);
    const completedLessonIdsArray = Array.from(completedLessonIdsSet);

    return NextResponse.json({ completedLessonIds: completedLessonIdsArray }, { status: 200 });

  } catch (error: any) {
    console.error(`Error in GET /api/learn/progress/${params.courseId}:`, error);
    let errorMessage = 'Internal Server Error';
    let errorDetails = 'An unexpected error occurred while fetching course progress.';
    let statusCode = 500;

    if (error instanceof Error) {
      errorDetails = error.message;
      errorMessage = error.name === 'Error' ? 'Progress Fetch Error' : error.name;
    }
    
    const stack = process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : String(error)) : undefined;
    return NextResponse.json({ error: errorMessage, details: errorDetails, stack }, { status: statusCode });
  }
}
