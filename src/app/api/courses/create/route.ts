
// src/app/api/courses/create/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { CourseService } from '@/features/course/application/course.service';
import { FirebaseCourseRepository } from '@/features/course/infrastructure/repositories/firebase-course.repository';
import type { CreateCourseDto } from '@/features/course/infrastructure/dto/create-course.dto';

export async function POST(request: NextRequest) {
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
      console.error('Error verifying ID token in /api/courses/create:', error);
      return NextResponse.json({ error: 'Unauthorized: Invalid ID token', details: error.message }, { status: 401 });
    }

    const creatorUid = decodedToken.uid;
    // TODO: Check if user has 'creator' role from custom claims or Firestore before allowing course creation.
    // For now, any authenticated user can create a course.
    // const userRecord = await adminAuth.getUser(creatorUid);
    // if (userRecord.customClaims?.role !== 'creator') {
    //   return NextResponse.json({ error: 'Forbidden: User is not a creator' }, { status: 403 });
    // }


    const createCourseDto: CreateCourseDto = await request.json();

    // Basic validation for DTO
    if (!createCourseDto.nombre || !createCourseDto.categoria || !createCourseDto.tipoAcceso) {
      return NextResponse.json({ error: 'Missing required fields: nombre, categoria, and tipoAcceso are required.' }, { status: 400 });
    }
    if (typeof createCourseDto.precio !== 'number' || createCourseDto.precio < 0) {
        return NextResponse.json({ error: 'Invalid precio: must be a non-negative number.'}, {status: 400});
    }


    const courseRepository = new FirebaseCourseRepository();
    const courseService = new CourseService(courseRepository);

    const course = await courseService.createCourse(createCourseDto, creatorUid);

    return NextResponse.json({ message: 'Course created successfully', courseId: course.id, course: course.toPlainObject() }, { status: 201 });

  } catch (error: any) {
    console.error('Error in POST /api/courses/create:', error);
    let errorMessage = 'Internal Server Error';
    let errorDetails = 'An unexpected error occurred while creating the course.';
    
    if (error instanceof Error) {
      errorDetails = error.message;
      errorMessage = error.name === 'Error' ? 'Course Creation Error' : error.name;
    }
    
    const stack = process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : String(error)) : undefined;

    return NextResponse.json({ error: errorMessage, details: errorDetails, stack }, { status: 500 });
  }
}
