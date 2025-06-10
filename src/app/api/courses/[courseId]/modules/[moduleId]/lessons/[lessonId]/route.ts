
// src/app/api/courses/[courseId]/modules/[moduleId]/lessons/[lessonId]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { LessonService } from '@/features/course/application/lesson.service';
import { FirebaseLessonRepository } from '@/features/course/infrastructure/repositories/firebase-lesson.repository';
import { FirebaseModuleRepository } from '@/features/course/infrastructure/repositories/firebase-module.repository';
import { FirebaseCourseRepository } from '@/features/course/infrastructure/repositories/firebase-course.repository';
import type { UpdateLessonDto } from '@/features/course/infrastructure/dto/update-lesson.dto';

interface RouteParams {
  params: { courseId: string; moduleId: string; lessonId: string };
}

// Helper to initialize services
function initializeServices() {
  const lessonRepository = new FirebaseLessonRepository();
  const moduleRepository = new FirebaseModuleRepository();
  const courseRepository = new FirebaseCourseRepository();
  return new LessonService(lessonRepository, moduleRepository, courseRepository);
}

// PUT handler to update a specific lesson
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { courseId, moduleId, lessonId } = params;
    if (!courseId || !moduleId || !lessonId) {
      return NextResponse.json({ error: 'Bad Request: Missing course, module, or lesson ID in path.' }, { status: 400 });
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
    const updaterUid = decodedToken.uid;

    const updateLessonDto: UpdateLessonDto = await request.json();
    // Add DTO validation if necessary, e.g. ensure at least one field is present.

    const lessonService = initializeServices();
    const updatedLesson = await lessonService.updateLesson(courseId, moduleId, lessonId, updateLessonDto, updaterUid);

    if (!updatedLesson) {
      return NextResponse.json({ error: 'Lesson not found or update failed.' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Lesson updated successfully', lesson: updatedLesson.toPlainObject() }, { status: 200 });

  } catch (error: any) {
    console.error(`Error in PUT /api/courses/.../modules/.../lessons/${params.lessonId}:`, error);
    let errorMessage = 'Internal Server Error';
    let errorDetails = 'An unexpected error occurred while updating the lesson.';
    let statusCode = 500;

    if (error instanceof Error) {
      errorDetails = error.message;
      errorMessage = error.name === 'Error' ? 'Lesson Update Error' : error.name;
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

// DELETE handler to delete a specific lesson
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { courseId, moduleId, lessonId } = params;
    if (!courseId || !moduleId || !lessonId) {
      return NextResponse.json({ error: 'Bad Request: Missing course, module, or lesson ID in path.' }, { status: 400 });
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
    const deleterUid = decodedToken.uid;

    const lessonService = initializeServices();
    await lessonService.deleteLesson(courseId, moduleId, lessonId, deleterUid);

    return NextResponse.json({ message: 'Lesson deleted successfully' }, { status: 200 }); // Or 204 No Content

  } catch (error: any) {
    console.error(`Error in DELETE /api/courses/.../modules/.../lessons/${params.lessonId}:`, error);
    let errorMessage = 'Internal Server Error';
    let errorDetails = 'An unexpected error occurred while deleting the lesson.';
    let statusCode = 500;

    if (error instanceof Error) {
      errorDetails = error.message;
      errorMessage = error.name === 'Error' ? 'Lesson Deletion Error' : error.name;
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
