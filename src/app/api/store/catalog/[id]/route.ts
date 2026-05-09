import { NextResponse, type NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id } = await context.params;
    if (!id) return NextResponse.json({ error: 'Falta el ID' }, { status: 400 });

    const doc = await adminDb.collection('catalog_items').doc(id).get();
    if (!doc.exists) return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });

    const data = doc.data();
    if (data?.status !== 'published') {
      return NextResponse.json({ error: 'Este producto no está disponible' }, { status: 404 });
    }

    return NextResponse.json({ item: { id: doc.id, ...data } }, { status: 200 });
  } catch (error: any) {
    console.error('GET /api/store/catalog/[id]:', error);
    return NextResponse.json({ error: 'Error cargando el producto', details: error.message }, { status: 500 });
  }
}
