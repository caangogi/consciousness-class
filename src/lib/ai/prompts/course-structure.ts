import type { BuiltPrompt } from './types';

export interface CourseStructureInput {
  /** Course title (e.g. "Mindfulness para terapeutas"). */
  courseTheme: string;
  /** Optional category. Defaults to "General". */
  category?: string;
  /** Short marketing description. Optional. */
  shortDesc?: string;
  /** Long description. Optional. */
  longDesc?: string;
  /** User's free-form direction for THIS generation call. */
  userInstruction: string;
}

/**
 * Prompt for the course-structure generator (modules + lessons JSON).
 * Used by /api/courses/[courseId]/ai-structure.
 *
 * The endpoint pairs this prompt with a strict responseSchema so the
 * model returns parseable JSON — that part stays in the route, since
 * it's a Gemini-specific config, not a prompt concern.
 */
export function buildCourseStructurePrompt(input: CourseStructureInput): BuiltPrompt {
  if (!input.courseTheme || input.courseTheme.trim() === '') {
    throw new Error('buildCourseStructurePrompt: courseTheme is required');
  }
  if (!input.userInstruction || input.userInstruction.trim() === '') {
    throw new Error('buildCourseStructurePrompt: userInstruction is required');
  }

  const courseContext =
    `      Título: ${input.courseTheme}
      Categoría: ${input.category ?? 'General'}
      Descripción Corta: ${input.shortDesc ?? 'Sin descripción'}
      Descripción Completa: ${input.longDesc ?? 'Sin detalles adicionales'}`;

  return {
    meta: { feature: 'course-structure', version: '1.0.0', builtAt: '2026-05-10' },
    prompt:
      `Eres el "Asistente Consciousness", un experto arquitecto de contenido educacional holístico y psicológico.
Ayudas a terapeutas a desglosar su conocimiento en cursos accionables, empáticos y estructurados.

El curso actual tiene el siguiente contexto fundacional:
${courseContext}

Instrucción adicional del usuario: "${input.userInstruction}"

Genera una estructura lógica distribuida en Módulos y Lecciones basado en la instrucción del usuario.
Asegúrate de que cada módulo tenga una breve descripción y sus lecciones distribuidas con nombres atractivos y un tipo de formato adecuado (comúnmente video o audio, o documento_pdf para meditaciones/workbooks).`,
  };
}
