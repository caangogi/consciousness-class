/**
 * Public surface of the prompt library.
 *
 * Call sites (API routes, future AI wrapper) import builders from here.
 * The route's only AI-related job becomes:
 *   1. validate input
 *   2. const { systemInstruction, prompt, meta } = buildXxxPrompt(input)
 *   3. call the model
 *   4. log meta.feature + meta.version to AIUsageLog
 *
 * No string templates inline in routes anymore.
 */
export type { BuiltPrompt, PromptVersion } from './types';

export { buildAssistiveEditPrompt } from './assistive-edit';
export type { AssistiveEditAction, AssistiveEditInput } from './assistive-edit';

export { buildAiCoverPrompt } from './ai-cover';
export type { AiCoverInput } from './ai-cover';

export { buildMagicDocPrompt } from './magic-doc';
export type { MagicDocInput } from './magic-doc';

export { buildCourseStructurePrompt } from './course-structure';
export type { CourseStructureInput } from './course-structure';
