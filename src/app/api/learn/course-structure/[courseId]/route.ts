
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
import { adminDb } from '@/lib/firebase/admin'; // Import adminDb to fetch creator profile
import type { UserProperties } from '@/features/user/domain/entities/user.entity';

// Define a type for the module with its lessons
interface ModuleWithLessons extends ModuleProperties {
  lessons: LessonProperties[];
}

// Define an augmented CourseProperties type for the API response
interface CourseWithCreatorDetails extends CourseProperties {
  creadorNombre?: string;
  creadorAvatarUrl?: string | null;
}

interface RouteContext {
  params: { courseId: string };
}

export async function GET(request: NextRequest, context: RouteContext) { 
  const params = await context.params;
  const courseId = params.courseId; 
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

    let courseWithCreatorDetails: CourseWithCreatorDetails = course.toPlainObject();

    // Fetch creator details
    if (course.creadorUid) {
      try {
        const creatorDoc = await adminDb.collection('usuarios').doc(course.creadorUid).get();
        if (creatorDoc.exists) {
          const creatorData = creatorDoc.data() as UserProperties;
          courseWithCreatorDetails.creadorNombre = creatorData.displayName || `${creatorData.nombre} ${creatorData.apellido}`.trim();
          courseWithCreatorDetails.creadorAvatarUrl = creatorData.photoURL || null;
          console.log(`[API /learn/course-structure] Creator details found for UID ${course.creadorUid}: Name - ${courseWithCreatorDetails.creadorNombre}`);
        } else {
          console.warn(`[API /learn/course-structure] Creator profile not found for UID: ${course.creadorUid}`);
        }
      } catch (creatorError) {
        console.error(`[API /learn/course-structure] Error fetching creator profile for UID ${course.creadorUid}:`, creatorError);
      }
    }


    // 2. Fetch modules for the course (already ordered by ModuleService)
    console.log(`[API /learn/course-structure] Fetching modules for course ID: ${courseId}`);
    const modules = await moduleService.getModulesByCourseId(courseId);
    console.log(`[API /learn/course-structure] Found ${modules.length} modules for course ID: ${courseId}`);

    // 3. Fetch lessons for each module (already ordered by LessonService)
    const modulesWithLessons: ModuleWithLessons[] = [];
    for (const moduleItem of modules) {
      console.log(`[API /learn/course-structure] Fetching lessons for module ID: ${moduleItem.id} (Course: ${courseId})`);
      const lessons = await lessonService.getLessonsByModuleId(courseId, moduleItem.id);
      console.log(`[API /learn/course-structure] Found ${lessons.length} lessons for module ID: ${moduleItem.id}`);
      modulesWithLessons.push({
        ...moduleItem.toPlainObject(),
        lessons: lessons.map(lesson => lesson.toPlainObject()),
      });
    }
    console.log(`[API /learn/course-structure] Successfully assembled course structure for course ID: ${courseId}`);
    return NextResponse.json({
      course: courseWithCreatorDetails,
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
