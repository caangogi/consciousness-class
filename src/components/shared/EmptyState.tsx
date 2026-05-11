/**
 * EmptyState · the canonical "nothing here yet" surface.
 *
 * Extracted from the Pack 3 sweep (`/dashboard/users`, `/learning`,
 * `/finances`) where the same dashed-border card + tinted icon square
 * + headline + paragraph + CTA appeared three times in a row. We
 * promote it to a shared component so every future empty surface
 * matches by default.
 *
 * Design tokens (frozen — change here, propagates everywhere):
 *   - Outer:  `rounded-2xl border border-dashed border-border/60`
 *             with `bg-card` and centered text.
 *   - Icon:   tinted square `h-14 w-14 rounded-2xl` with `/15`
 *             background and matching foreground. Six brand tints.
 *   - Title:  `text-base font-semibold text-foreground`.
 *   - Body:   `text-sm text-muted-foreground` capped at `max-w-md`.
 *   - CTA:    pill button `rounded-full h-11 px-6` using `bg-primary`.
 *
 * When NOT to use this:
 *   - As an error state (use a destructive variant of Card instead).
 *   - For loading placeholders (use `<Skeleton />`).
 *   - When the user has filters applied that produced no results — in
 *     that case the empty UX should hint at the filter, not invite
 *     onboarding. Build a different component or pass `dense` + a
 *     clear-filters secondary action.
 */
'use client';

import * as React from 'react';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type Tint = 'chambray' | 'terracotta' | 'sage' | 'olive' | 'primary' | 'muted';

interface EmptyStateAction {
  /** Visible label. */
  label: string;
  /** Internal Next.js route (e.g. `/products`) or absolute URL. */
  href: string;
  /** Open in a new tab. Mostly for `mailto:` or external resources. */
  external?: boolean;
}

interface EmptyStateProps {
  /** lucide-react icon component (e.g. `BookOpen`, `Users`, `Sparkles`). */
  icon: LucideIcon;
  /** Short headline. One sentence, no period. */
  title: string;
  /** One- or two-sentence explanation. Tells the user what would
   *  populate this surface and why it's currently empty. */
  description: string;
  /** Primary call-to-action. Renders as a pill button. */
  primary?: EmptyStateAction;
  /** Secondary call-to-action. Renders as a subtle text link below the primary. */
  secondary?: EmptyStateAction;
  /** Brand tint applied to the icon square. Defaults to `chambray`. */
  tint?: Tint;
  /** Reduce vertical padding (`py-10`) for tighter contexts. */
  dense?: boolean;
  /** Extra classes applied to the outer card. */
  className?: string;
}

const TINT_CLASSES: Record<Tint, string> = {
  chambray:   'bg-brand-chambray/15 text-brand-chambray',
  terracotta: 'bg-brand-terracotta/15 text-brand-terracotta',
  sage:       'bg-brand-sage/15 text-brand-sage',
  olive:      'bg-brand-olive/15 text-brand-olive',
  primary:    'bg-primary/10 text-primary',
  muted:      'bg-secondary/60 text-muted-foreground',
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  primary,
  secondary,
  tint = 'chambray',
  dense = false,
  className,
}: EmptyStateProps): React.ReactElement {
  return (
    <div
      className={cn(
        'rounded-2xl border border-dashed border-border/60 bg-card px-6 text-center',
        dense ? 'py-10' : 'py-14',
        className
      )}
    >
      <div
        className={cn(
          'inline-flex items-center justify-center h-14 w-14 rounded-2xl mb-4',
          TINT_CLASSES[tint]
        )}
      >
        <Icon className="h-7 w-7" aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
        {description}
      </p>
      {(primary || secondary) && (
        <div className="mt-6 flex flex-col items-center gap-3">
          {primary && (
            <Link
              href={primary.href}
              target={primary.external ? '_blank' : undefined}
              rel={primary.external ? 'noopener noreferrer' : undefined}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-6 h-11 text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              {primary.label}
            </Link>
          )}
          {secondary && (
            <Link
              href={secondary.href}
              target={secondary.external ? '_blank' : undefined}
              rel={secondary.external ? 'noopener noreferrer' : undefined}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline"
            >
              {secondary.label}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
