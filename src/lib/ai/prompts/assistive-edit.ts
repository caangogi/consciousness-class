import type { BuiltPrompt } from './types';

export type AssistiveEditAction = 'improve' | 'expand' | 'summarize' | 'empathize';

const INSTRUCTIONS: Record<AssistiveEditAction, string> = {
  improve:    'Mejora la redacción y gramática del texto, haciéndolo más profesional y claro. Manten la longitud similar.',
  expand:     'Expande el siguiente texto aportando más detalles, ejemplos útiles, o un pequeño párrafo adicional. Manten el mismo tono.',
  summarize:  'Resume este texto en los puntos más importantes de forma concisa.',
  empathize:  'Reescribe el texto utilizando un tono más empático, cálido y comprensivo, ideal para terapeutas y creadores holísticos comunicándose con sus alumnos.',
};

export interface AssistiveEditInput {
  action: AssistiveEditAction;
  text: string;
}

/**
 * Prompt for the assistive editor (improve / expand / summarize / empathize).
 * Used by /api/creator/assets/ai-edit.
 */
export function buildAssistiveEditPrompt(input: AssistiveEditInput): BuiltPrompt {
  if (!input.text || input.text.trim() === '') {
    throw new Error('buildAssistiveEditPrompt: text is required');
  }
  if (!INSTRUCTIONS[input.action]) {
    throw new Error(`buildAssistiveEditPrompt: unknown action '${input.action}'`);
  }

  const instruction = INSTRUCTIONS[input.action];
  return {
    meta: { feature: 'assistive-edit', version: '1.0.0', builtAt: '2026-05-10' },
    prompt: `Has sido configurado como Nano Banana, un asistente experto de edición para creadores de cursos y terapeutas.
Instrucción: ${instruction}

Texto Original:
"""
${input.text}
"""

Devuelve SOLAMENTE el texto modificado usando la misma sintaxis (Markdown si lo había) sin comillas, introducciones ni saludos.`,
  };
}
