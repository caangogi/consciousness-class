
// src/app/api/courses/[courseId]/modules/[moduleId]/lessons/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { LessonService } from '@/features/course/application/lesson.service';
import { FirebaseLessonRepository } from '@/features/course/infrastructure/repositories/firebase-lesson.repository';
import { FirebaseModuleRepository } from '@/features/course/infrastructure/repositories/firebase-module.repository';
import { FirebaseCourseRepository } from '@/features/course/infrastructure/repositories/firebase-course.repository';
import type { CreateLessonDto } from '@/features/course/infrastructure/dto/create-lesson.dto';

interface RouteParams {
  params: { courseId: string; moduleId: string };
}

// POST handler to create a new lesson for a module
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { courseId, moduleId } = params;
    if (!courseId || !moduleId) {
      return NextResponse.json({ error: 'Bad Request: Missing course ID or module ID in path.' }, { status: 400 });
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
      console.error('Error verifying ID token:', error);
      return NextResponse.json({ error: 'Unauthorized: Invalid ID token', details: error.message }, { status: 401 });
    }
    const creatorUid = decodedToken.uid;

    const createLessonDto: CreateLessonDto = await request.json();
    if (!createLessonDto.nombre || !createLessonDto.contenidoPrincipal || !createLessonDto.contenidoPrincipal.tipo || !createLessonDto.duracionEstimada) {
      return NextResponse.json({ error: 'Missing required fields for lesson (nombre, contenidoPrincipal.tipo, duracionEstimada).' }, { status: 400 });
    }

    const lessonRepository = new FirebaseLessonRepository();
    const moduleRepository = new FirebaseModuleRepository();
    const courseRepository = new FirebaseCourseRepository();
    const lessonService = new LessonService(lessonRepository, moduleRepository, courseRepository);

    const newLesson = await lessonService.createLesson(courseId, moduleId, createLessonDto, creatorUid);

    return NextResponse.json({ message: 'Lesson created successfully', lessonId: newLesson.id, lesson: newLesson.toPlainObject() }, { status: 201 });

  } catch (error: any) {
    console.error(`Error in POST /api/courses/.../modules/.../lessons:`, error);
    let errorMessage = 'Internal Server Error';
    let errorDetails = 'An unexpected error occurred while creating the lesson.';
    let statusCode = 500;

    if (error instanceof Error) {
      errorDetails = error.message;
      errorMessage = error.name === 'Error' ? 'Lesson Creation Error' : error.name;
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

// GET handler to retrieve all lessons for a module
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { courseId, moduleId } = params;
    if (!courseId || !moduleId) {
      return NextResponse.json({ error: 'Bad Request: Missing course ID or module ID in path.' }, { status: 400 });
    }
    
    // Potentially add auth check here if lessons are not public by default
    // For now, assuming if one can get modules, one can get lessons of those modules.

    const lessonRepository = new FirebaseLessonRepository();
    const moduleRepository = new FirebaseModuleRepository(); // LessonService needs these
    const courseRepository = new FirebaseCourseRepository(); // LessonService needs these
    const lessonService = new LessonService(lessonRepository, moduleRepository, courseRepository);
    
    // The requesterUid part is optional, can be enhanced later for specific user checks
    const lessons = await lessonService.getLessonsByModuleId(courseId, moduleId);
    const lessonsData = lessons.map(l => l.toPlainObject());

    return NextResponse.json({ lessons: lessonsData }, { status: 200 });

  } catch (error: any) {
    console.error(`Error in GET /api/courses/.../modules/.../lessons:`, error);
    let errorMessage = 'Internal Server Error';
    let errorDetails = 'An unexpected error occurred while fetching lessons.';
    let statusCode = 500;

     if (error instanceof Error) {
      errorDetails = error.message;
      errorMessage = error.name === 'Error' ? 'Lesson Fetch Error' : error.name;
       if (error.message.includes('not found')) {
        statusCode = 404;
      }
    }
    
    const stack = process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : String(error)) : undefined;
    return NextResponse.json({ error: errorMessage, details: errorDetails, stack }, { status: statusCode });
  }
}
