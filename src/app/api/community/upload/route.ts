import { NextResponse, type NextRequest } from 'next/server';
import { adminAuth, adminStorage } from '@/lib/firebase/admin';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

// POST /api/community/upload
// Accepts multipart/form-data with a `file` field
export async function POST(request: NextRequest) {
  try {
    // 1. Auth
    const auth = request.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const user = await adminAuth.verifyIdToken(auth.split('Bearer ')[1]);

    // 2. Parse multipart form
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const communityId = formData.get('communityId') as string;

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    if (!communityId) return NextResponse.json({ error: 'communityId required' }, { status: 400 });

    // 3. Determine type
    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');
    if (!isVideo && !isImage) {
      return NextResponse.json({ error: 'Only image and video files are supported' }, { status: 400 });
    }

    // 4. Upload to Firebase Storage
    const ext = file.name.split('.').pop() || (isVideo ? 'mp4' : 'jpg');
    const uuid = uuidv4();
    const fileName = `communities/${communityId}/posts/${Date.now()}-${uuid}.${ext}`;
    
    const bucket = adminStorage!.bucket(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
    const storageFile = bucket.file(fileName);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await storageFile.save(buffer, {
      metadata: {
        contentType: file.type,
        metadata: {
          firebaseStorageDownloadTokens: uuid,
          uploadedBy: user.uid,
        },
      },
    });

    const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(fileName)}?alt=media&token=${uuid}`;

    return NextResponse.json({
      url: publicUrl,
      type: isVideo ? 'video' : 'image',
      fileName: file.name,
    });
  } catch (error: any) {
    console.error('Community upload error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
