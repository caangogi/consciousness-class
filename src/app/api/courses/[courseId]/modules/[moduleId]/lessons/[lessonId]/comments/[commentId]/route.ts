
// src/app/api/courses/[courseId]/modules/[moduleId]/lessons/[lessonId]/comments/[commentId]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { Comment } from '../route'; // Import Comment interface from the parent route

interface RouteContext {
  params: {
    courseId: string;
    moduleId: string;
    lessonId: string;
    commentId: string;
  };
}

// PUT handler to update a comment
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { courseId, moduleId, lessonId, commentId } = await context.params;
    if (!courseId || !moduleId || !lessonId || !commentId) {
      return NextResponse.json({ error: 'Bad Request: Missing IDs in path.' }, { status: 400 });
    }

    const authorization = request.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing or invalid token format' }, { status: 401 });
    }
    const idToken = authorization.split('Bearer ')[1];

    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch (error: any) {
      return NextResponse.json({ error: 'Unauthorized: Invalid ID token', details: error.message }, { status: 401 });
    }
    const currentUserId = decodedToken.uid;

    const { texto } = await request.json();
    if (!texto || typeof texto !== 'string' || texto.trim().length === 0) {
      return NextResponse.json({ error: 'Bad Request: Comment text cannot be empty for update.' }, { status: 400 });
    }
    if (texto.length > 2000) {
        return NextResponse.json({ error: 'Bad Request: Comment text exceeds 2000 characters.'}, { status: 400});
    }

    const commentRef = adminDb
      .collection('cursos').doc(courseId)
      .collection('modulos').doc(moduleId)
      .collection('lecciones').doc(lessonId)
      .collection('comentarios').doc(commentId);

    const commentSnap = await commentRef.get();
    if (!commentSnap.exists) {
      return NextResponse.json({ error: 'Comment not found.' }, { status: 404 });
    }

    const commentData = commentSnap.data() as Comment;
    if (commentData.userId !== currentUserId) {
      // Optional: Allow course creator to edit any comment
      // const courseSnap = await adminDb.collection('cursos').doc(courseId).get();
      // if (courseSnap.data()?.creadorUid !== currentUserId) {
      //   return NextResponse.json({ error: 'Forbidden: You can only edit your own comments.' }, { status: 403 });
      // }
      return NextResponse.json({ error: 'Forbidden: You can only edit your own comments.' }, { status: 403 });
    }

    await commentRef.update({
      texto: texto.trim(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    const updatedCommentSnap = await commentRef.get();
    const updatedData = updatedCommentSnap.data();
     const updatedComment: Comment = {
        id: updatedCommentSnap.id,
        userId: updatedData!.userId,
        userDisplayName: updatedData!.userDisplayName,
        userPhotoURL: updatedData!.userPhotoURL,
        texto: updatedData!.texto,
        parentId: updatedData!.parentId || null,
        courseId: updatedData!.courseId || courseId,
        moduleId: updatedData!.moduleId || moduleId,
        lessonId: updatedData!.lessonId || lessonId,
        createdAt: (updatedData!.createdAt as FirebaseFirestore.Timestamp).toDate(),
        updatedAt: updatedData!.updatedAt ? (updatedData!.updatedAt as FirebaseFirestore.Timestamp).toDate() : new Date(),
    };


    return NextResponse.json({ message: 'Comment updated successfully', comment: updatedComment }, { status: 200 });

  } catch (error: any) {
    const paramsForErrorLog = await context.params;
    console.error(`Error in PUT /api/courses/.../comments/${paramsForErrorLog.commentId}:`, error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

// DELETE handler to delete a comment
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { courseId, moduleId, lessonId, commentId } = await context.params;
    if (!courseId || !moduleId || !lessonId || !commentId) {
      return NextResponse.json({ error: 'Bad Request: Missing IDs in path.' }, { status: 400 });
    }

    const authorization = request.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing or invalid token format' }, { status: 401 });
    }
    const idToken = authorization.split('Bearer ')[1];

    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch (error: any) {
      return NextResponse.json({ error: 'Unauthorized: Invalid ID token', details: error.message }, { status: 401 });
    }
    const currentUserId = decodedToken.uid;

    const commentRef = adminDb
      .collection('cursos').doc(courseId)
      .collection('modulos').doc(moduleId)
      .collection('lecciones').doc(lessonId)
      .collection('comentarios').doc(commentId);

    const commentSnap = await commentRef.get();
    if (!commentSnap.exists) {
      return NextResponse.json({ error: 'Comment not found.' }, { status: 404 });
    }
    const commentData = commentSnap.data() as Comment;

    const courseSnap = await adminDb.collection('cursos').doc(courseId).get();
    const courseCreatorUid = courseSnap.data()?.creadorUid;

    if (commentData.userId !== currentUserId && currentUserId !== courseCreatorUid) {
      return NextResponse.json({ error: 'Forbidden: You can only delete your own comments or if you are the course creator.' }, { status: 403 });
    }
    
    // TODO (Post-MVP): Handle deletion of replies if a parent comment is deleted.
    // For now, just delete the specified comment. If it has replies, they will become orphaned.
    // Option 1: Delete replies in a batch (more complex to query recursively or find all children).
    // Option 2: Mark comment as "deleted" but keep it, so replies still have a parent context.
    // Option 3: (Current) Simple delete.

    await commentRef.delete();

    return NextResponse.json({ message: 'Comment deleted successfully' }, { status: 200 });

  } catch (error: any) {
    const paramsForErrorLog = await context.params;
    console.error(`Error in DELETE /api/courses/.../comments/${paramsForErrorLog.commentId}:`, error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
