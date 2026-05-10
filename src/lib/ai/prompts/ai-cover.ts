import type { BuiltPrompt } from './types';

export interface AiCoverInput {
  /** Free-form direction from the user (mood, scene, palette hints). */
  prompt?: string;
  /** Aspect ratio token Gemini understands ('16:9', '1:1', '4:5'...). */
  aspectRatio?: string;
  /** Style override (e.g. 'Watercolor', 'Photorealistic cinematic'). */
  style?: string;
  /** Title of the asset the cover represents — anchors the concept. */
  currentTitle?: string;
  /**
   * Asset type label inserted into the prompt ("curso", "membresía",
   * "activo digital"…). Defaults to the generic "activo digital" so the
   * builder works for the catch-all creator/assets/ai-cover endpoint.
   */
  assetTypeLabel?: string;
  /**
   * Optional context paragraph added to the prompt — typically the
   * asset's short description so the model has more material to work
   * with for course/membership covers.
   */
  contextDescription?: string;
}

/**
 * Prompt for Nano Banana cover generation.
 * Used by /api/creator/assets/ai-cover and /api/courses/[id]/ai-cover.
 *
 * Note: image generation models do NOT use a separate systemInstruction;
 * the prompt body carries everything. The aspect ratio is repeated in
 * the prompt as defense-in-depth even though the route also passes it
 * via Gemini's imageConfig.aspectRatio API parameter.
 */
export function buildAiCoverPrompt(input: AiCoverInput = {}): BuiltPrompt {
  const aspectRatio = input.aspectRatio ?? '16:9';
  const style       = input.style?.trim() || 'Fotorealista y cinemático';
  const title       = input.currentTitle?.trim() || 'Tema Holístico';
  const userHint    = input.prompt?.trim() || 'Crea una composición inspiradora y premium.';
  const assetType   = input.assetTypeLabel?.trim() || 'activo digital';
  const context     = input.contextDescription?.trim();

  const lines = [
    `Crea una portada elegante, moderna y profesional.`,
    `Estilo: ${style}.`,
    `Sin texto superpuesto.`,
    `Concepto visual abstracto para un ${assetType} llamado: "${title}".`,
  ];
  if (context) {
    lines.push(`Contexto del ${assetType}: ${context}.`);
  }
  lines.push(
    `Directriz adicional: ${userHint}.`,
    `IMPORTANTE: Genera la imagen estrictamente en una proporción (aspect ratio) de ${aspectRatio}.`
  );

  return {
    meta: { feature: 'ai-cover', version: '1.1.0', builtAt: '2026-05-10' },
    prompt: lines.join(' '),
  };
}
