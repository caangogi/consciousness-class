// src/app/api/courses/[courseId]/modules/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { ModuleService } from '@/features/course/application/module.service';
import { FirebaseModuleRepository } from '@/features/course/infrastructure/repositories/firebase-module.repository';
import { FirebaseCourseRepository } from '@/features/course/infrastructure/repositories/firebase-course.repository';
import type { CreateModuleDto } from '@/features/course/infrastructure/dto/create-module.dto';

interface RouteParams {
  params: { courseId: string };
}

// POST handler to create a new module for a course
export async function POST(request: NextRequest, { params }: RouteParams) {
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
      console.error('Error verifying ID token in /api/courses/[courseId]/modules POST:', error);
      return NextResponse.json({ error: 'Unauthorized: Invalid ID token', details: error.message }, { status: 401 });
    }
    const creatorUid = decodedToken.uid;

    const createModuleDto: CreateModuleDto = await request.json();
    if (!createModuleDto.nombre) {
      return NextResponse.json({ error: 'Missing required field: nombre for module.' }, { status: 400 });
    }

    const moduleRepository = new FirebaseModuleRepository();
    const courseRepository = new FirebaseCourseRepository(); // ModuleService needs this
    const moduleService = new ModuleService(moduleRepository, courseRepository);

    const newModule = await moduleService.createModule(courseId, createModuleDto, creatorUid);

    return NextResponse.json({ message: 'Module created successfully', moduleId: newModule.id, module: newModule.toPlainObject() }, { status: 201 });

  } catch (error: any) {
    console.error(`Error in POST /api/courses/${params?.courseId}/modules:`, error);
    let errorMessage = 'Internal Server Error';
    let errorDetails = 'An unexpected error occurred while creating the module.';
    let statusCode = 500;

    if (error instanceof Error) {
      errorDetails = error.message;
      errorMessage = error.name === 'Error' ? 'Module Creation Error' : error.name;
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

// GET handler to retrieve all modules for a course
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const courseId = params.courseId;
    if (!courseId) {
      return NextResponse.json({ error: 'Bad Request: Missing course ID in path.' }, { status: 400 });
    }
    
    // Publicly accessible for now, or add auth check if modules should be protected
    // For example, check if user is enrolled or is the creator
    // const authorization = request.headers.get('Authorization'); // Example if auth needed
    // ... verify token ...

    const moduleRepository = new FirebaseModuleRepository();
    const courseRepository = new FirebaseCourseRepository(); // ModuleService needs this
    const moduleService = new ModuleService(moduleRepository, courseRepository);
    
    const modules = await moduleService.getModulesByCourseId(courseId);
    const modulesData = modules.map(m => m.toPlainObject());

    return NextResponse.json({ modules: modulesData }, { status: 200 });

  } catch (error: any) {
    console.error(`Error in GET /api/courses/${params?.courseId}/modules:`, error);
    let errorMessage = 'Internal Server Error';
    let errorDetails = 'An unexpected error occurred while fetching modules.';
    let statusCode = 500;

     if (error instanceof Error) {
      errorDetails = error.message;
      errorMessage = error.name === 'Error' ? 'Module Fetch Error' : error.name;
       if (error.message.includes('not found')) {
        statusCode = 404;
      }
    }
    
    const stack = process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : String(error)) : undefined;
    return NextResponse.json({ error: errorMessage, details: errorDetails, stack }, { status: statusCode });
  }
}
