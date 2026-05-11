/**
 * CreatorOnboardingBanner — shown to a creator on /dashboard when they
 * have not yet completed the foundational setup steps.
 *
 * Why it exists: the original PM plan flagged the "signup → first
 * published asset" path as the highest-abandonment moment for new
 * creators. Without guidance, a fresh creator lands on a dashboard
 * full of zeros and bounces. This banner converts the void into a
 * concrete checklist.
 *
 * The component is intentionally:
 *   - Self-contained (no Redux/Zustand, just props)
 *   - Dismissible per-session (sessionStorage, not Firestore — the
 *     persistence layer is owned by the parent if needed long-term)
 *   - Composable as a Card so it slots naturally above whatever the
 *     dashboard renders today
 *
 * Steps are passed in by the caller (the dashboard page knows which
 * are done) so the banner is reusable for variants like:
 *   - First-time creator: profile / asset / share
 *   - Pro upgrade waiting: KYC / Stripe Connect / payout method
 * etc.
 */
'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X, Sparkles, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface OnboardingStep {
  id: string;
  /** Short heading, e.g. "Completa tu perfil". */
  title: string;
  /** One-line explanation, can be a sentence. */
  description: string;
  /** True when the step is already done — renders as a check, not a CTA. */
  done: boolean;
  /** Route the CTA points to. */
  href: string;
  /** Optional CTA label override. Defaults to "Hacerlo ahora". */
  ctaLabel?: string;
}

export interface CreatorOnboardingBannerProps {
  /** Greeting prefix: "Bienvenido, {name}". */
  creatorName?: string;
  steps: OnboardingStep[];
  /** Optional dismiss callback. If provided, an X button appears. */
  onDismiss?: () => void;
  className?: string;
}

function StepRow({ step }: { step: OnboardingStep }): React.ReactElement {
  return (
    <li
      className={cn(
        'flex items-start gap-3 py-3 px-4 rounded-xl border border-border/40 bg-card',
        step.done && 'opacity-60',
      )}
    >
      <div
        aria-hidden="true"
        className={cn(
          'h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold',
          step.done
            ? 'bg-primary/15 text-primary'
            : 'bg-brand-terracotta/15 text-brand-terracotta',
        )}
      >
        {step.done ? <Check className="h-3.5 w-3.5" /> : '·'}
      </div>

      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-sm font-medium text-foreground',
          step.done && 'line-through decoration-[0.5px]',
        )}>
          {step.title}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
          {step.description}
        </p>
      </div>

      {!step.done && (
        <Button asChild variant="ghost" size="sm" className="rounded-full h-8 flex-shrink-0 -mr-1">
          <Link href={step.href}>
            {step.ctaLabel ?? 'Hacerlo ahora'}
            <ArrowRight className="ml-1 h-3 w-3" aria-hidden="true" />
          </Link>
        </Button>
      )}
    </li>
  );
}

export function CreatorOnboardingBanner({
  creatorName,
  steps,
  onDismiss,
  className,
}: CreatorOnboardingBannerProps): React.ReactElement | null {
  // Compute progress for the optional progress hint
  const doneCount = steps.filter((s) => s.done).length;
  const total = steps.length;
  const allDone = doneCount === total;

  // If everything is done and there is a dismiss handler, the parent
  // probably already hides us. But just in case, render nothing.
  if (allDone && onDismiss) return null;

  return (
    <Card className={cn('rounded-2xl shadow-sm border-brand-terracotta/20 bg-gradient-to-br from-brand-terracotta/[0.04] to-transparent', className)}>
      <CardHeader className="pb-3 flex flex-row items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="h-10 w-10 rounded-xl bg-brand-terracotta/15 text-brand-terracotta flex items-center justify-center flex-shrink-0">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <CardTitle className="text-base font-semibold text-foreground">
              {creatorName ? `Bienvenido, ${creatorName}.` : 'Bienvenido a Consciousness Class.'}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              Tres pasos rápidos para tener tu espacio listo. Te lleva menos de 10 minutos.
            </p>
          </div>
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Ocultar onboarding"
            className="h-8 w-8 rounded-full hover:bg-secondary/60 transition-colors flex items-center justify-center text-muted-foreground hover:text-foreground -mr-1 -mt-1 flex-shrink-0"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </CardHeader>

      <CardContent className="space-y-2 pt-1">
        {/* Progress hint */}
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground/80 font-medium mb-2">
          {doneCount === 0 ? 'Empieza por aquí' : `${doneCount} de ${total} completado${doneCount === 1 ? '' : 's'}`}
        </p>

        <ul className="space-y-2">
          {steps.map((step) => (
            <StepRow key={step.id} step={step} />
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
