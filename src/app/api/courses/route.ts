
// src/app/api/courses/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { CourseService } from '@/features/course/application/course.service';
import { FirebaseCourseRepository } from '@/features/course/infrastructure/repositories/firebase-course.repository';
// No adminAuth needed for public listing

export async function GET(request: NextRequest) {
  try {
    const courseRepository = new FirebaseCourseRepository();
    const courseService = new CourseService(courseRepository);

    const publicCourses = await courseService.getAllPublicCourses();
    const coursesData = publicCourses.map(course => course.toPlainObject());

    return NextResponse.json({ courses: coursesData }, { status: 200 });

  } catch (error: any) {
    console.error('Error in GET /api/courses:', error);
    let errorMessage = 'Internal Server Error';
    let errorDetails = 'An unexpected error occurred while fetching public courses.';
    
    if (error instanceof Error) {
      errorDetails = error.message;
      errorMessage = error.name === 'Error' ? 'Public Courses Fetch Error' : error.name;
    }
    
    const stack = process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : String(error)) : undefined;

    return NextResponse.json({ error: errorMessage, details: errorDetails, stack }, { status: 500 });
  }
}

    