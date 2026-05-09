import { NextResponse, type NextRequest } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { invalidateModelCache } from '@/lib/ai/genai.client';
import { requireRoles } from '@/lib/auth/rbac';

export const dynamic = 'force-dynamic';

const CONFIG_DOC = 'platform_config/ai_settings';

/**
 * GET /api/admin/ai-config
 * Returns the currently saved model configuration.
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireRoles(request, ['superadmin']);
    if ('error' in authResult) return authResult.error;

    const doc = await adminDb.doc(CONFIG_DOC).get();

    const config = doc.exists ? doc.data() : {};

    return NextResponse.json({
      textModel: config?.textModel ?? process.env.GEMINI_TEXT_MODEL ?? 'gemini-2.5-flash',
      imageModel: config?.imageModel ?? process.env.GEMINI_IMAGE_MODEL ?? 'gemini-2.5-flash-preview-image-generation',
      updatedAt: config?.updatedAt ?? null,
      updatedBy: config?.updatedBy ?? null,
    });
  } catch (error: any) {
    console.error('GET /api/admin/ai-config:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/admin/ai-config
 * Saves selected model names to Firestore.
 * Body: { textModel: string, imageModel: string }
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireRoles(request, ['superadmin']);
    if ('error' in authResult) return authResult.error;
    const { uid } = authResult;

    const { textModel, imageModel } = await request.json();
    if (!textModel || !imageModel) {
      return NextResponse.json({ error: 'Se requieren textModel e imageModel' }, { status: 400 });
    }

    await adminDb.doc(CONFIG_DOC).set({
      textModel,
      imageModel,
      updatedAt: new Date().toISOString(),
      updatedBy: uid,
    });

    invalidateModelCache(); // next request picks up the new models immediately

    return NextResponse.json({ success: true, textModel, imageModel });
  } catch (error: any) {
    console.error('POST /api/admin/ai-config:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
