
// src/app/api/learn/progress/[courseId]/[lessonId]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { UserCourseProgressService } from '@/features/progress/application/user-course-progress.service';
import { FirebaseUserCourseProgressRepository } from '@/features/progress/infrastructure/repositories/firebase-user-course-progress.repository';
import type { ToggleLessonCompletionDto } from '@/features/progress/infrastructure/dto/toggle-lesson-completion.dto';

interface RouteParams {
  params: { courseId: string; lessonId: string };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { courseId, lessonId } = params;
    if (!courseId || !lessonId) {
      return NextResponse.json({ error: 'Bad Request: Missing course ID or lesson ID in path.' }, { status: 400 });
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

    const body: ToggleLessonCompletionDto = await request.json();
    if (typeof body.totalLessonsInCourse !== 'number' || body.totalLessonsInCourse < 0) {
      return NextResponse.json({ error: 'Bad Request: "totalLessonsInCourse" must be a non-negative number.' }, { status: 400 });
    }

    const progressRepository = new FirebaseUserCourseProgressRepository();
    const progressService = new UserCourseProgressService(progressRepository);

    const updatedProgress = await progressService.toggleLessonCompletion(
      userId,
      courseId,
      lessonId,
      body.totalLessonsInCourse
    );

    return NextResponse.json(updatedProgress.toPlainObject(), { status: 200 });

  } catch (error: any) {
    console.error(`Error in POST /api/learn/progress/${params.courseId}/${params.lessonId}:`, error);
    let errorMessage = 'Internal Server Error';
    let errorDetails = 'An unexpected error occurred while updating lesson progress.';
    let statusCode = 500;

    if (error instanceof Error) {
      errorDetails = error.message;
      errorMessage = error.name === 'Error' ? 'Progress Update Error' : error.name;
    }
    
    const stack = process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : String(error)) : undefined;
    return NextResponse.json({ error: errorMessage, details: errorDetails, stack }, { status: statusCode });
  }
}
