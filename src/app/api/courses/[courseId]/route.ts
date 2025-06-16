// src/app/api/courses/[courseId]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { CourseService } from '@/features/course/application/course.service';
import { FirebaseCourseRepository } from '@/features/course/infrastructure/repositories/firebase-course.repository';
// Potentially add adminAuth for creator verification if needed for GET, though may not be required if page is already protected
// import { adminAuth } from '@/lib/firebase/admin';

interface RouteContext {
  params: { courseId: string };
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const routeParams = await context.params;
    const courseId = routeParams.courseId;
    if (!courseId) {
      return NextResponse.json({ error: 'Bad Request: Missing course ID in path.' }, { status: 400 });
    }

    // Optional: Verify user or role if courses are not publicly queryable by ID
    // For now, assuming if the calling page (creator dashboard) is protected, this is sufficient.
    // If this endpoint were for public course pages, auth might not be needed or would differ.

    const courseRepository = new FirebaseCourseRepository();
    const courseService = new CourseService(courseRepository);

    const course = await courseService.getCourseById(courseId);

    if (!course) {
      return NextResponse.json({ error: 'Course not found.' }, { status: 404 });
    }

    return NextResponse.json({ course: course.toPlainObject() }, { status: 200 });

  } catch (error: any) {
    const paramsForError = await context.params; // Re-await if error happens before initial await
    console.error(`Error in GET /api/courses/${paramsForError?.courseId}:`, error);
    let errorMessage = 'Internal Server Error';
    let errorDetails = 'An unexpected error occurred while fetching the course.';
    let statusCode = 500;

    if (error instanceof Error) {
      errorDetails = error.message;
      errorMessage = error.name === 'Error' ? 'Course Fetch Error' : error.name;
      if (error.message.includes('not found')) { // Should be caught by !course check earlier
        statusCode = 404;
      }
    }
    
    const stack = process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : String(error)) : undefined;
    return NextResponse.json({ error: errorMessage, details: errorDetails, stack }, { status: statusCode });
  }
}
