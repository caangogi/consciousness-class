/**
 * Tests del detector de palabras clave de crisis.
 *
 * Test-after riguroso (per documentation/testing-strategy.md — src/lib/
 * is not in the TDD-strict list, but safety filters demand high
 * confidence so we cover edge cases extensively here).
 *
 * Two goals these tests must enforce:
 *  1. NO falsos negativos en variantes obvias (con/sin tilde, mayúsculas,
 *     dentro de frases largas). Una crisis no detectada es el escenario
 *     que justifica este módulo.
 *  2. Falsos positivos plausibles bajo control. "Aguanto este café" no
 *     debe tirar el banner de crisis.
 */
import { describe, it, expect } from 'vitest';
import { detectCrisis, normalizeForCrisisMatch } from './crisis-keywords';

describe('normalizeForCrisisMatch', () => {
  it('lowercases', () => {
    expect(normalizeForCrisisMatch('HOLA')).toBe('hola');
  });

  it('strips Spanish diacritics', () => {
    expect(normalizeForCrisisMatch('suicidá')).toBe('suicida');
    expect(normalizeForCrisisMatch('autolesión')).toBe('autolesion');
    expect(normalizeForCrisisMatch('café')).toBe('cafe');
  });

  it('collapses whitespace', () => {
    expect(normalizeForCrisisMatch('no   puedo    mas')).toBe('no puedo mas');
    expect(normalizeForCrisisMatch('\t hola \n')).toBe('hola');
  });
});

describe('detectCrisis · Spanish positives', () => {
  it.each([
    'pensé en el suicidio',
    'a veces pienso en suicidarme',
    'me quiero morir',
    'no puedo más con esto',
    'no aguanto más',
    'quiero quitarme la vida',
    'me hago autolesión a veces',
    'mejor estaría muerto',
    'cortarme me alivia',
  ])('detects crisis in "%s"', (text) => {
    const result = detectCrisis(text);
    expect(result.matched).toBe(true);
  });

  it('detects with stripped diacritics ("suicidá" matches as "suicida")', () => {
    const result = detectCrisis('palabra suicidá raro');
    expect(result.matched).toBe(true);
    if (result.matched) {
      expect(result.keyword).toBe('suicida');
    }
  });

  it('detects with uppercase first letter', () => {
    expect(detectCrisis('Suicidio.').matched).toBe(true);
    expect(detectCrisis('NO PUEDO MÁS').matched).toBe(true);
  });

  it('detects when embedded in a longer paragraph', () => {
    const text = 'Hoy ha sido un día normal, fui al trabajo, comí con María. ' +
      'Por la noche, sin embargo, no podía dejar de pensar en suicidarme.';
    expect(detectCrisis(text).matched).toBe(true);
  });
});

describe('detectCrisis · English positives', () => {
  it.each([
    'I want to die',
    "I can't go on",
    'thinking of suicide lately',
    'self harm has crossed my mind',
    'kill myself',
  ])('detects crisis in "%s"', (text) => {
    expect(detectCrisis(text).matched).toBe(true);
  });
});

describe('detectCrisis · negatives (must NOT trigger)', () => {
  it.each([
    '',
    '   ',
    'hoy fui al parque',
    'el café me da vida',
    'me encanta este libro sobre conciencia plena',
    // Hard cases — these intentionally fail in a naive matcher but our
    // word-boundary regex catches them:
    'el caracol asuicidio no existe',  // bogus made-up word containing "suicidio"
    'la palabra suicidiosos no existe',
  ])('does NOT trigger on "%s"', (text) => {
    expect(detectCrisis(text).matched).toBe(false);
  });

  it('does NOT trigger when "muerto" appears without the "mejor estaría" qualifier', () => {
    expect(detectCrisis('el árbol está muerto').matched).toBe(false);
  });

  it('does NOT trigger on "aguanto el dolor" (positive coping)', () => {
    // "no aguanto más" matches; just "aguanto" alone must not.
    expect(detectCrisis('aguanto el dolor con respiración').matched).toBe(false);
  });
});

describe('detectCrisis · acceptable false positives (by design)', () => {
  // Per the module's design decision: false positives are acceptable.
  // Showing the help resource to someone discussing suicide as a topic
  // (academic, journalistic, etc.) is harmless — the resource is
  // informational, not coercive. Missing a real crisis is the failure
  // mode we cannot accept. These tests document that policy explicitly.
  it.each([
    'el suicidio es un tema muy importante para investigar',
    'estoy escribiendo un ensayo sobre prevención del suicidio',
    'leí un artículo sobre autolesión adolescente',
  ])('DOES trigger on (false positive accepted): "%s"', (text) => {
    expect(detectCrisis(text).matched).toBe(true);
  });
});

describe('detectCrisis · result shape', () => {
  it('returns the matched keyword in normalized form', () => {
    const result = detectCrisis('Pienso en SUICIDARME');
    expect(result.matched).toBe(true);
    if (result.matched) {
      expect(result.keyword).toBe('suicidarme');
      expect(typeof result.index).toBe('number');
      expect(result.index).toBeGreaterThanOrEqual(0);
    }
  });

  it('returns the FIRST match when multiple exist', () => {
    // "no puedo mas" comes BEFORE "me quiero morir" in the text → it should win
    const text = 'no puedo más, me quiero morir';
    const result = detectCrisis(text);
    expect(result.matched).toBe(true);
    if (result.matched) {
      expect(result.keyword).toBe('no puedo mas');
    }
  });
});
