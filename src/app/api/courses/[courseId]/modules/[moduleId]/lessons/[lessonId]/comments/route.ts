
// src/app/api/courses/[courseId]/modules/[moduleId]/lessons/[lessonId]/comments/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { UserProfile } from '@/contexts/AuthContext'; // Suponiendo que tienes este tipo

interface RouteContext {
  params: { courseId: string; moduleId: string; lessonId: string };
}

interface Comment {
  id: string;
  userId: string;
  userDisplayName: string;
  userPhotoURL: string | null;
  texto: string;
  createdAt: FirebaseFirestore.Timestamp | Date; // Firestore Timestamp o Date para el cliente
  // Considerar userRole para mostrar un badge de "Instructor" por ejemplo
}

// GET handler to retrieve comments for a lesson
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { courseId, moduleId, lessonId } = await context.params; // CORREGIDO: await context.params
    if (!courseId || !moduleId || !lessonId) {
      return NextResponse.json({ error: 'Bad Request: Missing IDs in path.' }, { status: 400 });
    }

    // Opcional: Verificar si el curso es público o si el usuario tiene acceso
    // Por ahora, asumimos que si puede ver la lección, puede ver los comentarios.

    const commentsSnapshot = await adminDb
      .collection('cursos').doc(courseId)
      .collection('modulos').doc(moduleId)
      .collection('lecciones').doc(lessonId)
      .collection('comentarios')
      .orderBy('createdAt', 'asc') // O 'desc' si quieres los más nuevos primero arriba
      .get();

    const comments: Comment[] = commentsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        userDisplayName: data.userDisplayName,
        userPhotoURL: data.userPhotoURL || null,
        texto: data.texto,
        createdAt: (data.createdAt as FirebaseFirestore.Timestamp).toDate(), // Convert to JS Date for client
      };
    });

    return NextResponse.json({ comments }, { status: 200 });

  } catch (error: any) {
    console.error(`Error in GET /api/courses/.../comments:`, error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

// POST handler to create a new comment for a lesson
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { courseId, moduleId, lessonId } = await context.params; // CORREGIDO: await context.params
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

    // Verificar si el usuario está inscrito en el curso o es el creador
    const userDocSnap = await adminDb.collection('usuarios').doc(userId).get();
    const courseDocSnap = await adminDb.collection('cursos').doc(courseId).get();

    if (!userDocSnap.exists || !courseDocSnap.exists) { // CORREGIDO: .exists en lugar de .exists()
        return NextResponse.json({ error: 'User or Course not found' }, { status: 404 });
    }
    const userData = userDocSnap.data() as UserProfile; // Asegúrate que UserProfile tiene cursosInscritos
    const courseData = courseDocSnap.data();

    const isCreator = courseData?.creadorUid === userId;
    const isEnrolled = userData.cursosInscritos?.includes(courseId);

    if (!isCreator && !isEnrolled) {
        return NextResponse.json({ error: 'Forbidden: User must be enrolled or be the course creator to comment.' }, { status: 403 });
    }

    const { texto } = await request.json();
    if (!texto || typeof texto !== 'string' || texto.trim().length === 0) {
      return NextResponse.json({ error: 'Bad Request: Comment text cannot be empty.' }, { status: 400 });
    }
    if (texto.length > 2000) { // Límite de caracteres
        return NextResponse.json({ error: 'Bad Request: Comment text exceeds 2000 characters.'}, { status: 400});
    }


    const userDisplayName = userData.displayName || userData.nombre || "Usuario Anónimo";
    const userPhotoURL = userData.photoURL || null;

    const newCommentRef = adminDb
      .collection('cursos').doc(courseId)
      .collection('modulos').doc(moduleId)
      .collection('lecciones').doc(lessonId)
      .collection('comentarios')
      .doc(); // Firestore autogenerará el ID

    const newCommentData = {
      userId,
      userDisplayName,
      userPhotoURL,
      texto: texto.trim(),
      createdAt: FieldValue.serverTimestamp(),
    };

    await newCommentRef.set(newCommentData);
    
    // Devolver el comentario recién creado (opcionalmente, con el ID y timestamp resueltos)
    // Para obtener el timestamp resuelto, necesitarías hacer un .get() después del .set()
    // O simplemente devolver los datos enviados, el cliente puede añadirlo a la lista localmente.
    const createdCommentSnap = await newCommentRef.get();
    const createdComment = {
        id: createdCommentSnap.id,
        ...createdCommentSnap.data(),
        createdAt: (createdCommentSnap.data()?.createdAt as FirebaseFirestore.Timestamp)?.toDate() || new Date(), // Convert to JS Date
    } as Comment;


    return NextResponse.json({ message: 'Comment posted successfully', comment: createdComment }, { status: 201 });

  } catch (error: any) {
    // Para asegurar que params está disponible en caso de error antes de su asignación
    const paramsForErrorLog = context.params || { courseId: '[unknown]', moduleId: '[unknown]', lessonId: '[unknown]'};
    console.error(`Error in POST /api/courses/[${paramsForErrorLog.courseId}]/.../comments:`, error);
    // Podrías tener un manejo de errores más específico aquí
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

