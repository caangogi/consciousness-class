import { NextResponse, type NextRequest } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { GoogleGenAI, Type, Schema } from '@google/genai';
import { buildCourseStructurePrompt } from '@/lib/ai/prompts';
import { logger } from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';
import * as admin from 'firebase-admin';

// Initialize Gemini SDK with heuristic logic for either standard API Key or Vertex AI
let aiConfig: any = {};
if (process.env.GEMINI_API_KEY) {
  aiConfig.apiKey = process.env.GEMINI_API_KEY;
} else if (process.env.VERTEX_AI_PROJECT) {
  aiConfig.vertexai = {
    project: process.env.VERTEX_AI_PROJECT,
    location: process.env.VERTEX_AI_LOCATION || 'us-central1',
  };
}
const ai = new GoogleGenAI(aiConfig);

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await context.params;
    if (!courseId) {
      return NextResponse.json({ error: 'Falta el ID del curso' }, { status: 400 });
    }

    // 1. Auth Validation
    const authorization = request.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const idToken = authorization.split('Bearer ')[1];
    let decodedToken;
    try {
      decodedToken = await adminAuth!.verifyIdToken(idToken);
    } catch (error: any) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }
    const creatorUid = decodedToken.uid;

    // Verify course ownership
    const courseRef = adminDb!.collection('cursos').doc(courseId);
    const courseDoc = await courseRef.get();
    
    if (!courseDoc.exists) {
      console.log(`[AI-Structure] Course not found. ID: ${courseId}`);
      return NextResponse.json({ error: 'El curso no existe o no se ha sincronizado.', details: `Course ID: ${courseId}` }, { status: 403 });
    }
    
    const courseData = courseDoc.data();
    if (courseData?.creadorUid !== creatorUid) {
      console.log(`[AI-Structure] Ownership mismatch. courseData.creadorUid: ${courseData?.creadorUid}, requested UID: ${creatorUid}`);
      return NextResponse.json({ error: 'No tienes permisos sobre este curso.' }, { status: 403 });
    }

    // 2. Parse User Prompt
    const { prompt } = await request.json();
    if (!prompt) {
      return NextResponse.json({ error: 'El prompt es requerido.' }, { status: 400 });
    }

    const courseTheme = courseData?.nombre || "Tema Holístico";

    // Build the prompt via the centralized library (T6.0.1).
    const built = buildCourseStructurePrompt({
      courseTheme,
      category: courseData?.categoria,
      shortDesc: courseData?.descripcionCorta,
      longDesc: courseData?.descripcionLarga,
      userInstruction: prompt,
    });

    // 3. Define the Schema for LLM
    const responseSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        modules: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              nombre: { type: Type.STRING },
              descripcion: { type: Type.STRING },
              lessons: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    nombre: { type: Type.STRING },
                    tipo: { type: Type.STRING, enum: ['video', 'documento_pdf', 'texto_rico', 'audio', 'quiz'] },
                    duracionEstimada: { type: Type.STRING },
                    textoContenido: { type: Type.STRING, description: 'Contenido opcional si es texto_rico' }
                  },
                  required: ['nombre', 'tipo', 'duracionEstimada']
                }
              }
            },
            required: ['nombre', 'descripcion', 'lessons']
          }
        }
      },
      required: ['modules']
    };

    // 4. Call GenAI Model
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: built.prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      }
    });

    logger.info('Course structure generated', {
      uid: creatorUid,
      courseId,
      promptFeature: built.meta.feature,
      promptVersion: built.meta.version,
      model: 'gemini-2.5-flash',
      userInstructionLength: prompt.length,
    });

    if (!response.text) {
      throw new Error("No response from AI");
    }

    const generatedStructure = JSON.parse(response.text);

    // 5. Batch Write to Firestore
    const batch = adminDb!.batch();
    const newModuleIds: string[] = [];

    // existing array of modules (append to them, or replace? Usually append is safer, but this could be complex. Let's append)
    const currentOrdenModulos = courseData?.ordenModulos || [];
    const startingModuleOrder = currentOrdenModulos.length;
    
    generatedStructure.modules.forEach((mod: any, modIndex: number) => {
      const moduleId = uuidv4();
      newModuleIds.push(moduleId);
      const moduleRef = courseRef.collection('modulos').doc(moduleId);
      
      const newLessonIds: string[] = [];
      const timestamp = admin.firestore.FieldValue.serverTimestamp();

      mod.lessons.forEach((lesson: any, lessonIndex: number) => {
        const lessonId = uuidv4();
        newLessonIds.push(lessonId);
        const lessonRef = moduleRef.collection('lecciones').doc(lessonId);
        
        batch.set(lessonRef, {
          id: lessonId,
          moduleId: moduleId,
          nombre: lesson.nombre,
          contenidoPrincipal: {
            tipo: lesson.tipo,
            url: null,
            texto: lesson.textoContenido || null
          },
          duracionEstimada: lesson.duracionEstimada,
          esVistaPrevia: false,
          orden: lessonIndex, // REQUIRED for Firebases orderBy queries
          fechaCreacion: timestamp,
          fechaActualizacion: timestamp
        });
      });

      batch.set(moduleRef, {
        id: moduleId,
        courseId: courseId,
        nombre: mod.nombre,
        descripcion: mod.descripcion || '',
        orden: startingModuleOrder + modIndex, // REQUIRED for Firebase orderBy queries
        ordenLecciones: newLessonIds,
        fechaCreacion: timestamp,
        fechaActualizacion: timestamp
      });
    });

    const updatedOrdenModulos = [...currentOrdenModulos, ...newModuleIds];
    batch.update(courseRef, {
      ordenModulos: updatedOrdenModulos
    });

    await batch.commit();

    return NextResponse.json({ message: 'Estructura generada e inyectada con éxito' }, { status: 200 });

  } catch (error: any) {
    console.error('Error generating AI structure:', error);
    return NextResponse.json({ error: 'Error procesando Inteligencia Artificial', details: error.message }, { status: 500 });
  }
}
