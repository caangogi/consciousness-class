
// src/app/api/courses/[courseId]/modules/[moduleId]/lessons/[lessonId]/comments/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { UserProfile } from '@/contexts/AuthContext';

interface RouteContext {
  params: { courseId: string; moduleId: string; lessonId: string };
}

export interface Comment {
  id: string;
  userId: string;
  userDisplayName: string;
  userPhotoURL: string | null;
  texto: string;
  createdAt: FirebaseFirestore.Timestamp | Date;
  updatedAt?: FirebaseFirestore.Timestamp | Date | null;
  parentId: string | null; 
  courseId: string;
  moduleId: string;
  lessonId: string;
}

// GET handler to retrieve comments for a lesson
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { courseId, moduleId, lessonId } = await context.params;
    if (!courseId || !moduleId || !lessonId) {
      return NextResponse.json({ error: 'Bad Request: Missing IDs in path.' }, { status: 400 });
    }

    const commentsSnapshot = await adminDb
      .collection('cursos').doc(courseId)
      .collection('modulos').doc(moduleId)
      .collection('lecciones').doc(lessonId)
      .collection('comentarios')
      .orderBy('createdAt', 'asc')
      .get();

    const comments: Comment[] = commentsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        userDisplayName: data.userDisplayName,
        userPhotoURL: data.userPhotoURL || null,
        texto: data.texto,
        createdAt: (data.createdAt as FirebaseFirestore.Timestamp).toDate(),
        updatedAt: data.updatedAt ? (data.updatedAt as FirebaseFirestore.Timestamp).toDate() : null,
        parentId: data.parentId || null,
        courseId: data.courseId || courseId, 
        moduleId: data.moduleId || moduleId, 
        lessonId: data.lessonId || lessonId, 
      };
    });

    return NextResponse.json({ comments }, { status: 200 });

  } catch (error: any) {
    const paramsForErrorLog = await context.params;
    console.error(`Error in GET /api/courses/${paramsForErrorLog?.courseId}/modules/${paramsForErrorLog?.moduleId}/lessons/${paramsForErrorLog?.lessonId}/comments:`, error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

// POST handler to create a new comment for a lesson
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { courseId, moduleId, lessonId } = await context.params;
    if (!courseId || !moduleId || !lessonId) {
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
    const userId = decodedToken.uid;

    const userDocSnap = await adminDb.collection('usuarios').doc(userId).get();
    const courseDocSnap = await adminDb.collection('cursos').doc(courseId).get();

    if (!userDocSnap.exists || !courseDocSnap.exists) {
        return NextResponse.json({ error: 'User or Course not found' }, { status: 404 });
    }
    const userData = userDocSnap.data() as UserProfile;
    const courseData = courseDocSnap.data();

    const isCreator = courseData?.creadorUid === userId;
    const isEnrolled = userData.cursosInscritos?.includes(courseId);

    if (!isCreator && !isEnrolled) {
        return NextResponse.json({ error: 'Forbidden: User must be enrolled or be the course creator to comment.' }, { status: 403 });
    }

    const { texto, parentId } = await request.json();
    if (!texto || typeof texto !== 'string' || texto.trim().length === 0) {
      return NextResponse.json({ error: 'Bad Request: Comment text cannot be empty.' }, { status: 400 });
    }
    if (texto.length > 2000) {
        return NextResponse.json({ error: 'Bad Request: Comment text exceeds 2000 characters.'}, { status: 400});
    }
    if (parentId && typeof parentId !== 'string') {
        return NextResponse.json({ error: 'Bad Request: Invalid parentId format.' }, { status: 400 });
    }

    const userDisplayName = userData.displayName || userData.nombre || "Usuario Anónimo";
    const userPhotoURL = userData.photoURL || null;

    const newCommentRef = adminDb
      .collection('cursos').doc(courseId)
      .collection('modulos').doc(moduleId)
      .collection('lecciones').doc(lessonId)
      .collection('comentarios')
      .doc();

    const newCommentData: Omit<Comment, 'id' | 'createdAt' | 'updatedAt'> & { createdAt: FieldValue, updatedAt: FieldValue | null } = {
      userId,
      userDisplayName,
      userPhotoURL,
      texto: texto.trim(),
      parentId: parentId || null,
      courseId, 
      moduleId,
      lessonId,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: null,
    };

    await newCommentRef.set(newCommentData);
    
    const createdCommentSnap = await newCommentRef.get();
    const createdData = createdCommentSnap.data();
    const createdComment: Comment = {
        id: createdCommentSnap.id,
        userId: createdData!.userId,
        userDisplayName: createdData!.userDisplayName,
        userPhotoURL: createdData!.userPhotoURL,
        texto: createdData!.texto,
        parentId: createdData!.parentId,
        courseId: createdData!.courseId,
        moduleId: createdData!.moduleId,
        lessonId: createdData!.lessonId,
        createdAt: (createdData!.createdAt as FirebaseFirestore.Timestamp).toDate(),
        updatedAt: createdData!.updatedAt ? (createdData!.updatedAt as FirebaseFirestore.Timestamp).toDate() : null,
    };

    return NextResponse.json({ message: 'Comment posted successfully', comment: createdComment }, { status: 201 });

  } catch (error: any) {
    const paramsForErrorLog = await context.params;
    console.error(`Error in POST /api/courses/${paramsForErrorLog?.courseId}/modules/${paramsForErrorLog?.moduleId}/lessons/${paramsForErrorLog?.lessonId}/comments:`, error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
