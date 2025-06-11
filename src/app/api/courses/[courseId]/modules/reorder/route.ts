// src/app/api/courses/[courseId]/modules/reorder/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { CourseService } from '@/features/course/application/course.service';
import { FirebaseCourseRepository } from '@/features/course/infrastructure/repositories/firebase-course.repository';

interface RouteParams {
  params: { courseId: string };
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
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
    const updaterUid = decodedToken.uid;

    const { orderedModuleIds } = await request.json();
    if (!Array.isArray(orderedModuleIds) || !orderedModuleIds.every(id => typeof id === 'string')) {
      return NextResponse.json({ error: 'Bad Request: "orderedModuleIds" must be an array of strings.' }, { status: 400 });
    }

    const courseRepository = new FirebaseCourseRepository();
    const courseService = new CourseService(courseRepository);

    const updatedCourse = await courseService.reorderModules(courseId, orderedModuleIds, updaterUid);

    if (!updatedCourse) {
      // This case might mean course not found or reorder failed internally if service returns null for that
      return NextResponse.json({ error: 'Course not found or reorder failed.' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Modules reordered successfully', course: updatedCourse.toPlainObject() }, { status: 200 });

  } catch (error: any) {
    console.error(`Error in PUT /api/courses/${params.courseId}/modules/reorder:`, error);
    let errorMessage = 'Internal Server Error';
    let errorDetails = 'An unexpected error occurred while reordering modules.';
    let statusCode = 500;

    if (error instanceof Error) {
      errorDetails = error.message;
      errorMessage = error.name === 'Error' ? 'Module Reorder Error' : error.name;
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
