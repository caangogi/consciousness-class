/**
 * /manifesto · the spiritual home of the project.
 *
 * Reachable from:
 *   - Footer (Plataforma column).
 *   - Linked from Landing's "Por qué existimos" sub-line (added in a
 *     follow-up if/when the Landing copy is revisited).
 *
 * Tone: declarative, calm, no jargon. We are not trying to convert
 * the visitor here — they have already arrived. The job is to
 * surface the founding belief in language they would use among
 * peers, not in marketing-speak.
 *
 * Rendered as a server component: no interactivity is needed, and
 * server-rendering gives us a 0-JS page (good for SEO + first
 * paint).
 */
import * as React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Leaf, Heart, ShieldCheck, Compass, ArrowRight, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Manifesto · Consciousness Class',
  description:
    'Por qué existimos: una infraestructura para creadores holísticos que respeta el cuerpo, la sabiduría y el tiempo de quien enseña.',
  openGraph: {
    title: 'Manifesto · Consciousness Class',
    description:
      'Por qué existimos: una infraestructura para creadores holísticos que respeta el cuerpo, la sabiduría y el tiempo de quien enseña.',
    type: 'website',
  },
};

interface Principle {
  icon: React.ComponentType<{ className?: string }>;
  tintBg: string;
  tintFg: string;
  title: string;
  body: string;
}

const PRINCIPLES: Principle[] = [
  {
    icon: Heart,
    tintBg: 'bg-brand-terracotta/15',
    tintFg: 'text-brand-terracotta',
    title: 'Tu sabiduría, no nuestra plataforma',
    body:
      'El protagonismo es tuyo. Diseñamos cada superficie para que tu voz, tu método y tu marca queden al frente — no nuestro logo, no nuestras notificaciones, no nuestras métricas de vanidad. Si decides marcharte mañana, te llevas tu audiencia, tus contenidos y tus pagos. Sin cláusulas.',
  },
  {
    icon: ShieldCheck,
    tintBg: 'bg-brand-chambray/15',
    tintFg: 'text-brand-chambray',
    title: 'Una infraestructura que respeta el cuerpo',
    body:
      'No usamos dark patterns. No incentivamos sesiones interminables. No ocultamos el botón de cancelar. Creemos que una herramienta para el bienestar no puede pelearse con lo que dice promover — y que la confianza es un activo más valioso que el engagement medido en minutos.',
  },
  {
    icon: Compass,
    tintBg: 'bg-brand-olive/15',
    tintFg: 'text-brand-olive',
    title: 'Crece sin perderte',
    body:
      'Aprendimos viéndolo en silencio: muchas prácticas holísticas se rompen cuando se profesionalizan. La administración devora la presencia, la facturación devora la creatividad. Construimos para que el negocio sea ligero — para que puedas escalar sin sacrificar la calidad de presencia que te trajo aquí.',
  },
];

interface AudienceItem {
  label: string;
}

const AUDIENCE_YES: AudienceItem[] = [
  { label: 'Terapeutas, coaches, facilitadores y profesores con un método propio.' },
  { label: 'Personas que ya tienen una comunidad — pequeña o grande — y quieren dejar de pelearse con cinco herramientas.' },
  { label: 'Creadores que quieren cobrar de forma profesional sin renunciar al cuidado en cada interacción.' },
];

const AUDIENCE_NO: AudienceItem[] = [
  { label: 'Cursos de marketing agresivo o "fórmulas para 10k en 30 días". Hay otras plataformas para eso.' },
  { label: 'Quien busque la mayor cantidad de funcionalidades a cualquier coste. Nosotros decimos que no a menudo.' },
  { label: 'Modelos basados en escasez artificial, urgencia falsa o testimonios fabricados.' },
];

export default function ManifestoPage(): React.ReactElement {
  return (
    <main className="min-h-screen bg-background">
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="px-4 sm:px-6 md:px-8 pt-16 md:pt-24 pb-12 md:pb-16">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-brand-terracotta/15 text-brand-terracotta mb-6">
            <Leaf className="h-6 w-6" aria-hidden="true" />
          </div>
          <p className="text-xs font-medium tracking-wider uppercase text-muted-foreground mb-3">
            Manifesto
          </p>
          <h1 className="font-headline text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-foreground leading-[1.08]">
            Una infraestructura{' '}
            <span className="bg-gradient-to-r from-brand-terracotta via-brand-clove to-brand-terracotta bg-clip-text text-transparent">
              que respeta el cuerpo
            </span>{' '}
            de quien enseña.
          </h1>
          <p className="text-base md:text-lg text-muted-foreground mt-6 max-w-2xl mx-auto leading-relaxed">
            Consciousness Class nace de una intuición simple: las herramientas
            para creadores holísticos deberían parecerse a lo que ofrecen.
            Calma. Claridad. Cuidado.
          </p>
        </div>
      </section>

      {/* ── Por qué existimos ────────────────────────────────────── */}
      <section className="px-4 sm:px-6 md:px-8 pb-16 md:pb-20">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-3xl border border-border/50 bg-brand-muslin dark:bg-black/30 p-8 md:p-12 shadow-sm">
            <h2 className="text-2xl md:text-3xl font-semibold text-foreground tracking-tight mb-4">
              Por qué existimos
            </h2>
            <div className="space-y-4 text-base md:text-lg text-foreground/85 leading-relaxed">
              <p>
                Durante años vimos a terapeutas, coaches y maestros con
                trayectorias profundas atrapados malabareando cinco
                plataformas. Una para cobrar, otra para reservar, otra para
                comunicar, otra para sus cursos, otra para su comunidad.
              </p>
              <p>
                Cada herramienta extra es una pequeña fuga de presencia. Y la
                presencia es exactamente lo que su trabajo necesita.
              </p>
              <p className="text-foreground font-medium">
                Decidimos construir una sola plataforma que recoja todo eso —
                con la disciplina de quitar más que añadir.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Tres principios ──────────────────────────────────────── */}
      <section className="px-4 sm:px-6 md:px-8 pb-16 md:pb-20 bg-secondary/30">
        <div className="max-w-3xl mx-auto pt-12 md:pt-16">
          <div className="text-center mb-12 md:mb-14">
            <p className="text-xs font-medium tracking-wider uppercase text-muted-foreground mb-2">
              Tres principios fundacionales
            </p>
            <h2 className="text-2xl md:text-3xl font-semibold text-foreground tracking-tight">
              Cómo decidimos cuando nadie está mirando
            </h2>
          </div>

          <div className="space-y-6">
            {PRINCIPLES.map((principle, idx) => {
              const Icon = principle.icon;
              return (
                <article
                  key={principle.title}
                  className="rounded-2xl border border-border/50 bg-card p-6 md:p-8 shadow-sm"
                >
                  <div className="flex items-start gap-4 md:gap-6">
                    <div
                      className={cn(
                        'h-12 w-12 rounded-2xl flex items-center justify-center flex-shrink-0',
                        principle.tintBg,
                        principle.tintFg
                      )}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium tracking-wider uppercase text-muted-foreground mb-1">
                        {String(idx + 1).padStart(2, '0')} · Principio
                      </p>
                      <h3 className="text-lg md:text-xl font-semibold text-foreground mb-3 tracking-tight">
                        {principle.title}
                      </h3>
                      <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                        {principle.body}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Para quién sí · Para quién no ─────────────────────────── */}
      <section className="px-4 sm:px-6 md:px-8 py-16 md:py-20">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-semibold text-foreground tracking-tight">
              Para quién es — y para quién no
            </h2>
            <p className="text-sm md:text-base text-muted-foreground mt-3 max-w-xl mx-auto leading-relaxed">
              Preferimos perder al cliente equivocado que ganarlo a costa de
              nuestra integridad. Esta lista existe para que tú decidas.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Yes column */}
            <div className="rounded-2xl border border-brand-olive/30 bg-brand-olive/[0.04] p-6 md:p-7">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-brand-olive/15 text-brand-olive flex items-center justify-center">
                  <Check className="h-4 w-4" />
                </div>
                <h3 className="text-base font-semibold text-foreground">Para quién es</h3>
              </div>
              <ul className="space-y-3">
                {AUDIENCE_YES.map((item) => (
                  <li key={item.label} className="flex items-start gap-2 text-sm text-foreground/85 leading-relaxed">
                    <Check className="h-4 w-4 text-brand-olive flex-shrink-0 mt-0.5" aria-hidden="true" />
                    <span>{item.label}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* No column */}
            <div className="rounded-2xl border border-border/50 bg-card p-6 md:p-7">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-muted text-muted-foreground flex items-center justify-center">
                  <X className="h-4 w-4" />
                </div>
                <h3 className="text-base font-semibold text-foreground">Para quién no es</h3>
              </div>
              <ul className="space-y-3">
                {AUDIENCE_NO.map((item) => (
                  <li key={item.label} className="flex items-start gap-2 text-sm text-muted-foreground leading-relaxed">
                    <X className="h-4 w-4 text-muted-foreground/60 flex-shrink-0 mt-0.5" aria-hidden="true" />
                    <span>{item.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Hacia dónde vamos ────────────────────────────────────── */}
      <section className="px-4 sm:px-6 md:px-8 pb-16 md:pb-20">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-3xl border border-brand-chambray/20 bg-gradient-to-br from-brand-chambray/[0.04] to-transparent p-8 md:p-12">
            <p className="text-xs font-medium tracking-wider uppercase text-brand-chambray mb-3">
              Hacia dónde vamos
            </p>
            <h2 className="text-2xl md:text-3xl font-semibold text-foreground tracking-tight mb-4">
              Lo que estamos construyendo
            </h2>
            <div className="space-y-4 text-base text-foreground/85 leading-relaxed">
              <p>
                A medio plazo: que un terapeuta pueda vivir dignamente de su
                práctica sin convertirse en marketer a tiempo completo. Que
                una facilitadora pueda llevar un programa de seis meses a
                cuarenta personas sin perder el sueño por la logística.
              </p>
              <p>
                A largo plazo: que la profesión holística tenga la
                infraestructura digital que merece — una que no la traicione
                cada vez que el sector tecnológico cambia de moda.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <section className="px-4 sm:px-6 md:px-8 pb-20 md:pb-28">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-xl md:text-2xl font-semibold text-foreground tracking-tight mb-3">
            ¿Te resuena?
          </h2>
          <p className="text-sm md:text-base text-muted-foreground mb-7 leading-relaxed">
            No necesitas decidir nada hoy. Echa un vistazo a lo que ya está
            disponible y, si encaja, prueba sin compromiso.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-7 h-12 text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Ver el catálogo
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline"
            >
              Ver precios
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
