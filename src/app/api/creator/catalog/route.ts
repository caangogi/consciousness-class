import { NextResponse, type NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { CatalogService } from '@/backend/catalog/application/catalog.service';
import { FirebaseCatalogRepository } from '@/backend/catalog/infrastructure/repositories/firebase-catalog.repository';

export async function GET(request: NextRequest) {
  try {
    const authorization = request.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing or invalid token format' }, { status: 401 });
    }
    const idToken = authorization.split('Bearer ')[1];

    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch (error: any) {
      console.error('Error verifying ID token in /api/creator/catalog:', error);
      return NextResponse.json({ error: 'Unauthorized: Invalid ID token', details: error.message }, { status: 401 });
    }

    const creatorUid = decodedToken.uid;

    const catalogRepository = new FirebaseCatalogRepository();
    const catalogService = new CatalogService(catalogRepository);

    const items = await catalogService.getCatalogItemsByCreator(creatorUid);
    const catalogItemsData = items.map(item => item.toPlainObject());

    return NextResponse.json({ catalogItems: catalogItemsData }, { status: 200 });

  } catch (error: any) {
    console.error('Error in GET /api/creator/catalog:', error);
    let errorMessage = 'Internal Server Error';
    let errorDetails = 'An unexpected error occurred while fetching creator catalog items.';
    
    if (error instanceof Error) {
      errorDetails = error.message;
      errorMessage = error.name === 'Error' ? 'Catalog Fetch Error' : error.name;
    }
    
    const stack = process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : String(error)) : undefined;

    return NextResponse.json({ error: errorMessage, details: errorDetails, stack }, { status: 500 });
  }
}
