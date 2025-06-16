
// src/app/api/learn/progress/[courseId]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { UserCourseProgressService } from '@/features/progress/application/user-course-progress.service';
import { FirebaseUserCourseProgressRepository } from '@/features/progress/infrastructure/repositories/firebase-user-course-progress.repository';

interface RouteContext { // Changed from RouteParams to RouteContext
  params: { courseId: string };
}

export async function GET(request: NextRequest, context: RouteContext) { // Changed { params } to context
  try {
    const courseId = context.params.courseId; // Access courseId via context.params
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
    // Use context.params.courseId if available, otherwise try to get from error if it's a request object
    const errorCourseId = context?.params?.courseId || (error?.request?.params?.courseId); 
    console.error(`Error in GET /api/learn/progress/${errorCourseId || '[unknownCourseId]'}:`, error);
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
