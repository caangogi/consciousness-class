/**
 * /safety/help — dedicated route showing crisis resources.
 *
 * Reachable from:
 *   - Inline crisis banners triggered by Journaling / RAG Companion
 *     (Fase 6.1 / 6.2) via a "Ver más recursos" link.
 *   - A permanent link in the footer (so anyone can always reach it).
 *
 * This page is intentionally simple, calm, and content-first. It has
 * no chrome, no analytics events for sensitive interactions (we will
 * track "page viewed" but never which resource the user clicked —
 * that information could be misused).
 */
import * as React from 'react';
import type { Metadata } from 'next';
import { CrisisHelpResource } from '@/components/safety/CrisisHelpResource';

export const metadata: Metadata = {
  title: 'Recursos de ayuda · Consciousness Class',
  description:
    'Recursos gratuitos y confidenciales de atención emocional y prevención del suicidio. ' +
    'Disponibles 24/7.',
  // Keep this page out of public ad targeting / preview crawlers
  robots: { index: false, follow: false },
};

export default function HelpPage(): React.ReactElement {
  return (
    <main className="min-h-screen bg-background py-12 md:py-16">
      <CrisisHelpResource variant="page" />
    </main>
  );
}
