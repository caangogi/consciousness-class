import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { courseService } from '@back/course/infrastructure/context';
import { CreateCourseDTO } from '@back/course/application/dto/CreateCourseDTO';
import { authenticate } from '@back/user/infrastructure/auth';
import { Role } from '@back/user/domain/Role';

export async function POST(request: NextRequest) {
  // Solo instructores y admins pueden crear cursos
  const currentUser = await authenticate(request);
  if (![Role.SuperAdmin, Role.Instructor].includes(currentUser.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const dto: CreateCourseDTO = await request.json();
  // Sobreescribir instructorId con el actual para seguridad
  dto.instructorId = currentUser.uid;
  const result = await courseService.register(dto);
  if (result.isFailure) {
    return NextResponse.json({ error: result.error.message }, { status: 400 });
  }
  return NextResponse.json({ id: result.getValue() }, { status: 201 });
}

export async function GET(request: NextRequest) {
  const currentUser = await authenticate(request);
  // list all courses for instructor or all if admin
  const instructorId = currentUser.role === Role.SuperAdmin
    ? request.nextUrl.searchParams.get('instructorId') || ''
    : currentUser.uid;
  const result = await courseService.listByInstructor(instructorId);
  if (result.isFailure) {
    return NextResponse.json({ error: result.error.message }, { status: 400 });
  }
  return NextResponse.json(result.getValue(), { status: 200 });
}