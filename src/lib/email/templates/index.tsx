/**
 * Template dispatcher.
 *
 * Single entry point used by the (eventual) Resend wrapper in T4.1.2.
 * Call sites pass a slug + typed props; we render to HTML and return
 * subject + html ready to hand to the provider.
 *
 * Why a dispatcher and not direct imports of components from call sites:
 * - Decouples sending code from React Email internals (swap engine later
 *   without touching the ~10 handlers).
 * - Lets us centralize subject lines (which often need the same data the
 *   body uses, so co-locating them is cleaner).
 * - Makes `domainEvents` handlers small: `await sendEmail({ to, slug, props })`
 *   rather than rendering by hand.
 */
import * as React from 'react';
import { render } from '@react-email/render';
import { BookingConfirmedPatient } from './BookingConfirmedPatient';
import { BookingConfirmedCreator } from './BookingConfirmedCreator';
import { EnrollmentCreated } from './EnrollmentCreated';
import { BookingCancelled } from './BookingCancelled';
import type {
  BookingConfirmedPatientProps,
  BookingConfirmedCreatorProps,
  EnrollmentCreatedProps,
  BookingCancelledProps,
  TemplateSlug,
  TemplatePropsByslug,
} from './types';

export type { TemplateSlug } from './types';

export interface RenderedEmail {
  subject: string;
  html: string;
}

// Typed overloads — call sites get IntelliSense + compile-time check that
// props match the chosen slug.
export async function renderTemplate(
  slug: 'booking_confirmed_patient',
  props: BookingConfirmedPatientProps,
): Promise<RenderedEmail>;
export async function renderTemplate(
  slug: 'booking_confirmed_creator',
  props: BookingConfirmedCreatorProps,
): Promise<RenderedEmail>;
export async function renderTemplate(
  slug: 'enrollment_created',
  props: EnrollmentCreatedProps,
): Promise<RenderedEmail>;
export async function renderTemplate(
  slug: 'booking_cancelled',
  props: BookingCancelledProps,
): Promise<RenderedEmail>;
export async function renderTemplate<S extends TemplateSlug>(
  slug: S,
  props: TemplatePropsByslug[S],
): Promise<RenderedEmail> {
  switch (slug) {
    case 'booking_confirmed_patient': {
      const p = props as BookingConfirmedPatientProps;
      return {
        subject: `Tu sesión con ${p.creatorName} está confirmada · ${p.bookingDate}`,
        html: await render(<BookingConfirmedPatient {...p} />),
      };
    }
    case 'booking_confirmed_creator': {
      const p = props as BookingConfirmedCreatorProps;
      return {
        subject: `Nueva reserva: ${p.patientName} · ${p.bookingDate}`,
        html: await render(<BookingConfirmedCreator {...p} />),
      };
    }
    case 'enrollment_created': {
      const p = props as EnrollmentCreatedProps;
      return {
        subject: `Bienvenido a ${p.assetName}`,
        html: await render(<EnrollmentCreated {...p} />),
      };
    }
    case 'booking_cancelled': {
      const p = props as BookingCancelledProps;
      return {
        subject: `Sesión cancelada · ${p.bookingDate}`,
        html: await render(<BookingCancelled {...p} />),
      };
    }
    default: {
      const exhaustive: never = slug;
      throw new Error(`renderTemplate: unknown slug ${exhaustive as string}`);
    }
  }
}
