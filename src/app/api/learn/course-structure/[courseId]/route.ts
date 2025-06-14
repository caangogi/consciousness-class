
// src/app/api/learn/course-structure/[courseId]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { CourseService } from '@/features/course/application/course.service';
import { ModuleService } from '@/features/course/application/module.service';
import { LessonService } from '@/features/course/application/lesson.service';
import { FirebaseCourseRepository } from '@/features/course/infrastructure/repositories/firebase-course.repository';
import { FirebaseModuleRepository } from '@/features/course/infrastructure/repositories/firebase-module.repository';
import { FirebaseLessonRepository } from '@/features/course/infrastructure/repositories/firebase-lesson.repository';
import type { ModuleProperties } from '@/features/course/domain/entities/module.entity';
import type { LessonProperties } from '@/features/course/domain/entities/lesson.entity';

// Define a type for the module with its lessons
interface ModuleWithLessons extends ModuleProperties {
  lessons: LessonProperties[];
}

interface RouteParams {
  params: { courseId: string };
}

export async function GET(request: NextRequest, { params }: RouteParams) { 
  const courseId = params.courseId; // Correctly access courseId from destructured params
  console.log(`[API /learn/course-structure] Received request for courseId: ${courseId}`);
  try {
    if (!courseId) {
      console.error('[API /learn/course-structure] Bad Request: Missing course ID in path.');
      return NextResponse.json({ error: 'Bad Request: Missing course ID in path.' }, { status: 400 });
    }

    // Initialize repositories
    const courseRepository = new FirebaseCourseRepository();
    const moduleRepository = new FirebaseModuleRepository();
    const lessonRepository = new FirebaseLessonRepository();

    // Initialize services
    const courseService = new CourseService(courseRepository);
    const moduleService = new ModuleService(moduleRepository, courseRepository);
    const lessonService = new LessonService(lessonRepository, moduleRepository, courseRepository);

    // 1. Fetch course details
    console.log(`[API /learn/course-structure] Fetching course details for ID: ${courseId}`);
    const course = await courseService.getCourseById(courseId);
    if (!course) {
      console.warn(`[API /learn/course-structure] Course not found for ID: ${courseId}`);
      return NextResponse.json({ error: 'Course not found.' }, { status: 404 });
    }
    console.log(`[API /learn/course-structure] Course found: ${course.nombre}`);
     // Ensure course is published for public learn access (can be bypassed for creators/admins if needed)
    // if (course.estado !== 'publicado') {
    //   return NextResponse.json({ error: 'Course not available.' }, { status: 403 });
    // }


    // 2. Fetch modules for the course (already ordered by ModuleService)
    console.log(`[API /learn/course-structure] Fetching modules for course ID: ${courseId}`);
    const modules = await moduleService.getModulesByCourseId(courseId);
    console.log(`[API /learn/course-structure] Found ${modules.length} modules for course ID: ${courseId}`);

    // 3. Fetch lessons for each module (already ordered by LessonService)
    const modulesWithLessons: ModuleWithLessons[] = [];
    for (const module of modules) {
      console.log(`[API /learn/course-structure] Fetching lessons for module ID: ${module.id} (Course: ${courseId})`);
      const lessons = await lessonService.getLessonsByModuleId(courseId, module.id);
      console.log(`[API /learn/course-structure] Found ${lessons.length} lessons for module ID: ${module.id}`);
      modulesWithLessons.push({
        ...module.toPlainObject(),
        lessons: lessons.map(lesson => lesson.toPlainObject()),
      });
    }
    console.log(`[API /learn/course-structure] Successfully assembled course structure for course ID: ${courseId}`);
    return NextResponse.json({
      course: course.toPlainObject(),
      modules: modulesWithLessons,
    }, { status: 200 });

  } catch (error: any) {
    console.error(`[API /learn/course-structure] Error for courseId ${courseId}:`, error);
    let errorMessage = 'Internal Server Error';
    let errorDetails = 'An unexpected error occurred while fetching the course structure.';
    let statusCode = 500;

    if (error instanceof Error) {
      errorDetails = error.message;
      errorMessage = error.name === 'Error' ? 'Course Structure Fetch Error' : error.name;
      if (error.message.includes('not found')) {
        statusCode = 404;
      } else if (error.message.startsWith('Forbidden:')) {
         statusCode = 403;
      }
    }
    
    const stack = process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : String(error)) : undefined;
    return NextResponse.json({ error: errorMessage, details: errorDetails, stack }, { status: statusCode });
  }
}
    
