import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@back/user/infrastructure/auth';
import { moduleService } from '@back/module/infrastructure/context';
import { UpdateModuleDTO } from '@back/module/application/dto/UpdateModuleDTO';
import { DeleteModuleDTO } from '@back/module/application/dto/DeleteModuleDTO';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await authenticate(_request);
    const result = await moduleService.getById(params.id);
    if (result.isFailure) {
      return NextResponse.json({ error: result.error.message }, { status: 404 });
    }
    return NextResponse.json(result.getValue().toPersistence(), { status: 200 });
  } catch (err: any) {
    if (err.message.startsWith('Missing or invalid Authorization')) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await authenticate(request);
    if (!['Instructor', 'SuperAdmin'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = (await request.json()) as UpdateModuleDTO;
    // Aseguramos que el body.moduleId coincide con params.id
    if (body.moduleId !== params.id) {
      return NextResponse.json({ error: 'ID mismatch' }, { status: 400 });
    }

    const result = await moduleService.update(body);
    if (result.isFailure) {
      return NextResponse.json({ error: result.error.message }, { status: 400 });
    }
    return new NextResponse(null, { status: 204 });
  } catch (err: any) {
    if (err.message.startsWith('Missing or invalid Authorization')) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await authenticate(request);
    if (!['Instructor', 'SuperAdmin'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const dto: DeleteModuleDTO = { moduleId: params.id };
    const result = await moduleService.delete(dto);
    if (result.isFailure) {
      return NextResponse.json({ error: result.error.message }, { status: 400 });
    }
    return new NextResponse(null, { status: 204 });
  } catch (err: any) {
    if (err.message.startsWith('Missing or invalid Authorization')) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
