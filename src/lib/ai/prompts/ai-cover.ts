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
}

/**
 * Prompt for Nano Banana cover generation.
 * Used by /api/creator/assets/ai-cover and /api/courses/[id]/ai-cover.
 *
 * Note: image generation models do NOT use a separate systemInstruction;
 * the prompt body carries everything.
 */
export function buildAiCoverPrompt(input: AiCoverInput = {}): BuiltPrompt {
  const aspectRatio = input.aspectRatio ?? '16:9';
  const style       = input.style?.trim() || 'Fotorealista y cinemático';
  const title       = input.currentTitle?.trim() || 'Tema Holístico';
  const userHint    = input.prompt?.trim() || 'Crea una composición inspiradora y premium.';

  return {
    meta: { feature: 'ai-cover', version: '1.0.0', builtAt: '2026-05-10' },
    prompt:
      `Crea una portada elegante, moderna y profesional. ` +
      `Estilo: ${style}. ` +
      `Sin texto superpuesto. ` +
      `Concepto visual abstracto para un activo digital llamado: "${title}". ` +
      `Directriz adicional: ${userHint}. ` +
      `IMPORTANTE: Genera la imagen estrictamente en una proporción (aspect ratio) de ${aspectRatio}.`,
  };
}
