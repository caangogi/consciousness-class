/**
 * Tests for the prompt library.
 *
 * Eval-style per documentation/testing-strategy.md (src/lib/ai/ uses
 * eval-first discipline — golden set + human review). These tests are
 * the unit-level safety net: they verify the builder returns a
 * well-shaped, version-stamped prompt that includes every input the
 * caller passed in. They do NOT validate the QUALITY of the prompt
 * (that's manual + the future T6.0.5 golden eval suite).
 */
import { describe, it, expect } from 'vitest';
import {
  buildAssistiveEditPrompt,
  buildAiCoverPrompt,
  buildMagicDocPrompt,
  buildCourseStructurePrompt,
  type AssistiveEditAction,
} from './index';

describe('buildAssistiveEditPrompt', () => {
  it.each<AssistiveEditAction>(['improve', 'expand', 'summarize', 'empathize'])(
    'returns a versioned prompt with the user text embedded for action %s',
    (action) => {
      const out = buildAssistiveEditPrompt({ action, text: 'Hola alumna, gracias por estar aquí.' });
      expect(out.meta.feature).toBe('assistive-edit');
      expect(out.meta.version).toMatch(/^\d+\.\d+\.\d+$/);
      expect(out.prompt).toContain('Hola alumna, gracias por estar aquí.');
      expect(out.prompt).toContain('Nano Banana');
    }
  );

  it.each<AssistiveEditAction>(['improve', 'expand', 'summarize', 'empathize'])(
    'embeds the per-action instruction for %s',
    (action) => {
      const out = buildAssistiveEditPrompt({ action, text: 'cualquier cosa' });
      // Each action carries its own verb in Spanish — verify it lands.
      const expectedFragment = ({
        improve: 'Mejora la redacción',
        expand: 'Expande el siguiente texto',
        summarize: 'Resume este texto',
        empathize: 'tono más empático',
      } as const)[action];
      expect(out.prompt).toContain(expectedFragment);
    }
  );

  it('throws on empty text', () => {
    expect(() => buildAssistiveEditPrompt({ action: 'improve', text: '' })).toThrow(/text is required/i);
    expect(() => buildAssistiveEditPrompt({ action: 'improve', text: '   ' })).toThrow(/text is required/i);
  });

  it('throws on unknown action', () => {
    expect(() =>
      buildAssistiveEditPrompt({ action: 'translate' as any, text: 'x' })
    ).toThrow(/unknown action/i);
  });
});

describe('buildAiCoverPrompt', () => {
  it('returns a versioned prompt that includes all defaults when no input is given', () => {
    const out = buildAiCoverPrompt();
    expect(out.meta.feature).toBe('ai-cover');
    expect(out.prompt).toContain('16:9');
    expect(out.prompt).toContain('Tema Holístico');
    expect(out.prompt).toContain('Fotorealista y cinemático');
  });

  it('honors aspectRatio override', () => {
    const out = buildAiCoverPrompt({ aspectRatio: '1:1' });
    expect(out.prompt).toContain('1:1');
    expect(out.prompt).not.toContain('16:9');
  });

  it('honors style override', () => {
    const out = buildAiCoverPrompt({ style: 'Acuarela suave' });
    expect(out.prompt).toContain('Acuarela suave');
  });

  it('honors currentTitle override', () => {
    const out = buildAiCoverPrompt({ currentTitle: 'Curso de Mindfulness' });
    expect(out.prompt).toContain('Curso de Mindfulness');
  });

  it('honors free-form prompt direction', () => {
    const out = buildAiCoverPrompt({ prompt: 'tonos verdes con luz al amanecer' });
    expect(out.prompt).toContain('tonos verdes con luz al amanecer');
  });

  it('always includes the explicit "no superimposed text" rule', () => {
    const out = buildAiCoverPrompt();
    expect(out.prompt.toLowerCase()).toContain('sin texto superpuesto');
  });

  it('uses the asset-type label "activo digital" by default', () => {
    const out = buildAiCoverPrompt();
    expect(out.prompt).toContain('activo digital');
  });

  it('honors a custom assetTypeLabel ("curso") and includes contextDescription when present', () => {
    const out = buildAiCoverPrompt({
      assetTypeLabel: 'curso',
      currentTitle: 'Mindfulness',
      contextDescription: 'Curso de 8 semanas para practicantes principiantes',
    });
    expect(out.prompt).toContain('para un curso llamado: "Mindfulness"');
    expect(out.prompt).toContain('Contexto del curso: Curso de 8 semanas para practicantes principiantes');
    expect(out.prompt).not.toContain('activo digital');
  });

  it('omits the contextDescription line when not provided', () => {
    const out = buildAiCoverPrompt({ assetTypeLabel: 'membresía' });
    expect(out.prompt).not.toMatch(/Contexto de la membresía:/);
  });
});

describe('buildMagicDocPrompt', () => {
  it('returns a system instruction AND a prompt body, both populated', () => {
    const out = buildMagicDocPrompt({ topic: 'Guía de mindfulness para la ansiedad' });
    expect(out.systemInstruction).toBeDefined();
    expect(out.systemInstruction!.length).toBeGreaterThan(50);
    expect(out.prompt.length).toBeGreaterThan(50);
    expect(out.meta.feature).toBe('magic-doc');
  });

  it('embeds the topic verbatim in the body', () => {
    const out = buildMagicDocPrompt({ topic: 'Plantilla de hábitos diarios' });
    expect(out.prompt).toContain('Plantilla de hábitos diarios');
  });

  it('keeps the persona + Markdown-only constraint in the system instruction', () => {
    const out = buildMagicDocPrompt({ topic: 'x' });
    expect(out.systemInstruction).toContain('Nano Banana');
    expect(out.systemInstruction).toContain('Markdown');
  });

  it('throws on empty topic', () => {
    expect(() => buildMagicDocPrompt({ topic: '' })).toThrow(/topic is required/i);
    expect(() => buildMagicDocPrompt({ topic: '   ' })).toThrow(/topic is required/i);
  });
});

describe('buildCourseStructurePrompt', () => {
  it('returns a versioned prompt embedding course context and user instruction', () => {
    const out = buildCourseStructurePrompt({
      courseTheme: 'Mindfulness para terapeutas',
      category: 'Psicología',
      shortDesc: 'Descripción breve',
      longDesc: 'Descripción larga con detalle',
      userInstruction: 'Estructúralo en 6 módulos progresivos',
    });
    expect(out.meta.feature).toBe('course-structure');
    expect(out.prompt).toContain('Mindfulness para terapeutas');
    expect(out.prompt).toContain('Psicología');
    expect(out.prompt).toContain('Descripción breve');
    expect(out.prompt).toContain('Descripción larga con detalle');
    expect(out.prompt).toContain('Estructúralo en 6 módulos progresivos');
  });

  it('falls back to defaults when optional fields are absent', () => {
    const out = buildCourseStructurePrompt({
      courseTheme: 'Tema X',
      userInstruction: 'Genera estructura',
    });
    expect(out.prompt).toContain('General');
    expect(out.prompt).toContain('Sin descripción');
    expect(out.prompt).toContain('Sin detalles adicionales');
  });

  it('throws on empty courseTheme', () => {
    expect(() =>
      buildCourseStructurePrompt({ courseTheme: '', userInstruction: 'x' })
    ).toThrow(/courseTheme is required/i);
  });

  it('throws on empty userInstruction', () => {
    expect(() =>
      buildCourseStructurePrompt({ courseTheme: 'x', userInstruction: '' })
    ).toThrow(/userInstruction is required/i);
  });
});
