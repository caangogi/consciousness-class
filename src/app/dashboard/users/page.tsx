'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Search, Shield, Mail, Activity, Sparkles } from 'lucide-react';

/**
 * Admin users management page · preview state.
 *
 * The actual CRUD lands in a dedicated admin sprint. Today we render
 * a polished "coming soon" surface that:
 *   - explains what the feature will do (so the admin understands they
 *     are not missing a feature already available elsewhere)
 *   - mirrors the look-and-feel of the rest of the dashboard so the
 *     UX feels coherent
 *   - reassures with a small disclosure: "esto NO es una página rota,
 *     es un placeholder mientras construimos"
 */

const PREVIEW_FEATURES = [
  {
    icon: Search,
    title: 'Búsqueda y filtros',
    body: 'Filtra usuarios por rol, fecha de registro, plan activo y actividad reciente.',
  },
  {
    icon: Shield,
    title: 'Gestión de roles',
    body: 'Promociona usuarios a creator, suspende cuentas y revisa permisos sin tocar Firestore manualmente.',
  },
  {
    icon: Mail,
    title: 'Comunicación directa',
    body: 'Envía emails individuales o segmentados desde la propia interfaz (vía el sistema transaccional Fase 4.1).',
  },
  {
    icon: Activity,
    title: 'Métricas y exportación',
    body: 'Exporta cohortes a CSV. Mira el funnel signup → primera compra → renovación.',
  },
];

export default function UsersManagementPage(): React.ReactElement {
  return (
    <div className="space-y-8 max-w-4xl mx-auto px-4 sm:px-6 md:px-8 pb-12 pt-4">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Users className="h-5 w-5 text-brand-chambray" aria-hidden="true" />
          <p className="text-xs font-medium tracking-wider uppercase text-muted-foreground">
            Administración
          </p>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Gestión de usuarios</h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl leading-relaxed">
          Panel para administradores. Aquí gestionarás la base de usuarios de la plataforma: roles, suscripciones, actividad y comunicación.
        </p>
      </div>

      {/* Preview status banner */}
      <Card className="rounded-2xl border-brand-terracotta/20 bg-gradient-to-br from-brand-terracotta/[0.04] to-transparent shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-brand-terracotta/15 text-brand-terracotta flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-semibold text-foreground">
                Próximamente · Sprint admin dedicado
              </h2>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                El módulo de usuarios se construye en un sprint propio post-launch.
                Mientras tanto, las gestiones puntuales se hacen vía Firestore o el script{' '}
                <code className="text-[12px] font-mono bg-secondary/60 rounded px-1.5 py-0.5">
                  scripts/set-superadmin.js
                </code>
                .
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview features */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Qué incluirá esta pantalla
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PREVIEW_FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} className="rounded-2xl shadow-sm hover:shadow-md transition-all">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-lg bg-secondary/60 flex items-center justify-center flex-shrink-0">
                      <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-1">{feature.title}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">{feature.body}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
