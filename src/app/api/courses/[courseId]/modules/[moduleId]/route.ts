// src/app/api/courses/[courseId]/modules/[moduleId]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { ModuleService } from '@/features/course/application/module.service';
import { FirebaseModuleRepository } from '@/features/course/infrastructure/repositories/firebase-module.repository';
import { FirebaseCourseRepository } from '@/features/course/infrastructure/repositories/firebase-course.repository';
import type { UpdateModuleDto } from '@/features/course/infrastructure/dto/update-module.dto';

interface RouteParams {
  params: { courseId: string; moduleId: string };
}

// PUT handler to update a specific module
export async function PUT(request: NextRequest, { params }: RouteParams) {
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
      return NextResponse.json({ error: 'Unauthorized: Invalid ID token', details: error.message }, { status: 401 });
    }
    const updaterUid = decodedToken.uid;

    const updateModuleDto: UpdateModuleDto = await request.json();
    if (!updateModuleDto.nombre && !updateModuleDto.descripcion) {
        return NextResponse.json({ error: 'Bad Request: At least "nombre" or "descripcion" must be provided for update.' }, { status: 400 });
    }


    const moduleRepository = new FirebaseModuleRepository();
    const courseRepository = new FirebaseCourseRepository();
    const moduleService = new ModuleService(moduleRepository, courseRepository);

    const updatedModule = await moduleService.updateModule(courseId, moduleId, updateModuleDto, updaterUid);

    if (!updatedModule) {
      return NextResponse.json({ error: 'Module not found or update failed.' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Module updated successfully', module: updatedModule.toPlainObject() }, { status: 200 });

  } catch (error: any) {
    console.error(`Error in PUT /api/courses/${params.courseId}/modules/${params.moduleId}:`, error);
    let errorMessage = 'Internal Server Error';
    let errorDetails = 'An unexpected error occurred while updating the module.';
    let statusCode = 500;

    if (error instanceof Error) {
      errorDetails = error.message;
      errorMessage = error.name === 'Error' ? 'Module Update Error' : error.name;
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


// DELETE handler to delete a specific module
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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
      return NextResponse.json({ error: 'Unauthorized: Invalid ID token', details: error.message }, { status: 401 });
    }
    const deleterUid = decodedToken.uid;

    const moduleRepository = new FirebaseModuleRepository();
    const courseRepository = new FirebaseCourseRepository();
    const moduleService = new ModuleService(moduleRepository, courseRepository);

    await moduleService.deleteModule(courseId, moduleId, deleterUid);

    return NextResponse.json({ message: 'Module deleted successfully' }, { status: 200 }); // Or 204 No Content

  } catch (error: any) {
    console.error(`Error in DELETE /api/courses/${params.courseId}/modules/${params.moduleId}:`, error);
    let errorMessage = 'Internal Server Error';
    let errorDetails = 'An unexpected error occurred while deleting the module.';
    let statusCode = 500;

    if (error instanceof Error) {
      errorDetails = error.message;
      errorMessage = error.name === 'Error' ? 'Module Deletion Error' : error.name;
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
