/**
 * MedicalDisclaimer — reusable legal disclaimer for any AI-assisted feature
 * that processes mental-health-adjacent content.
 *
 * Mandatory inside:
 *   - Journaling student-facing view (Fase 6.1)
 *   - RAG Companion chat widget (Fase 6.2)
 *   - Agente Secretarial responses (Fase 6.3)
 *   - Creator dashboard "trends" surface (so the creator understands
 *     they are NOT receiving a clinical diagnosis)
 *
 * NOT a replacement for the full ToS / Privacy Policy. This is an
 * inline reminder shown at the point of interaction.
 *
 * Three visual modes:
 *   - `inline`: small two-line note under a feature (default; lowest weight)
 *   - `banner`: full-width row at top of a page (high visibility)
 *   - `card`:   bordered card for landing or settings pages
 *
 * Copy is intentionally short — long disclaimers get ignored.
 */
'use client';

import * as React from 'react';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MedicalDisclaimerProps {
  /** Visual weight of the disclaimer. Defaults to 'inline'. */
  variant?: 'inline' | 'banner' | 'card';
  /** Optional className for layout overrides. */
  className?: string;
}

const COPY = {
  short:
    'Las sugerencias generadas por IA en esta página son orientativas. No son consejo médico, ' +
    'psicológico ni de salud mental. Si tienes una urgencia, contacta con un profesional o llama al 112.',
  title: 'Aviso médico',
} as const;

export function MedicalDisclaimer({ variant = 'inline', className }: MedicalDisclaimerProps): React.ReactElement {
  if (variant === 'inline') {
    return (
      <p
        role="note"
        aria-label="Aviso médico"
        className={cn(
          'text-[11px] leading-relaxed text-muted-foreground/80 flex items-start gap-1.5',
          className,
        )}
      >
        <Info className="h-3 w-3 mt-0.5 flex-shrink-0" aria-hidden="true" />
        <span>{COPY.short}</span>
      </p>
    );
  }

  if (variant === 'banner') {
    return (
      <div
        role="note"
        aria-label="Aviso médico"
        className={cn(
          'flex items-start gap-2.5 px-4 py-3 rounded-xl bg-secondary/40 border border-border/60 text-xs text-muted-foreground',
          className,
        )}
      >
        <Info className="h-4 w-4 mt-0.5 flex-shrink-0 text-foreground/60" aria-hidden="true" />
        <p className="leading-relaxed">{COPY.short}</p>
      </div>
    );
  }

  // 'card'
  return (
    <aside
      role="note"
      aria-label="Aviso médico"
      className={cn(
        'rounded-2xl border border-border/60 bg-card p-5 shadow-sm space-y-2',
        className,
      )}
    >
      <header className="flex items-center gap-2 text-foreground">
        <Info className="h-4 w-4 text-brand-terracotta" aria-hidden="true" />
        <h3 className="text-sm font-semibold">{COPY.title}</h3>
      </header>
      <p className="text-sm leading-relaxed text-muted-foreground">{COPY.short}</p>
    </aside>
  );
}
