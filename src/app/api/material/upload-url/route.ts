// src/app/api/material/upload-url/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@back/user/infrastructure/auth';
import { materialService } from '@back/material/infrastructure/context';
import { GetUploadUrlDTO } from '@back/material/application/dto';

export async function POST(request: NextRequest) {

  
  console.log('Upload Request: >>', request)

  try {
    const currentUser = await authenticate(request);

    console.log('CurrentUser::>', currentUser)

    if (!['Instructor', 'SuperAdmin', 'Admin'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const dto = (await request.json()) as GetUploadUrlDTO;

    console.log('DTO:::>', dto)

    const result = await materialService.getUploadUrl(dto);
    if (result.isFailure) {
      return NextResponse.json({ error: result.error.message }, { status: 400 });
    }
    return NextResponse.json(result.getValue(), { status: 200 });
  } catch (err: any) {

    console.log('ERR>>', err)

    if (err.message.startsWith('Missing or invalid Authorization')) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
