import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { userService } from '@back/user/infrastructure/context';
import { CreateUserDTO } from '@back/user/application/dto/CreateUserDTO';

export async function POST(request: NextRequest) {
  const dto: CreateUserDTO = await request.json();
  const result = await userService.register(dto);
  if (result.isFailure) {
    return NextResponse.json({ error: result.error.message }, { status: 400 });
  }
  return NextResponse.json({ id: result.getValue() }, { status: 201 });
}

export async function GET() {
  return NextResponse.json({ message: 'Not implemented' }, { status: 501 });
}