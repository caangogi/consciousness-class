import { NextResponse, type NextRequest } from 'next/server';
import { requireRoles } from '@/lib/auth/rbac';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/ai-models
 * Lists all available models from the Gemini API in real time.
 * Returns models that support generateContent, filtered and sorted.
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireRoles(request, ['superadmin']);
    if ('error' in authResult) return authResult.error;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY no configurada' }, { status: 500 });
    }

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}&pageSize=100`,
      { headers: { 'Content-Type': 'application/json' } }
    );

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'Error llamando a la API de Gemini');
    }

    const data = await res.json();
    const allModels: any[] = data.models || [];

    // Shape each model into a clean DTO
    const models = allModels
      .map((m) => ({
        name: m.name?.replace('models/', '') ?? '',        // "gemini-2.5-flash"
        displayName: m.displayName ?? m.name,
        description: m.description ?? '',
        supportedMethods: m.supportedGenerationMethods ?? [],
        inputTokenLimit: m.inputTokenLimit ?? null,
        outputTokenLimit: m.outputTokenLimit ?? null,
      }))
      .filter((m) => m.name && m.supportedMethods.includes('generateContent'))
      .sort((a, b) => a.name.localeCompare(b.name));

    // Separate text vs image-capable models
    const textModels = models.filter(
      (m) => !m.name.includes('image') && !m.name.includes('vision-only')
    );
    const imageModels = models.filter(
      (m) => m.name.includes('image') || m.name.includes('flash') || m.name.includes('pro')
    );

    return NextResponse.json({ textModels, imageModels, all: models }, { status: 200 });
  } catch (error: any) {
    console.error('GET /api/admin/ai-models:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
