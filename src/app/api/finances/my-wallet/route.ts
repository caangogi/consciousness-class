import { NextResponse, type NextRequest } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authorization = request.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const idToken = authorization.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const walletDoc = await adminDb.collection('wallets').doc(uid).get();
    
    let wallet = {
        availableBalance: 0,
        pendingBalance: 0,
        totalWithdrawn: 0,
        currency: 'EUR'
    };

    if (walletDoc.exists) {
        wallet = walletDoc.data() as any;
    }

    const txSnap = await adminDb.collection('wallets').doc(uid).collection('transactions').orderBy('createdAt', 'desc').limit(20).get();
    const transactions = txSnap.docs.map(doc => doc.data());

    return NextResponse.json({ wallet, transactions });
  } catch (error: any) {
    console.error('Error fetching wallet:', error);
    return NextResponse.json({ error: 'Token inválido o error en servidor' }, { status: 500 });
  }
}
