'use client';

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Check,
  Sparkles,
  Leaf,
  Star,
  ArrowRight,
  Mail,
  Infinity as InfinityIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ---------- Data ----------

type TierFeature = { label: string; emphasis?: boolean };

interface Tier {
  id: 'free' | 'pro' | 'enterprise';
  name: string;
  tagline: string;
  price: string;
  priceSuffix?: string;
  priceFootnote?: string;
  highlighted?: boolean;
  features: TierFeature[];
  cta: {
    label: string;
    href: string;
    disabled?: boolean;
    ariaLabel: string;
  };
}

const TIERS: Tier[] = [
  {
    id: 'free',
    name: 'Empieza',
    tagline: 'Para probar el producto sin presión',
    price: '€0',
    priceSuffix: '/ mes',
    features: [
      { label: '1 producto activo (curso, comunidad, descarga, podcast o coaching)' },
      { label: 'Hasta 50 estudiantes / suscriptores' },
      {
        label: '500 créditos AI / mes — con renovación mensual, sin rollover',
        emphasis: true,
      },
      { label: 'Editor asistivo y generación de portadas IA' },
      { label: 'Pasarela de pago Stripe integrada' },
      { label: 'Comisión plataforma: 12%' },
    ],
    cta: {
      label: 'Empezar gratis',
      href: '#signup',
      disabled: true,
      ariaLabel: 'Empezar gratis — disponible al lanzamiento',
    },
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'Para quien hace de esto su trabajo',
    price: '€9',
    priceSuffix: '/ mes',
    priceFootnote: 'Facturación anual disponible con 20% de descuento',
    highlighted: true,
    features: [
      { label: 'Productos ilimitados (los 6 tipos de activo)' },
      { label: 'Estudiantes ilimitados' },
      {
        label: '5000 créditos AI / mes — suficiente para uso intensivo',
        emphasis: true,
      },
      {
        label:
          'Todas las features IA: editor, covers, magic doc, estructura de cursos, RAG companion y journaling (próximamente)',
      },
      { label: 'Booking de sesiones 1:1 con calendario y pagos' },
      { label: 'Sistema de afiliados multi-nivel' },
      { label: 'Analytics avanzados' },
      { label: 'Comisión plataforma: 8%' },
      { label: 'Soporte prioritario por email' },
    ],
    cta: {
      label: 'Suscribirme — €9/mes',
      href: '#subscribe-pro',
      disabled: true,
      ariaLabel: 'Suscribirme al plan Pro — disponible al lanzamiento',
    },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    tagline: 'Para escuelas, equipos terapéuticos y centros holísticos',
    price: 'A medida',
    features: [
      { label: 'Todo lo de Pro' },
      { label: 'Créditos AI personalizados', emphasis: true },
      { label: 'White-label de emails y portales (tu dominio + tu marca)' },
      { label: 'DPA firmado — GDPR Art. 9 (datos de salud)' },
      { label: 'SLA contractual y región EU dedicada' },
      { label: 'Onboarding guiado y formación al equipo' },
      { label: 'Comisión plataforma: negociable' },
      { label: 'Account manager dedicado' },
    ],
    cta: {
      label: 'Hablar con nosotros',
      href: 'mailto:hello@consciousness.class?subject=Plan%20Enterprise',
      ariaLabel: 'Escribir un email para hablar del plan Enterprise',
    },
  },
];

interface TopUp {
  price: string;
  credits: string;
  bonus: string | null;
}

const TOP_UPS: TopUp[] = [
  { price: '€5', credits: '2.500 créditos', bonus: null },
  { price: '€20', credits: '12.000 créditos', bonus: '+20% bonus' },
  { price: '€50', credits: '35.000 créditos', bonus: '+40% bonus' },
];

const FAQS: { q: string; a: string }[] = [
  {
    q: '¿Qué son los créditos AI y cómo se consumen?',
    a: 'Los créditos representan tu presupuesto mensual para usar las features de inteligencia artificial. Cada generación (una portada, un texto mejorado, un documento mágico) consume una cantidad pequeña — típicamente entre 5 y 70 créditos según la complejidad. Te mostramos el coste antes de cada acción.',
  },
  {
    q: '¿Qué pasa si me quedo sin créditos a mitad de mes?',
    a: 'Te avisamos antes de quedarte sin créditos. Puedes comprar un pack puntual o esperar a la renovación mensual del día 1. No degradamos silenciosamente la calidad del servicio.',
  },
  {
    q: '¿Los créditos no usados se acumulan?',
    a: 'Los créditos del plan mensual (Empieza / Pro) se reinician cada mes. Los créditos comprados en packs adicionales NO expiran nunca.',
  },
  {
    q: '¿Cómo funciona la comisión de plataforma?',
    a: 'Cuando un estudiante te paga (por un curso, sesión o suscripción), Stripe recibe el pago, nuestra plataforma deduce la comisión indicada, y el resto se acumula en tu balance disponible para retirar mensualmente vía Stripe Connect.',
  },
  {
    q: '¿Puedo cambiar de plan en cualquier momento?',
    a: 'Sí, en cualquier momento. Al subir de plan los créditos AI se actualizan al instante. Al bajar de plan, mantienes tu tier actual hasta el final del periodo facturado.',
  },
  {
    q: '¿Mis datos están seguros? ¿Y los de mis pacientes?',
    a: 'Sí. Cumplimos GDPR y el plan Enterprise incluye DPA firmado. Los datos de pacientes (journaling, conversaciones con el bot companion) viajan por endpoints dedicados con región EU y prohibición explícita de entrenamiento de modelos.',
  },
];

// ---------- Page ----------

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* ============== HERO ============== */}
      <section
        aria-labelledby="hero-heading"
        className="relative overflow-hidden"
      >
        {/* decorative organic shapes */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 -right-24 h-[28rem] w-[28rem] rounded-full bg-brand-sandstone/40 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 -left-24 h-[20rem] w-[20rem] rounded-full bg-brand-muslin/60 blur-3xl"
        />

        <div className="container relative mx-auto px-4 py-20 lg:py-28">
          <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-7">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-brand-terracotta">
                Consciousness Class
              </p>
              <h1
                id="hero-heading"
                className="font-headline text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl lg:leading-[1.1]"
              >
                Vende cursos, sesiones y comunidad sin pelearte con la
                infraestructura.
              </h1>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground lg:text-lg">
                Una plataforma todo-en-uno para creadores holísticos. Tú pones
                la sabiduría — nosotros la tecnología, los pagos, la IA y la
                cabeza fría.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button
                  asChild={false}
                  disabled
                  aria-label="Empezar gratis — disponible al lanzamiento"
                  className="h-11 rounded-full bg-primary px-7 text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="inline-flex items-center gap-2">
                    Empezar gratis
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </span>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="h-11 rounded-full border-foreground/15 bg-background px-7 text-foreground hover:bg-secondary"
                >
                  <a
                    href="mailto:hello@consciousness.class"
                    aria-label="Enviar email para hablar con nosotros"
                  >
                    <Mail className="mr-2 h-4 w-4" aria-hidden />
                    Hablar con nosotros
                  </a>
                </Button>
              </div>

              <p className="mt-5 text-sm text-muted-foreground">
                Sin tarjeta. Cancela cuando quieras.
              </p>
            </div>

            {/* decorative constellation */}
            <div
              aria-hidden
              className="hidden lg:col-span-5 lg:flex lg:justify-end"
            >
              <div className="relative h-72 w-72">
                <div className="absolute inset-0 rounded-[40%_60%_55%_45%/50%_45%_55%_50%] bg-gradient-to-br from-brand-sandstone via-brand-muslin to-brand-terracotta/30 shadow-apple" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-3 text-foreground/80">
                    <Leaf className="h-10 w-10 text-brand-terracotta" />
                    <Sparkles className="h-8 w-8 text-foreground/70" />
                    <Star className="h-6 w-6 text-foreground/60" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============== TIERS ============== */}
      <section
        aria-labelledby="tiers-heading"
        className="container mx-auto px-4 py-16 lg:py-24"
      >
        <div className="mx-auto mb-12 max-w-2xl text-center lg:mb-16">
          <h2
            id="tiers-heading"
            className="font-headline text-3xl font-semibold tracking-tight sm:text-4xl"
          >
            Planes que crecen contigo
          </h2>
          <p className="mt-4 text-base text-muted-foreground lg:text-lg">
            Empieza gratis. Sube cuando tu práctica lo pida. Sin sorpresas en la
            factura.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3 lg:items-start lg:gap-8">
          {TIERS.map((tier) => (
            <TierCard key={tier.id} tier={tier} />
          ))}
        </div>
      </section>

      {/* ============== TOP-UPS ============== */}
      <section
        aria-labelledby="topups-heading"
        className="bg-secondary/60"
      >
        <div className="container mx-auto px-4 py-16 lg:py-24">
          <div className="mx-auto mb-10 max-w-2xl text-center lg:mb-14">
            <h2
              id="topups-heading"
              className="font-headline text-2xl font-semibold tracking-tight sm:text-3xl"
            >
              ¿Necesitas más créditos puntualmente?
            </h2>
            <p className="mt-3 text-base text-muted-foreground lg:text-lg">
              Compra packs adicionales que{' '}
              <span className="font-semibold text-foreground">
                no expiran
              </span>{' '}
              — a diferencia de los créditos mensuales.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 sm:gap-6">
            {TOP_UPS.map((pack) => (
              <Card
                key={pack.price}
                className="group rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
              >
                <CardContent className="flex flex-col items-start gap-3 p-6">
                  <div className="flex w-full items-start justify-between">
                    <div className="text-3xl font-semibold tracking-tight">
                      {pack.price}
                    </div>
                    {pack.bonus && (
                      <Badge className="rounded-full bg-brand-terracotta px-3 py-1 text-xs font-medium text-white hover:bg-brand-terracotta">
                        {pack.bonus}
                      </Badge>
                    )}
                  </div>
                  <div className="text-base text-foreground">
                    {pack.credits}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Se añaden a tu balance y no caducan nunca.
                  </p>
                  <Button
                    disabled
                    aria-label={`Añadir pack de ${pack.price} — requiere iniciar sesión`}
                    className="mt-3 h-11 w-full rounded-full bg-foreground px-6 text-background hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Añadir pack
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Los packs se pueden comprar desde el dashboard una vez tengas
            cuenta.
          </p>
        </div>
      </section>

      {/* ============== FAQ ============== */}
      <section
        aria-labelledby="faq-heading"
        className="container mx-auto px-4 py-16 lg:py-24"
      >
        <div className="mx-auto max-w-3xl">
          <div className="mb-10 text-center lg:mb-14">
            <h2
              id="faq-heading"
              className="font-headline text-3xl font-semibold tracking-tight sm:text-4xl"
            >
              Preguntas frecuentes
            </h2>
            <p className="mt-3 text-base text-muted-foreground lg:text-lg">
              Todo lo que importa antes de empezar.
            </p>
          </div>

          <Card className="rounded-2xl border border-border bg-card shadow-sm">
            <CardContent className="px-6 py-2 sm:px-8">
              <Accordion type="single" collapsible className="w-full">
                {FAQS.map((faq, i) => (
                  <AccordionItem
                    key={i}
                    value={`item-${i}`}
                    className="border-border last:border-0"
                  >
                    <AccordionTrigger className="text-left text-base font-medium hover:no-underline sm:text-lg">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-base leading-relaxed text-muted-foreground">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ============== FOOTER CTA ============== */}
      <section
        aria-labelledby="footer-cta-heading"
        className="relative overflow-hidden bg-foreground text-background"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 left-1/2 h-[24rem] w-[24rem] -translate-x-1/2 rounded-full bg-brand-terracotta/20 blur-3xl"
        />
        <div className="container relative mx-auto px-4 py-20 text-center lg:py-24">
          <h2
            id="footer-cta-heading"
            className="font-headline text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl"
          >
            ¿Empezamos hoy?
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base text-background/80 lg:text-lg">
            Sin compromiso. Cancela cuando quieras. Tu sabiduría merece la
            infraestructura adecuada.
          </p>
          <div className="mt-8 flex justify-center">
            <Button
              disabled
              aria-label="Crear cuenta gratis — disponible al lanzamiento"
              className="h-12 rounded-full bg-background px-8 text-foreground hover:bg-background/90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <span className="inline-flex items-center gap-2 text-base font-medium">
                Crear cuenta gratis
                <ArrowRight className="h-4 w-4" aria-hidden />
              </span>
            </Button>
          </div>
          <p className="mt-6 text-sm text-background/60">
            ¿Dudas?{' '}
            <a
              href="mailto:hello@consciousness.class"
              className="underline-offset-4 hover:underline"
            >
              hello@consciousness.class
            </a>
          </p>
        </div>
      </section>
    </main>
  );
}

// ---------- Subcomponents ----------

function TierCard({ tier }: { tier: Tier }) {
  const isPro = tier.highlighted;

  return (
    <Card
      className={cn(
        'relative flex h-full flex-col rounded-2xl border bg-card shadow-sm transition-all duration-300 hover:shadow-md',
        isPro
          ? 'border-2 border-brand-terracotta lg:-translate-y-2 lg:shadow-apple'
          : 'border-border hover:-translate-y-0.5'
      )}
    >
      {isPro && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="rounded-full bg-brand-terracotta px-4 py-1 text-xs font-semibold uppercase tracking-wider text-white hover:bg-brand-terracotta">
            Más elegida
          </Badge>
        </div>
      )}

      <CardHeader className="space-y-2 px-6 pt-8 pb-2 sm:px-8">
        <div className="flex items-center gap-2">
          <h3 className="font-headline text-xl font-semibold tracking-tight">
            {tier.name}
          </h3>
          {tier.id === 'enterprise' && (
            <InfinityIcon
              className="h-5 w-5 text-muted-foreground"
              aria-hidden
            />
          )}
        </div>
        <p className="text-sm text-muted-foreground">{tier.tagline}</p>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col px-6 pb-8 sm:px-8">
        <div className="mt-2 mb-6 flex items-baseline gap-2">
          <span className="text-4xl font-semibold tracking-tight lg:text-5xl">
            {tier.price}
          </span>
          {tier.priceSuffix && (
            <span className="text-base text-muted-foreground">
              {tier.priceSuffix}
            </span>
          )}
        </div>
        {tier.priceFootnote && (
          <p className="-mt-4 mb-6 text-xs text-muted-foreground">
            {tier.priceFootnote}
          </p>
        )}

        <Separator className="mb-6" />

        <ul className="mb-8 flex flex-1 flex-col gap-3.5">
          {tier.features.map((feat, i) => (
            <li key={i} className="flex items-start gap-3">
              <span
                className={cn(
                  'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full',
                  isPro
                    ? 'bg-brand-terracotta/15 text-brand-terracotta'
                    : 'bg-secondary text-foreground/70'
                )}
                aria-hidden
              >
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
              </span>
              <span
                className={cn(
                  'text-sm leading-relaxed',
                  feat.emphasis
                    ? 'font-medium text-foreground'
                    : 'text-foreground/80'
                )}
              >
                {feat.label}
              </span>
            </li>
          ))}
        </ul>

        {tier.cta.disabled ? (
          <Button
            disabled
            aria-label={tier.cta.ariaLabel}
            className={cn(
              'mt-auto h-11 w-full rounded-full px-6 text-base font-medium disabled:cursor-not-allowed disabled:opacity-60',
              isPro
                ? 'bg-brand-terracotta text-white hover:bg-brand-terracotta/90'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            )}
          >
            {tier.cta.label}
          </Button>
        ) : (
          <Button
            asChild
            className={cn(
              'mt-auto h-11 w-full rounded-full px-6 text-base font-medium',
              isPro
                ? 'bg-brand-terracotta text-white hover:bg-brand-terracotta/90'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            )}
          >
            <a href={tier.cta.href} aria-label={tier.cta.ariaLabel}>
              {tier.cta.label}
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
