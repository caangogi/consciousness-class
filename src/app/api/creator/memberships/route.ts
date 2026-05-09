import { NextResponse, type NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { MembershipService } from '@/backend/membership/application/membership.service';
import { FirebaseMembershipRepository } from '@/backend/membership/infrastructure/repositories/firebase-membership.repository';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const idToken = authorization.split('Bearer ')[1];
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const body = await request.json();
    if (!body.title) {
      return NextResponse.json({ error: 'El título es obligatorio' }, { status: 400 });
    }

    const service = new MembershipService(new FirebaseMembershipRepository());
    const entity = await service.create({
      title: body.title,
      shortDescription: body.shortDescription || '',
      price: body.price || 0,
      billingInterval: body.billingInterval || 'monthly',
      trialDays: body.trialDays || 0,
      coverUrl: body.coverUrl || null,
    }, decodedToken.uid);

    return NextResponse.json({ success: true, id: entity.id }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/creator/memberships:', error);
    return NextResponse.json({ error: 'Error del servidor', details: error.message }, { status: 500 });
  }
}
