import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@back/user/infrastructure/auth';
import { materialService } from '@back/material/infrastructure/context';
import { CreateMaterialDTO, ListMaterialsByLessonDTO } from '@back/material/application/dto';

export async function POST(request: NextRequest) {

  console.log('Material Req:::>', request)

  try {
    const currentUser = await authenticate(request);
    if (!['Instructor', 'SuperAdmin'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const dto = (await request.json()) as CreateMaterialDTO;
    const result = await materialService.create(dto);
    if (result.isFailure) {
      return NextResponse.json({ error: result.error.message }, { status: 400 });
    }
    return NextResponse.json({ id: result.getValue() }, { status: 201 });
  } catch (err: any) {

    console.log('Material Error::: >', err)

    if (err.message.startsWith('Missing or invalid Authorization')) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // autenticación
    await authenticate(request);

    // extraemos courseId, moduleId y lessonId
    const url = request.nextUrl;
    const courseId = url.searchParams.get('courseId');
    const moduleId = url.searchParams.get('moduleId');
    const lessonId = url.searchParams.get('lessonId');

    if (!courseId || !moduleId || !lessonId) {
      return NextResponse.json(
        { error: 'Missing courseId, moduleId or lessonId' },
        { status: 400 }
      );
    }

    // listamos los materiales
    const dto: ListMaterialsByLessonDTO = { courseId, moduleId, lessonId };
    const result = await materialService.listByLesson(dto);
    if (result.isFailure) {
      return NextResponse.json(
        { error: result.error.message },
        { status: 404 }
      );
    }

    // devolvemos los registros en formato persistente
    const materials = result
      .getValue()
      .map(m => m.toPersistence());

    return NextResponse.json(materials, { status: 200 });
  } catch (err: any) {
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






