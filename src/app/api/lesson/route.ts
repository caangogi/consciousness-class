// src/app/api/lesson/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@back/user/infrastructure/auth';
import { lessonService } from '@back/lesson/infrastructure/context';
import {
  CreateLessonDTO,
  ListLessonsByModuleDTO
} from '@back/lesson/application/dto';

export async function POST(request: NextRequest) {
  try {
    // Autenticación y autorización
    const currentUser = await authenticate(request);
    if (!['Instructor', 'SuperAdmin'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Creamos la lección con courseId y moduleId
    const dto = (await request.json()) as CreateLessonDTO;

    console.log('BACK DTO', dto)

    // dto debe tener: { courseId, moduleId, title, content, order, overview?, faqs? }
    const result = await lessonService.create(dto);
    if (result.isFailure) {
      return NextResponse.json(
        { error: result.error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { id: result.getValue() },
      { status: 201 }
    );
  } catch (err: any) {
    console.error(err);
    if (err.message.startsWith('Missing or invalid Authorization')) {
      return NextResponse.json(
        { error: err.message },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await authenticate(request);

    // Extraemos courseId y moduleId de la query
    const url = request.nextUrl;
    const courseId = url.searchParams.get('courseId');
    const moduleId = url.searchParams.get('moduleId');

    if (!courseId || !moduleId) {
      return NextResponse.json(
        { error: 'Missing courseId or moduleId' },
        { status: 400 }
      );
    }

    // Listamos las lecciones con ambos parámetros
    const listDto: ListLessonsByModuleDTO = { courseId, moduleId };
    const result = await lessonService.listByModule(listDto);
    if (result.isFailure) {
      return NextResponse.json(
        { error: result.error.message },
        { status: 404 }
      );
    }

    // Devolvemos el array de LessonPersistence
    const lessons = result.getValue().map(lesson => lesson.toPersistence());
    return NextResponse.json(lessons, { status: 200 });
  } catch (err: any) {
    console.error(err);
    if (err.message.startsWith('Missing or invalid Authorization')) {
      return NextResponse.json(
        { error: err.message },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
