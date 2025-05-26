import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@back/user/infrastructure/auth';
import { moduleService } from '@back/module/infrastructure/context';
import { CreateModuleDTO } from '@back/module/application/dto/CreateModuleDTO';
import { ListModulesByCourseDTO } from '@back/module/application/dto/ListModulesByCourseDTO';

export async function POST(request: NextRequest) {
  try {
    const currentUser = await authenticate(request);
    // Solo instructores y superadmins pueden añadir módulos
    if (!['Instructor', 'SuperAdmin'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = (await request.json()) as CreateModuleDTO;
    // Aseguramos que el module se crea bajo un curso que el instructor posee
    // (Opcional: validar courseId contra currentUser.uid)

    const result = await moduleService.create(body);
    if (result.isFailure) {
      return NextResponse.json({ error: result.error.message }, { status: 400 });
    }

    return NextResponse.json({ id: result.getValue() }, { status: 201 });
  } catch (err: any) {
    if (err.message.startsWith('Missing or invalid Authorization')) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const currentUser = await authenticate(request);
    // Permitimos que cualquier rol autenticado vea módulos de un curso
    const courseId = request.nextUrl.searchParams.get('courseId');
    if (!courseId) {
      return NextResponse.json({ error: 'Missing courseId' }, { status: 400 });
    }

    const dto: ListModulesByCourseDTO = { courseId };
    const result = await moduleService.listByCourse(dto.courseId);
    if (result.isFailure) {
      return NextResponse.json({ error: result.error.message }, { status: 404 });
    }

    // Serializamos a simple JSON
    const modules = result.getValue().map((mod) => mod.toPersistence());
    return NextResponse.json(modules, { status: 200 });
  } catch (err: any) {
    if (err.message.startsWith('Missing or invalid Authorization')) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
