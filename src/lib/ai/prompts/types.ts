/**
 * Shared types for the prompt library.
 *
 * Why a versioned, structured prompt instead of inline string templates:
 *  - Every AI call gets stamped with the prompt version in AIUsageLog
 *    (Fase 6.0.3 / AI-Credits sprint). Lets us correlate model output
 *    quality with prompt iterations.
 *  - The eval suite (Fase 6.0.5) compares outputs of the SAME prompt
 *    version across model changes — without versioned prompts the
 *    diff is meaningless.
 *  - Bumping a prompt = bumping the version. Older runs keep their
 *    stamp. New runs pick up the new behavior.
 *
 * Versioning convention: `<feature>@<semver>`. Bump:
 *  - patch: typo / wording polish that doesn't change intent
 *  - minor: added a constraint, tightened a section, behavior shift
 *  - major: rewritten — outputs may be drastically different
 */
export interface PromptVersion {
  /** Stable id for the prompt feature, e.g. 'assistive-edit'. */
  feature: string;
  /** Semver of THIS prompt (not the model). Bump when wording changes. */
  version: string;
  /** ISO date the version was authored. */
  builtAt: string;
}

export interface BuiltPrompt {
  meta: PromptVersion;
  /** Optional system instruction (for models that distinguish it). */
  systemInstruction?: string;
  /** Main prompt body, sent as a user-role message. */
  prompt: string;
}
