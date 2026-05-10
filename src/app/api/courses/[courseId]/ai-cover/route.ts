import { NextResponse, type NextRequest } from 'next/server';
import { adminAuth, adminDb, adminStorage } from '@/lib/firebase/admin';
import { GoogleGenAI, Type, Schema } from '@google/genai';
import { buildAiCoverPrompt } from '@/lib/ai/prompts';
import { logger } from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';
import * as admin from 'firebase-admin';

export const dynamic = 'force-dynamic';

// Initialize Gemini SDK
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

    const courseRef = adminDb!.collection('cursos').doc(courseId);
    const courseDoc = await courseRef.get();
    
    if (!courseDoc.exists) {
      return NextResponse.json({ error: 'El curso no existe.' }, { status: 403 });
    }
    const courseData = courseDoc.data();
    if (courseData?.creadorUid !== creatorUid) {
      return NextResponse.json({ error: 'No tienes permisos sobre este curso.' }, { status: 403 });
    }

    // 2. Parse request payload
    const { prompt, aspectRatio = '16:9', style = '', referenceImage } = await request.json();

    // 3. Build prompt via the centralized library (T6.0.1) — passes
    //    course context (title + short description) so the model has more
    //    material than the generic asset cover endpoint.
    const built = buildAiCoverPrompt({
      prompt,
      aspectRatio,
      style,
      currentTitle: courseData?.nombre || 'Tema Holístico',
      assetTypeLabel: 'curso',
      contextDescription: courseData?.descripcionCorta || undefined,
    });

    // 4. Prepare AI request
    const contents: any[] = [{ text: built.prompt }];
    
    // Si hay una imagen de referencia (Image-to-Image)
    if (referenceImage) {
      // referenceImage suele venir como 'data:image/jpeg;base64,...'
      const base64Data = referenceImage.includes(',') ? referenceImage.split(',')[1] : referenceImage;
      const mimeTypeMatch = referenceImage.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/);
      const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/jpeg';
      
      contents.push({
        inlineData: {
          mimeType: mimeType,
          data: base64Data
        }
      });
    }

    // 4. Call Nano Banana (Gemini Image Generation)
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-image-preview",
      contents: contents,
      config: {
        // Nano banana config uses specific configuration
        // @ts-ignore - The types might be slightly out of sync depending on genai version
        outputModalities: ["IMAGE"],
        // If imageConfig exists in the SDK version
        imageConfig: {
            aspectRatio: aspectRatio, // "9:16", "1:1", "16:9"
            allowImagesOfPeople: true, // Typical required flag if generating people
        }
      } as any // cast as any to inject imageConfig if types are rigid
    });

    // Handle standard part loop
    let generatedBase64 = null;
    let mimeType = 'image/png';
    
    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData) {
        generatedBase64 = part.inlineData.data;
        mimeType = part.inlineData.mimeType || 'image/png';
        break;
      }
    }

    if (!generatedBase64) {
      throw new Error("La IA no devolvió ninguna imagen en la respuesta.");
    }

    // 5. Upload to Firebase Storage
    const bucket = adminStorage!.bucket(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
    const fileName = `courses/${courseId}/covers/ai-cover-${Date.now()}.png`;
    const file = bucket.file(fileName);
    
    const buffer = Buffer.from(generatedBase64, 'base64');
    
    const uuid = uuidv4();
    
    await file.save(buffer, {
      metadata: {
        contentType: mimeType,
        metadata: {
          firebaseStorageDownloadTokens: uuid
        }
      },
    });

    const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(fileName)}?alt=media&token=${uuid}`;

    // 6. Update Course Entity
    await courseRef.update({
      imagenPortadaUrl: publicUrl,
      fechaActualizacion: admin.firestore.FieldValue.serverTimestamp()
    });

    logger.info('AI cover generated (course)', {
      uid: creatorUid,
      courseId,
      promptFeature: built.meta.feature,
      promptVersion: built.meta.version,
      model: 'gemini-3.1-flash-image-preview',
      hasReferenceImage: !!referenceImage,
      aspectRatio,
    });

    return NextResponse.json(
      { message: 'Portada generada con éxito', url: publicUrl },
      { status: 200 }
    );
  } catch (error: any) {
    logger.error('AI cover generation failed (course)', { err: error });
    return NextResponse.json(
      { error: 'Error procesando la imagen con IA', details: error.message },
      { status: 500 }
    );
  }
}
