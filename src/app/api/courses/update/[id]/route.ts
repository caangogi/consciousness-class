// src/app/api/courses/update/[id]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { CourseService } from '@/features/course/application/course.service';
import { FirebaseCourseRepository } from '@/features/course/infrastructure/repositories/firebase-course.repository';
import type { UpdateCourseDto } from '@/features/course/infrastructure/dto/update-course.dto';

interface RouteParams {
  params: { id: string };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const courseId = params.id;
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
      console.error('Error verifying ID token in /api/courses/update:', error);
      return NextResponse.json({ error: 'Unauthorized: Invalid ID token', details: error.message }, { status: 401 });
    }

    const updaterUid = decodedToken.uid;
    const updateCourseDto: UpdateCourseDto = await request.json();

    // Basic validation for DTO
    if (!updateCourseDto.nombre || !updateCourseDto.categoria || !updateCourseDto.tipoAcceso) {
      return NextResponse.json({ error: 'Missing required fields: nombre, categoria, and tipoAcceso are required for update.' }, { status: 400 });
    }
    if (typeof updateCourseDto.precio !== 'number' || updateCourseDto.precio < 0) {
        return NextResponse.json({ error: 'Invalid precio: must be a non-negative number.'}, {status: 400});
    }

    const courseRepository = new FirebaseCourseRepository();
    const courseService = new CourseService(courseRepository);

    const updatedCourse = await courseService.updateCourse(courseId, updateCourseDto, updaterUid);

    if (!updatedCourse) {
      // This could be due to course not found or updater not being the creator (handled by service)
      // The service throws specific errors for forbidden access, which would be caught below.
      // So, if null here, it's likely 'not found'.
      return NextResponse.json({ error: 'Course not found or update failed internally.' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Course updated successfully', courseId: updatedCourse.id, course: updatedCourse.toPlainObject() }, { status: 200 });

  } catch (error: any) {
    console.error(`Error in POST /api/courses/update/${params?.id}:`, error);
    let errorMessage = 'Internal Server Error';
    let errorDetails = 'An unexpected error occurred while updating the course.';
    let statusCode = 500;
    
    if (error instanceof Error) {
      errorDetails = error.message;
      errorMessage = error.name === 'Error' ? 'Course Update Error' : error.name;
      if (error.message.startsWith('Forbidden:')) {
        statusCode = 403;
        errorMessage = 'Forbidden';
      }
    }
    
    const stack = process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : String(error)) : undefined;

    return NextResponse.json({ error: errorMessage, details: errorDetails, stack }, { status: statusCode });
  }
}
