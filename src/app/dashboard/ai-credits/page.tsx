'use client';

/**
 * AI Credits dashboard preview page.
 *
 * Today this page is wired with MOCK data — there is no AICreditWallet
 * backend yet (lands in the AI Credits Sprint AC1, see
 * documentation/prds/ai-credits-system.md). It exists so:
 *   - The founder can see how the system will look when it ships
 *   - The product narrative (free 500 / pro 5000 / top-ups) is tangible
 *   - The "out of credits" UX (D-AC-6: hard block, clear CTA) has a
 *     visible preview
 *
 * When AC1 ships, mockData is replaced by a fetch to /api/me/ai-credits
 * and the modal triggers from real 402 responses.
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Sparkles,
  Image as ImageIcon,
  FileText,
  BookOpen,
  Zap,
  Plus,
  TrendingDown,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

// ─── Mock data (replaced by real fetch in AC1) ───────────────────────────

const MOCK_BALANCE = {
  tier: 'pro' as const,
  tierLabel: 'Pro',
  grantedThisMonth: 5000,
  usedThisMonth: 3147,
  rolloverCredits: 1200, // From a previous top-up pack
  renewsInDays: 11,
};

interface UsageEntry {
  feature: 'ai-cover' | 'assistive-edit' | 'magic-doc' | 'course-structure';
  label: string;
  icon: React.ElementType;
  cost: number;
  whenLabel: string;
}

const MOCK_RECENT_USAGE: UsageEntry[] = [
  { feature: 'ai-cover',         label: 'Portada IA generada',     icon: ImageIcon, cost: 70,  whenLabel: 'hace 2 horas' },
  { feature: 'magic-doc',        label: 'Documento mágico (Lead Magnet)', icon: FileText, cost: 25, whenLabel: 'hace 3 horas' },
  { feature: 'assistive-edit',   label: 'Texto mejorado · tono empático', icon: Sparkles, cost: 4,  whenLabel: 'hace 5 horas' },
  { feature: 'assistive-edit',   label: 'Texto resumido',          icon: Sparkles,  cost: 3,  whenLabel: 'ayer' },
  { feature: 'course-structure', label: 'Estructura de curso generada', icon: BookOpen, cost: 18, whenLabel: 'ayer' },
  { feature: 'ai-cover',         label: 'Portada IA generada',     icon: ImageIcon, cost: 70,  whenLabel: 'ayer' },
];

const TOP_UP_PACKS = [
  { price: 5,  credits: 2500,  bonus: 0,  popular: false },
  { price: 20, credits: 12000, bonus: 20, popular: true  },
  { price: 50, credits: 35000, bonus: 40, popular: false },
];

const FEATURE_LABELS: Record<UsageEntry['feature'], string> = {
  'ai-cover':         'Portadas IA',
  'assistive-edit':   'Editor asistivo',
  'magic-doc':        'Documento mágico',
  'course-structure': 'Estructura de cursos',
};

// ─── Component ───────────────────────────────────────────────────────────

export default function AICreditsPage(): React.ReactElement {
  const [showOutOfCreditsPreview, setShowOutOfCreditsPreview] = useState(false);

  const remaining = MOCK_BALANCE.grantedThisMonth - MOCK_BALANCE.usedThisMonth + MOCK_BALANCE.rolloverCredits;
  const usedPct = (MOCK_BALANCE.usedThisMonth / MOCK_BALANCE.grantedThisMonth) * 100;
  const totalAvailable = MOCK_BALANCE.grantedThisMonth + MOCK_BALANCE.rolloverCredits;

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Page header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-5 w-5 text-brand-terracotta" />
          <p className="text-xs font-medium tracking-wider uppercase text-muted-foreground">
            Créditos AI
          </p>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Tu consumo de IA</h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          Los créditos se consumen al usar features de inteligencia artificial (portadas, editor, magic docs).
          Los del plan mensual se reinician el día 1; los créditos comprados en packs no expiran.
        </p>
      </div>

      {/* Balance card (the centerpiece) */}
      <Card className="rounded-2xl shadow-sm overflow-hidden">
        <CardHeader className="bg-secondary/30 pb-4">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge className="bg-brand-terracotta text-white rounded-full px-3 py-0.5 text-[10px] uppercase tracking-wider font-semibold">
                  Plan {MOCK_BALANCE.tierLabel}
                </Badge>
                <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                  <RefreshCw className="h-3 w-3" />
                  Renueva en {MOCK_BALANCE.renewsInDays} días
                </span>
              </div>
              <CardTitle className="text-3xl font-semibold tabular-nums text-foreground">
                {remaining.toLocaleString('es-ES')}{' '}
                <span className="text-lg font-normal text-muted-foreground">/ {totalAvailable.toLocaleString('es-ES')} créditos</span>
              </CardTitle>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="rounded-full h-10 px-5 shadow-sm">
                  <Plus className="h-4 w-4 mr-1.5" />
                  Comprar pack
                </Button>
              </DialogTrigger>
              <TopUpDialogContent />
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="pt-5 space-y-4">
          <div>
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
              <span>Usados este mes: {MOCK_BALANCE.usedThisMonth.toLocaleString('es-ES')} de {MOCK_BALANCE.grantedThisMonth.toLocaleString('es-ES')}</span>
              <span>{Math.round(usedPct)}%</span>
            </div>
            <Progress value={usedPct} className="h-2" />
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm pt-2">
            <div className="rounded-xl bg-secondary/30 px-4 py-3">
              <p className="text-xs text-muted-foreground mb-0.5">Plan mensual</p>
              <p className="font-medium text-foreground">
                {(MOCK_BALANCE.grantedThisMonth - MOCK_BALANCE.usedThisMonth).toLocaleString('es-ES')} restantes
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Expira el día 1
              </p>
            </div>
            <div className="rounded-xl bg-secondary/30 px-4 py-3">
              <p className="text-xs text-muted-foreground mb-0.5">Pack comprado</p>
              <p className="font-medium text-foreground">
                {MOCK_BALANCE.rolloverCredits.toLocaleString('es-ES')} créditos
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                No expiran
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent usage */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Uso reciente
        </h2>
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-0 divide-y divide-border/40">
            {MOCK_RECENT_USAGE.map((entry, idx) => {
              const Icon = entry.icon;
              return (
                <div key={idx} className="flex items-center justify-between px-5 py-4 hover:bg-secondary/20 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-lg bg-secondary/40 flex items-center justify-center flex-shrink-0">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{entry.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {FEATURE_LABELS[entry.feature]} · {entry.whenLabel}
                      </p>
                    </div>
                  </div>
                  <div className="text-sm font-medium text-foreground tabular-nums whitespace-nowrap pl-3">
                    <TrendingDown className="h-3.5 w-3.5 text-muted-foreground inline mr-1" />
                    {entry.cost} cred
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </section>

      {/* Out-of-credits UX preview (collapsible, soft developer-tool feel) */}
      <section className="space-y-3">
        <button
          type="button"
          onClick={() => setShowOutOfCreditsPreview((p) => !p)}
          className="text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
        >
          <AlertCircle className="h-3.5 w-3.5" />
          Vista previa: así verás cuando te quedes sin créditos
        </button>

        {showOutOfCreditsPreview && (
          <Card className="rounded-2xl shadow-sm border-2 border-dashed border-brand-terracotta/40 bg-brand-terracotta/5">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-full bg-brand-terracotta/15 text-brand-terracotta flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-foreground mb-1">
                    Te has quedado sin créditos AI este mes
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                    Tu plan {MOCK_BALANCE.tierLabel} se reinicia el día 1 — quedan {MOCK_BALANCE.renewsInDays} días.
                    Puedes comprar un pack adicional ahora y seguir usando la IA sin esperar.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="rounded-full h-10">
                          <Plus className="h-4 w-4 mr-1.5" />
                          Comprar pack
                        </Button>
                      </DialogTrigger>
                      <TopUpDialogContent />
                    </Dialog>
                    <Button variant="outline" className="rounded-full h-10" asChild>
                      <a href="/pricing">Subir a plan superior</a>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}

// ─── Top-up dialog (reused from both CTAs) ────────────────────────────────

function TopUpDialogContent(): React.ReactElement {
  return (
    <DialogContent className="sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>Comprar pack de créditos AI</DialogTitle>
        <DialogDescription>
          Los créditos comprados <strong>no expiran</strong> — se quedan en tu cuenta hasta que los uses.
        </DialogDescription>
      </DialogHeader>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 py-4">
        {TOP_UP_PACKS.map((pack) => (
          <Card
            key={pack.price}
            className={`rounded-2xl cursor-pointer transition-all hover:shadow-md ${
              pack.popular ? 'border-brand-terracotta border-2' : ''
            }`}
          >
            <CardContent className="p-5 text-center relative">
              {pack.popular && (
                <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-brand-terracotta text-white rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold">
                  Más popular
                </Badge>
              )}
              <p className="text-2xl font-semibold tabular-nums text-foreground mb-1">€{pack.price}</p>
              <p className="text-sm text-foreground/80 mb-2 tabular-nums">
                {pack.credits.toLocaleString('es-ES')} créditos
              </p>
              {pack.bonus > 0 && (
                <p className="text-xs font-medium text-brand-terracotta">
                  <Zap className="h-3 w-3 inline mr-0.5" />
                  +{pack.bonus}% bonus
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <DialogFooter className="flex-col sm:flex-row gap-2 items-stretch sm:items-center">
        <p className="text-[11px] text-muted-foreground sm:flex-1 sm:text-left">
          Pago seguro vía Stripe. Recibes los créditos al instante.
        </p>
        <Button disabled className="rounded-full h-10" aria-label="Continuar — disponible al lanzar AI Credits AC1">
          Continuar (próximamente)
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
