import { NextResponse, type NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { CommunityService } from '@/backend/community/application/community.service';
import { FirebaseCommunityRepository } from '@/backend/community/infrastructure/repositories/firebase-community.repository';
import { FirebaseCommunityPostRepository } from '@/backend/community/infrastructure/repositories/firebase-community-post.repository';
import { CommunityPostEntity } from '@/backend/community/domain/entities/community-post.entity';
import { adminDb } from '@/lib/firebase/admin';

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

    const service = new CommunityService(new FirebaseCommunityRepository());
    const entity = await service.create({
      title: body.title,
      shortDescription: body.shortDescription || '',
      price: body.price || 0,
      isPrivate: body.isPrivate ?? true,
      communityGuidelines: body.communityGuidelines || undefined,
      coverUrl: body.coverUrl || null,
    }, decodedToken.uid);

    // Generate automated welcome post
    try {
      const { resolveUserProfile } = await import('@/lib/community/resolve-user-profile');
      const { displayName, photoURL } = await resolveUserProfile(decodedToken.uid);
      const postRepo = new FirebaseCommunityPostRepository();
      const welcomePost = CommunityPostEntity.create({
        communityId: entity.id,
        authorUid: decodedToken.uid,
        authorDisplayName: displayName,
        authorAvatarUrl: photoURL,
        content: `¡Bienvenidos a nuestra comunidad! Este es un espacio seguro para conectar, aprender y crecer juntos. Preséntate en los comentarios y dinos desde dónde nos saludas. 👋`,
        postType: 'announcement',
        visibility: 'public',
        attachments: [],
      });
      welcomePost.pin(); // Anclar post por defecto
      await postRepo.create(welcomePost);
    } catch (e) {
      console.error('Error creating automated welcome post:', e);
    }

    return NextResponse.json({ success: true, id: entity.id }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/creator/communities:', error);
    return NextResponse.json({ error: 'Error del servidor', details: error.message }, { status: 500 });
  }
}
