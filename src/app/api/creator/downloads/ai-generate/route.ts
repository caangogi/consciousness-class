import { NextResponse, type NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { getAiClient, getTextModel } from '@/lib/ai/genai.client';
import { buildMagicDocPrompt } from '@/lib/ai/prompts';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const idToken = authorization.split('Bearer ')[1];
    let uid: string;
    try {
      const decoded = await adminAuth.verifyIdToken(idToken);
      uid = decoded.uid;
    } catch {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const { prompt } = await request.json();
    if (!prompt) {
      return NextResponse.json(
        { error: 'Ingresa de qué quieres que trate el documento' },
        { status: 400 }
      );
    }

    let built;
    try {
      built = buildMagicDocPrompt({ topic: prompt });
    } catch (err: any) {
      return NextResponse.json({ error: err?.message ?? 'Bad request' }, { status: 400 });
    }

    const ai = getAiClient();
    const model = await getTextModel();
    const response = await ai.models.generateContent({
      model,
      contents: [{ text: built.prompt }],
      config: {
        systemInstruction: built.systemInstruction,
        temperature: 0.7,
      } as any,
    });

    const generatedMarkdown = response.text;

    logger.info('Magic doc generated', {
      uid,
      promptFeature: built.meta.feature,
      promptVersion: built.meta.version,
      model,
      topicLength: prompt.length,
    });

    return NextResponse.json(
      { success: true, markdown: generatedMarkdown },
      { status: 200 }
    );
  } catch (error: any) {
    logger.error('Magic doc generation failed', { err: error });
    return NextResponse.json(
      { error: 'Error generando tu Documento Mágico', details: error.message },
      { status: 500 }
    );
  }
}
