import { NextResponse, type NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const assetType = searchParams.get('type'); // optional filter

    let query: any = adminDb.collection('catalog_items').where('status', '==', 'published');
    
    if (assetType && assetType !== 'all') {
      query = query.where('assetType', '==', assetType);
    }

    const snap = await query.orderBy('createdAt', 'desc').get();

    const items = snap.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ items }, { status: 200 });
  } catch (error: any) {
    console.error('GET /api/store/catalog:', error);
    return NextResponse.json({ error: 'Error cargando el catálogo', details: error.message }, { status: 500 });
  }
}
