import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { courseService } from '@back/course/infrastructure/context';
import { authenticate } from '@back/user/infrastructure/auth';
import { Role } from '@back/user/domain/Role';

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const result = await courseService.getById(params.id);
  if (result.isFailure) {
    return NextResponse.json({ error: result.error.message }, { status: 404 });
  }
  return NextResponse.json(result.getValue(), { status: 200 });
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const currentUser = await authenticate(request);
  // Solo instructor dueño o admin
  if (currentUser.role !== Role.SuperAdmin && currentUser.uid !== params.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const dto = await request.json();
  dto.id = params.id;
  const result = await courseService.update(dto);
  if (result.isFailure) {
    return NextResponse.json({ error: result.error.message }, { status: 400 });
  }
  return NextResponse.json(null, { status: 200 });
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const currentUser = await authenticate(request);
  if (currentUser.role !== Role.SuperAdmin && currentUser.uid !== params.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const result = await courseService.delete(params.id);
  if (result.isFailure) {
    return NextResponse.json({ error: result.error.message }, { status: 400 });
  }
  return new NextResponse(null, { status: 204 });
}