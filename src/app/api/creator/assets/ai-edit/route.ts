import { NextResponse, type NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { getAiClient, getTextModel } from '@/lib/ai/genai.client';
import { buildAssistiveEditPrompt } from '@/lib/ai/prompts';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * Assistive editor endpoint. Reference implementation of the T6.0.1
 * pattern for every AI route:
 *   1. validate input
 *   2. const built = buildXxxPrompt(input)  ← from src/lib/ai/prompts
 *   3. invoke the model
 *   4. log built.meta.feature + built.meta.version (Fase 6.0.3
 *      AIUsageLog will pick this up automatically once the wrapper
 *      lands; for now we emit via the structured logger so Cloud
 *      Logging can correlate quality + cost back to a prompt version)
 *
 * Other AI endpoints (ai-cover, ai-generate, ai-structure) will migrate
 * to this pattern in subsequent T6.0.1.x commits — done one at a time
 * to keep the risk surface small.
 */
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

    const { action, text } = await request.json();
    if (!text) {
      return NextResponse.json({ error: 'Falta el texto a editar' }, { status: 400 });
    }

    let built;
    try {
      built = buildAssistiveEditPrompt({ action, text });
    } catch (err: any) {
      // Builder validation failed (e.g. unknown action) — surface as 400.
      return NextResponse.json({ error: err?.message ?? 'Bad request' }, { status: 400 });
    }

    const ai = getAiClient();
    const model = await getTextModel();
    const response = await ai.models.generateContent({
      model,
      contents: [{ text: built.prompt }],
      config: { temperature: 0.7 } as any,
    });

    const modifiedText = response.text;

    logger.info('AI edit completed', {
      uid,
      promptFeature: built.meta.feature,
      promptVersion: built.meta.version,
      model,
      action,
    });

    return NextResponse.json(
      { success: true, text: modifiedText?.trim() },
      { status: 200 }
    );
  } catch (error: any) {
    logger.error('Assistive AI edit failed', { err: error });
    return NextResponse.json(
      { error: 'Error editando el texto con IA', details: error.message },
      { status: 500 }
    );
  }
}
