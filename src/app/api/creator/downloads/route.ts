import { NextResponse, type NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { DownloadService } from '@/backend/download/application/download.service';
import { FirebaseDownloadRepository } from '@/backend/download/infrastructure/repositories/firebase-download.repository';

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
    } catch (error: any) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }
    const creatorUid = decodedToken.uid;

    const body = await request.json();
    
    // Minimal Validation
    if (!body.title || !body.fileUrl) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    const downloadRepository = new FirebaseDownloadRepository();
    const downloadService = new DownloadService(downloadRepository);

    const newDownload = await downloadService.createDownload({
      title: body.title,
      shortDescription: body.shortDescription || '',
      price: body.price || 0,
      coverUrl: body.coverUrl || null,
      fileUrl: body.fileUrl,
      fileSizeKB: body.fileSizeKB || 0,
    }, creatorUid);

    return NextResponse.json({ 
      success: true, 
      downloadId: newDownload.id 
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error in POST /api/creator/downloads:', error);
    return NextResponse.json({ error: 'Error del servidor', details: error.message }, { status: 500 });
  }
}
