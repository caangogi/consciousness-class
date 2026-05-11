/**
 * CrisisHelpResource — UI shown to a student when detectCrisis() flags
 * their input as potentially indicating self-harm or suicidal ideation.
 *
 * Design principles:
 *   - Calm, not alarmist. The student is already in a vulnerable state;
 *     a flashing red modal worsens the situation.
 *   - Concrete resources first (phone + chat), thinking later.
 *   - Spanish-first because the primary audience is Spanish-speaking.
 *   - NO claim to be a substitute for help. Just a bridge.
 *   - 24/7 nature highlighted (the student may be alone at 3am).
 *
 * MUST be invoked from:
 *   - Journal entry submission flow (Fase 6.1) — when detectCrisis()
 *     returns matched=true on the student's text
 *   - RAG Companion chat (Fase 6.2) — when the student's question
 *     trips a keyword
 *   - Agente Secretarial (Fase 6.3) — automatic escalation path
 *
 * Three render modes:
 *   - `banner`: inline strip above the input field after a detected match
 *   - `modal`:  overlay that interrupts the flow (most invasive)
 *   - `page`:   full surface for a dedicated /help-now route
 *
 * The resources listed are intentionally limited to Spain + general
 * Europe (112). Adding more countries requires verifying that each
 * number is currently operational; out of MVP scope.
 */
'use client';

import * as React from 'react';
import { Phone, MessageCircle, ExternalLink, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface CrisisHelpResourceProps {
  /** Visual mode. Default 'banner'. */
  variant?: 'banner' | 'modal' | 'page';
  /** Optional callback the parent uses to close a modal/dismiss the banner. */
  onDismiss?: () => void;
  className?: string;
}

interface HelpResource {
  /** Human-readable name. */
  label: string;
  /** Description shown under the label. */
  detail: string;
  /** Action — phone number or URL. */
  action: { kind: 'tel'; number: string } | { kind: 'url'; href: string };
  /** Icon for the row. */
  icon: React.ElementType;
  /** Whether to highlight as "primary" (the first suggestion). */
  primary?: boolean;
}

const RESOURCES: readonly HelpResource[] = [
  {
    label: 'Línea Atención a la Conducta Suicida · España',
    detail: 'Marca el 024 desde cualquier teléfono. Gratuito, 24/7, confidencial.',
    action: { kind: 'tel', number: '024' },
    icon: Phone,
    primary: true,
  },
  {
    label: 'Emergencias · Europa',
    detail: 'Si crees que tú u otra persona está en peligro inmediato.',
    action: { kind: 'tel', number: '112' },
    icon: Phone,
  },
  {
    label: 'Teléfono de la Esperanza',
    detail: 'Atención emocional gratuita, 24/7. Marca 717 003 717 o visita su web.',
    action: { kind: 'url', href: 'https://telefonodelaesperanza.org' },
    icon: MessageCircle,
  },
] as const;

function ResourceRow({ resource }: { resource: HelpResource }): React.ReactElement {
  const Icon = resource.icon;
  const href = resource.action.kind === 'tel'
    ? `tel:${resource.action.number}`
    : resource.action.href;
  const target = resource.action.kind === 'url' ? '_blank' : undefined;
  const rel = resource.action.kind === 'url' ? 'noopener noreferrer' : undefined;
  const cta = resource.action.kind === 'tel' ? `Llamar al ${resource.action.number}` : 'Ir a la web';

  return (
    <a
      href={href}
      target={target}
      rel={rel}
      className={cn(
        'flex items-start gap-3 p-4 rounded-xl border border-border/60 bg-card hover:shadow-md transition-all duration-200 group',
        resource.primary && 'border-brand-terracotta/40 bg-brand-terracotta/[0.03]',
      )}
    >
      <div
        className={cn(
          'h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0',
          resource.primary ? 'bg-brand-terracotta/15 text-brand-terracotta' : 'bg-secondary/60 text-muted-foreground',
        )}
      >
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">{resource.label}</p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{resource.detail}</p>
        <span className="inline-flex items-center gap-1 text-xs font-medium mt-2 text-foreground/80 group-hover:text-foreground transition-colors">
          {cta}
          <ExternalLink className="h-3 w-3" aria-hidden="true" />
        </span>
      </div>
    </a>
  );
}

const HEADING = 'Aquí estamos contigo';
const SUBHEADING =
  'Lo que escribes nos importa. Si te sientes en peligro o agobiado por pensamientos difíciles, estos recursos son gratuitos, anónimos y están disponibles ahora mismo.';

export function CrisisHelpResource({
  variant = 'banner',
  onDismiss,
  className,
}: CrisisHelpResourceProps): React.ReactElement {
  const body = (
    <>
      <header className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-full bg-brand-terracotta/15 text-brand-terracotta flex items-center justify-center flex-shrink-0">
          <Heart className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground">{HEADING}</h2>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{SUBHEADING}</p>
        </div>
      </header>

      <div className="space-y-2.5 mt-5">
        {RESOURCES.map((r) => (
          <ResourceRow key={r.label} resource={r} />
        ))}
      </div>

      <p className="mt-4 text-[11px] text-muted-foreground/80 leading-relaxed">
        Estos recursos no son un sustituto de la atención de un profesional de salud mental.
        Si tienes a alguien de confianza cerca, considera hablarle.
      </p>

      {onDismiss && (
        <div className="mt-4 flex justify-end">
          <Button variant="ghost" size="sm" onClick={onDismiss}>
            Entendido, continuar
          </Button>
        </div>
      )}
    </>
  );

  if (variant === 'banner') {
    return (
      <section
        role="alert"
        aria-label="Recursos de ayuda"
        className={cn(
          'rounded-2xl border-2 border-brand-terracotta/30 bg-card p-5 shadow-md',
          className,
        )}
      >
        {body}
      </section>
    );
  }

  if (variant === 'page') {
    return (
      <section
        role="region"
        aria-label="Recursos de ayuda"
        className={cn('max-w-2xl mx-auto py-12 px-4', className)}
      >
        {body}
      </section>
    );
  }

  // 'modal' — caller is responsible for the overlay/backdrop;
  // this just provides the panel content.
  return (
    <div
      role="alertdialog"
      aria-label="Recursos de ayuda"
      className={cn(
        'rounded-2xl bg-card p-6 shadow-2xl max-w-lg w-full',
        className,
      )}
    >
      {body}
    </div>
  );
}
