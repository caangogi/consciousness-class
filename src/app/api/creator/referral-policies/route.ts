import { NextResponse, type NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { FirebaseReferralPolicyRepository } from '@/backend/referrals/infrastructure/repositories/firebase-referral-policy.repository';
import { ReferralPolicyEntity } from '@/backend/referrals/domain/entities/referral-policy.entity';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const creatorUid = decodedToken.uid;

    const repo = new FirebaseReferralPolicyRepository();
    const policies = await repo.findByCreatorUid(creatorUid);

    return NextResponse.json(policies.map(p => p.toPlainObject()));
  } catch (error: any) {
    console.error('Error fetching referral policies:', error);
    return NextResponse.json({ error: 'Error al obtener políticas' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const creatorUid = decodedToken.uid;

    const body = await req.json();
    const { name, tier1Percentage, tier2Percentage } = body;

    if (!name || typeof tier1Percentage !== 'number') {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    const newPolicy = new ReferralPolicyEntity({
      id: crypto.randomUUID(),
      creatorUid,
      name,
      tier1Percentage,
      tier2Percentage: tier2Percentage || 0,
      isDefault: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const repo = new FirebaseReferralPolicyRepository();
    await repo.save(newPolicy);

    return NextResponse.json(newPolicy.toPlainObject(), { status: 201 });
  } catch (error: any) {
    console.error('Error creating referral policy:', error);
    return NextResponse.json({ error: 'Error al crear política' }, { status: 500 });
  }
}
