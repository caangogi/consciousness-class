// src/app/api/lesson/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@back/user/infrastructure/auth';
import { lessonService } from '@back/lesson/infrastructure/context';
import { UpdateLessonDTO, DeleteLessonDTO } from '@back/lesson/application/dto';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await authenticate(_request);

    const result = await lessonService.getById({ lessonId: params.id });
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

    const dto = (await request.json()) as UpdateLessonDTO;
    if (dto.lessonId !== params.id) {
      return NextResponse.json({ error: 'ID mismatch' }, { status: 400 });
    }

    const result = await lessonService.update(dto);
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

    const result = await lessonService.delete({ lessonId: params.id });
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
