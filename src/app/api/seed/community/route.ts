import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { CommunityEntity } from '@/backend/community/domain/entities/community.entity';
import { CommunityPostEntity } from '@/backend/community/domain/entities/community-post.entity';
import { FirebaseCommunityPostRepository } from '@/backend/community/infrastructure/repositories/firebase-community-post.repository';
import { FirebaseCommunityCommentRepository } from '@/backend/community/infrastructure/repositories/firebase-community-comment.repository';
import { CommunityCommentEntity } from '@/backend/community/domain/entities/community-comment.entity';

const postRepo = new FirebaseCommunityPostRepository();
const commentRepo = new FirebaseCommunityCommentRepository();

export async function GET() {
  try {
    const creatorUid = 'mock_creator_uid'; // We'll just use a dummy or first admin
    // Try to get a real admin user
    const usersSnap = await adminDb.collection('usuarios').where('role', '==', 'creator').limit(1).get();
    let realCreatorUid = usersSnap.empty ? creatorUid : usersSnap.docs[0].id;
    let realCreatorName = usersSnap.empty ? 'Creador Demo' : (usersSnap.docs[0].data().displayName || 'Creador Demo');
    let realCreatorAvatar = usersSnap.empty ? null : (usersSnap.docs[0].data().photoURL || null);

    // 1. Create a Community (and CatalogItem for it)
    const community = CommunityEntity.create({
      creatorUid: realCreatorUid,
      title: 'Comunidad de Consciencia Elevada',
      shortDescription: 'Un espacio exclusivo para estudiantes del método de consciencia y expansión. Comparte tus descubrimientos diarios.',
      coverUrl: 'https://images.unsplash.com/photo-1518002171953-a080ee817e1f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
      isPrivate: false,
      price: 0,
      communityGuidelines: '1. Respeto mutuo.\n2. Comparte desde tu experiencia.\n3. No se permite spam.',
      feedVisibilityDefault: 'public'
    });
    community.status = 'published';

    await adminDb.collection('communities').doc(community.id).set(community.toPlainObject());
    
    // Create matching catalog item
    await adminDb.collection('catalog_items').doc(community.id).set({
      id: community.id,
      assetType: 'community',
      assetReferenceId: community.id,
      publicName: community.title,
      internalName: community.title,
      shortDescription: community.shortDescription,
      coverUrl: community.coverUrl,
      priceAmount: 0,
      priceCurrency: 'EUR',
      isPublished: true,
      creatorUid: realCreatorUid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // 2. Create posts of various types
    const posts = [
      CommunityPostEntity.create({
        communityId: community.id,
        authorUid: realCreatorUid,
        authorDisplayName: realCreatorName,
        authorAvatarUrl: realCreatorAvatar,
        postType: 'announcement',
        visibility: 'public',
        content: '¡Bienvenidos a la nueva plataforma social de Consciousness Class! Estamos muy felices de abrir este espacio para todos ustedes.',
        attachments: []
      }),
      CommunityPostEntity.create({
        communityId: community.id,
        authorUid: realCreatorUid,
        authorDisplayName: realCreatorName,
        authorAvatarUrl: realCreatorAvatar,
        postType: 'momento',
        visibility: 'public',
        content: 'Un pequeño momento de paz en la naturaleza de esta mañana. Respira profundo. 🌿',
        attachments: [{
          type: 'momento',
          url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
          fileName: 'naturaleza.mp4'
        }]
      }),
      CommunityPostEntity.create({
        communityId: community.id,
        authorUid: 'user123',
        authorDisplayName: 'María García',
        authorAvatarUrl: null,
        postType: 'question',
        visibility: 'members_only',
        content: 'Hola a todos. ¿Alguien tiene algún tip para mantener la concentración durante la meditación de la mañana? Me está costando un poco estos últimos días.',
        attachments: []
      }),
      CommunityPostEntity.create({
        communityId: community.id,
        authorUid: realCreatorUid,
        authorDisplayName: realCreatorName,
        authorAvatarUrl: realCreatorAvatar,
        postType: 'free_content',
        visibility: 'public',
        content: 'Te comparto esta guía rápida de 5 pasos para alinear tus chakras antes de dormir.',
        attachments: [{
          type: 'image',
          url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
          fileName: 'guia-chakras.jpg'
        }]
      })
    ];

    // Pin the first post
    posts[0].pinnedAt = new Date().toISOString();

    for (const post of posts) {
      await postRepo.create(post);
    }

    // Add a comment and a reply to the question post
    const qPost = posts[2];
    const comment1 = CommunityCommentEntity.create({
      postId: qPost.id,
      communityId: community.id,
      authorUid: realCreatorUid,
      authorDisplayName: realCreatorName,
      authorAvatarUrl: realCreatorAvatar,
      content: '¡Hola María! Es súper normal. Intenta enfocar tu atención en el sonido de tu respiración, y cuando la mente se distraiga (que lo hará), regresa suavemente al sonido.',
      parentCommentId: null
    });
    
    await commentRepo.create(community.id, qPost.id, comment1);

    const commentReply = CommunityCommentEntity.create({
      postId: qPost.id,
      communityId: community.id,
      authorUid: 'user123',
      authorDisplayName: 'María García',
      authorAvatarUrl: null,
      content: 'Muchas gracias, lo intentaré mañana mismo 😊',
      parentCommentId: comment1.id
    });

    await commentRepo.create(community.id, qPost.id, commentReply);
    
    // Mark the creator's comment as official answer
    const qPostUpdated = await postRepo.getById(community.id, qPost.id);
    if (qPostUpdated) {
       qPostUpdated.isOfficialAnswer = true;
       await postRepo.update(qPostUpdated);
    }

    return NextResponse.json({ success: true, communityId: community.id, message: 'Seed completado exitosamente.' });
  } catch (error: any) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
