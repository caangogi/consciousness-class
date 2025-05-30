import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { courseService } from '@back/course/infrastructure/context';
import { authenticate } from '@back/user/infrastructure/auth';
import { Role } from '@back/user/domain/Role';
import { UpdateCourseDTO } from '@back/course/application/dto/UpdateCourseDTO';

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const result = await courseService.getById(params.id);
  if (result.isFailure) {
    return NextResponse.json({ error: result.error.message }, { status: 404 });
  }
  return NextResponse.json(result.getValue(), { status: 200 });
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const currentUser = await authenticate(request);
  const courseId = params.id;

  const courseResult = await courseService.getById(courseId);
  // CORRECCIÓN: Usar isFailure y error
  if (courseResult.isFailure) {
      return NextResponse.json({ error: courseResult.error.message }, { status: 404 });
  }
  const course = courseResult.getValue(); // CORRECCIÓN: Usar getValue() para obtener el valor del Result

  if (currentUser.role !== Role.SuperAdmin && currentUser.uid !== course.instructorId) {
    return NextResponse.json({ error: 'Forbidden: You are not the instructor of this course.' }, { status: 403 });
  }

  const dto: UpdateCourseDTO = await request.json();
  dto.courseId = courseId;

  const result = await courseService.update(dto);
  // CORRECCIÓN: Usar isFailure y error
  if (result.isFailure) {
    return NextResponse.json({ error: result.error.message }, { status: 400 });
  }
  return NextResponse.json(null, { status: 200 });
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const currentUser = await authenticate(request);
  const courseId = params.id;

  const courseResult = await courseService.getById(courseId);
  // CORRECCIÓN: Usar isFailure y error
  if (courseResult.isFailure) {
      return NextResponse.json({ error: courseResult.error.message }, { status: 404 });
  }
  const course = courseResult.getValue(); // CORRECCIÓN: Usar getValue() para obtener el valor del Result

  if (currentUser.role !== Role.SuperAdmin && currentUser.uid !== course.instructorId) {
      return NextResponse.json({ error: 'Forbidden: You are not the instructor of this course.' }, { status: 403 });
  }

  const result = await courseService.delete(courseId);
  // CORRECCIÓN: Usar isFailure y error
  if (result.isFailure) {
    return NextResponse.json({ error: result.error.message }, { status: 400 });
  }
  return new NextResponse(null, { status: 204 });
}