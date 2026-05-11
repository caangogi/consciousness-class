/**
 * Crisis keyword detection.
 *
 * USED BY (when Fase 6.1 / 6.2 / 6.3 land):
 *   - JournalEntry analyzer (Fase 6.1) — if a student's diary entry trips
 *     any keyword, the system escalates: shows the help banner inline to
 *     the student AND emits an URGENT in-app notification to the creator
 *     with disclaimer about NOT being a medical diagnosis.
 *   - RAG Companion (Fase 6.2) — same banner if a student asks something
 *     trip-worthy. The model is NOT allowed to engage; instead it shows
 *     CrisisHelpResource.
 *   - Agente Secretarial (Fase 6.3) — auto-escalate to human + show
 *     resources, NEVER attempt to handle the situation conversationally.
 *
 * DESIGN NOTES:
 *   - This is INTENTIONALLY a simple keyword matcher, not an ML classifier.
 *     False positives are acceptable (better to show help to a student
 *     who didn't need it than miss a student who did). False negatives
 *     are the concern — we'd rather catch a "I can't go on like this" via
 *     keyword than rely on the LLM to flag it.
 *   - The matcher normalizes accents and lowercases so "suicidá" matches
 *     the same as "suicida".
 *   - Word-boundary matching avoids matching "asuicidio" inside a longer
 *     word (low false positive vector).
 *
 * NOT A LEGAL OR MEDICAL TOOL. This is a safety net for software that
 * processes user text. The product must ALSO have a clinical disclaimer
 * (see src/components/safety/MedicalDisclaimer.tsx).
 */

export interface CrisisMatch {
  matched: true;
  /** The keyword that triggered the match, in normalized form. */
  keyword: string;
  /** Index in the (lowercased+normalized) input where the match starts. */
  index: number;
}

export interface NoCrisisMatch {
  matched: false;
}

export type CrisisDetectionResult = CrisisMatch | NoCrisisMatch;

/**
 * Keyword bank for Spanish-speaking users.
 * Each entry is matched as a word/phrase, normalized (accent-stripped + lowercase).
 * Add new keywords cautiously — false positives have real UX cost (we interrupt
 * the user with the help banner).
 */
const SPANISH_KEYWORDS: readonly string[] = [
  // Self-harm / suicide direct
  'suicidio',
  'suicidarme',
  'suicidarse',
  'suicida',
  'quitarme la vida',
  'quitar la vida',
  'matarme',
  'me quiero morir',
  'me quiero matar',
  'quiero morir',
  'no quiero vivir',
  'no quiero seguir',
  'mejor estaria muerto', // common variant
  'mejor estaria muerta',
  'autolesion',
  'autolesionarme',
  'hacerme dano', // sin tilde para que pase tras normalización
  'cortarme',
  'cortarse las venas',
  // Imminent / overwhelm signals
  'no puedo mas',
  'no aguanto mas',
  'no puedo seguir',
  // Means-related — flag for human review
  'pastillas para morir',
  'cuantas pastillas',
] as const;

const ENGLISH_KEYWORDS: readonly string[] = [
  'suicide',
  'kill myself',
  'end my life',
  'want to die',
  'wanna die',
  "don't want to live",
  'self-harm',
  'self harm',
  'cut myself',
  'hurt myself',
  "can't go on",
  "can't take it anymore",
] as const;

/**
 * Normalize a string for crisis matching:
 *  - lowercase
 *  - strip diacritics (suicidá → suicida)
 *  - collapse whitespace
 */
export function normalizeForCrisisMatch(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // diacritic combining marks
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Escape a string for safe use inside a RegExp.
 */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Build a single RegExp once per language list (module-load time).
 * Word boundary on each side so "suicidio" matches inside "el suicidio"
 * but NOT inside "asuicidio" or "suicidiosos" (low false positive).
 *
 * Phrases like "no puedo mas" are matched as multi-word — the \b boundaries
 * still apply at the start and end of the phrase.
 */
function buildPattern(words: readonly string[]): RegExp {
  const escaped = words.map(escapeRegExp).join('|');
  return new RegExp(`\\b(${escaped})\\b`, 'i');
}

const SPANISH_PATTERN = buildPattern(SPANISH_KEYWORDS);
const ENGLISH_PATTERN = buildPattern(ENGLISH_KEYWORDS);

/**
 * Detect crisis keywords in a piece of user text.
 *
 * Returns the FIRST match found (we don't need to enumerate all matches —
 * a single hit is enough to escalate). The matcher checks Spanish first,
 * then English.
 *
 * @example
 *   detectCrisis('hoy ha sido un día duro') → { matched: false }
 *   detectCrisis('no puedo más con esto')   → { matched: true, keyword: 'no puedo mas', ... }
 *   detectCrisis('Suicidá no, pero...')     → { matched: true, keyword: 'suicida', ... }
 */
export function detectCrisis(text: string): CrisisDetectionResult {
  if (!text || text.trim() === '') return { matched: false };

  const normalized = normalizeForCrisisMatch(text);

  const esMatch = SPANISH_PATTERN.exec(normalized);
  if (esMatch) {
    return {
      matched: true,
      keyword: esMatch[1],
      index: esMatch.index,
    };
  }

  const enMatch = ENGLISH_PATTERN.exec(normalized);
  if (enMatch) {
    return {
      matched: true,
      keyword: enMatch[1],
      index: enMatch.index,
    };
  }

  return { matched: false };
}

/** Exported for tests. NOT part of the public API. */
export const __internal__ = {
  SPANISH_KEYWORDS,
  ENGLISH_KEYWORDS,
};
