import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { userService } from '@back/user/infrastructure/context';
import { authenticate } from '@back/user/infrastructure/auth';
import { Role } from '@back/user/domain/Role';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {

        const currentUser = await authenticate(request);
        // Solo SuperAdmin o el mismo usuario pueden ver
        if (currentUser.role !== Role.SuperAdmin && currentUser.uid !== params.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        const result = await userService.getById(params.id);
        if (result.isFailure) {
            return NextResponse.json({ error: result.error.message }, { status: 400 });
        }
        return NextResponse.json(result.getValue(), { status: 200 });

    } catch (error) {
        return NextResponse.json({ error: `Internal Server Error. msg: ${error}` }, { status: 500 });
        
    }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    
    try {
        const currentUser = await authenticate(request);
        // Solo SuperAdmin o el mismo usuario pueden editar
        if (currentUser.role !== Role.SuperAdmin && currentUser.uid !== params.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        const dto = await request.json();
        const result = await userService.updateProfile(dto);
        if (result.isFailure) {
            return NextResponse.json({ error: result.error.message }, { status: 400 });
        }
        return NextResponse.json(null, { status: 200 });

    } catch (error) {
        return NextResponse.json({ error: `Internal Server Error. msg: ${error}` }, { status: 500 });
    }

}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
 try {
        
    const currentUser = await authenticate(request);
    // Solo SuperAdmin o el mismo usuario pueden eliminar
    if (currentUser.role !== Role.SuperAdmin && currentUser.uid !== params.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const result = await userService.delete(params.id);
    if (result.isFailure) {
        return NextResponse.json({ error: result.error.message }, { status: 400 });
    }
    return NextResponse.json(null, { status: 200 });
    
 } catch (error) {

    return NextResponse.json({ error: `Internal Server Error. msg: ${error}` }, { status: 500 });
    
 };
}