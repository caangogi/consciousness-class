import type { BuiltPrompt } from './types';

export interface MagicDocInput {
  /** Topic / requirement free-form text from the creator. */
  topic: string;
}

/**
 * Prompt for the Magic Document / Lead Magnet generator.
 * Used by /api/creator/downloads/ai-generate.
 *
 * Splits into systemInstruction (persona + format constraints) and prompt
 * (the per-call topic) so we can swap the persona without touching every
 * call site.
 */
export function buildMagicDocPrompt(input: MagicDocInput): BuiltPrompt {
  if (!input.topic || input.topic.trim() === '') {
    throw new Error('buildMagicDocPrompt: topic is required');
  }

  return {
    meta: { feature: 'magic-doc', version: '1.0.0', builtAt: '2026-05-10' },
    systemInstruction:
      `Eres Nano Banana, el editor en jefe y generador experto de Lead Magnets para educadores y terapeutas (Psicología, Holístico, Bienestar).
Tu objetivo es generar una guía, eBook, o plantilla de alta calidad basada en el prompt del usuario.
El resultado DEBE estar en formato Markdown enriquecido (sin saludar, sin introducciones conversacionales).
Usa títulos (#, ##, ###), listas, blockquotes (>) para citas o tips importantes, y tablas si es necesario.
Debe sentirse ultra-premium, accionable y directo.

IMPORTANTE: No uses etiquetas html como \`\`\`markdown, solo el contenido puro en Markdown.`,
    prompt:
      `Genera el contenido de una descarga digital (Lead Magnet o Plantilla) sobre el siguiente tema o requerimiento: "${input.topic}".
Hazlo con una estructura clara:
1. Título principal atractivo de la guía/descarga
2. Una breve introducción persuasiva
3. El cuerpo o estructura principal (ejercicios, días de plantillas, o checklist)
4. Una conclusión cálida recomendando el siguiente paso.`,
  };
}
