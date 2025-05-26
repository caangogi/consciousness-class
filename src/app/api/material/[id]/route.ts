// src/app/api/material/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@back/user/infrastructure/auth';
import { materialService } from '@back/material/infrastructure/context';
import { UpdateMaterialDTO, DeleteMaterialDTO } from '@back/material/application/dto';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await authenticate(_request);

    const result = await materialService.getById({ materialId: params.id });
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

    const dto = (await request.json()) as UpdateMaterialDTO;
    if (dto.materialId !== params.id) {
      return NextResponse.json({ error: 'ID mismatch' }, { status: 400 });
    }

    const result = await materialService.update(dto);
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

    const result = await materialService.delete({ materialId: params.id });
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
