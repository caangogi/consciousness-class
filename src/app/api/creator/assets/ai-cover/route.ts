import { NextResponse, type NextRequest } from 'next/server';
import { adminAuth, adminStorage } from '@/lib/firebase/admin';
import { getAiClient, getImageModel } from '@/lib/ai/genai.client';
import { buildAiCoverPrompt } from '@/lib/ai/prompts';
import { logger } from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // 1. Auth Validation
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

    // 2. Parse request payload
    const { prompt, aspectRatio = '16:9', style = '', referenceImage, currentTitle = 'Tema Holístico' } = await request.json();

    // 3. Build prompt via the centralized library (T6.0.1).
    const built = buildAiCoverPrompt({ prompt, aspectRatio, style, currentTitle });

    // 4. Prepare AI request
    const contents: any[] = [{ text: built.prompt }];

    // Si hay una imagen de referencia (Image-to-Image)
    if (referenceImage) {
      const base64Data = referenceImage.includes(',') ? referenceImage.split(',')[1] : referenceImage;
      const mimeTypeMatch = referenceImage.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/);
      const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/jpeg';

      contents.push({
        inlineData: {
          mimeType: mimeType,
          data: base64Data,
        },
      });
    }

    // 5. Call Nano Banana (Gemini Image Generation)
    const ai = getAiClient();
    const modelName = await getImageModel();
    const response = await ai.models.generateContent({
      model: modelName,
      contents: contents,
    });

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
      throw new Error(`La IA (${modelName}) no devolvió ninguna imagen en la respuesta.`);
    }

    // 6. Upload to Firebase Storage
    const bucket = adminStorage!.bucket(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
    const fileName = `creators/${creatorUid}/temp-covers/ai-cover-${Date.now()}.png`;
    const file = bucket.file(fileName);

    const buffer = Buffer.from(generatedBase64, 'base64');
    const uuid = uuidv4();

    await file.save(buffer, {
      metadata: {
        contentType: mimeType,
        metadata: { firebaseStorageDownloadTokens: uuid },
      },
    });

    const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(fileName)}?alt=media&token=${uuid}`;

    logger.info('AI cover generated (asset)', {
      uid: creatorUid,
      promptFeature: built.meta.feature,
      promptVersion: built.meta.version,
      model: modelName,
      hasReferenceImage: !!referenceImage,
      aspectRatio,
    });

    return NextResponse.json(
      { message: 'Portada generada con éxito', url: publicUrl },
      { status: 200 }
    );
  } catch (error: any) {
    logger.error('AI cover generation failed (asset)', { err: error });
    return NextResponse.json(
      { error: 'Error procesando la imagen con IA', details: error.message },
      { status: 500 }
    );
  }
}
