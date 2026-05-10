/**
 * Type contracts for the four MVP transactional email templates.
 * Imported by both the React components and the renderTemplate dispatcher.
 *
 * Conventions:
 * - All dates/times come pre-formatted as strings (the handler that
 *   triggers the email is responsible for tz-aware formatting per the
 *   recipient's locale; templates never call Date methods).
 * - Optional URLs default to omitting the CTA section (no broken links).
 * - brandName is overridable but defaults to "Consciousness Class".
 */

export type TemplateSlug =
  | 'booking_confirmed_patient'
  | 'booking_confirmed_creator'
  | 'enrollment_created'
  | 'booking_cancelled';

export interface BookingConfirmedPatientProps {
  patientName: string;
  creatorName: string;
  bookingDate: string;       // pre-formatted, e.g. "Lunes, 12 de mayo de 2026"
  bookingTime: string;       // pre-formatted, e.g. "11:00 (Europe/Madrid)"
  bookingDurationMin: number;
  meetingLink?: string;
  cancelUrl?: string;
  brandName?: string;
}

export interface BookingConfirmedCreatorProps {
  creatorName: string;
  patientName: string;
  patientEmail: string;
  bookingDate: string;
  bookingTime: string;
  bookingDurationMin: number;
  dashboardUrl: string;
  brandName?: string;
}

export interface EnrollmentCreatedProps {
  studentName: string;
  assetName: string;
  assetType: string;         // 'curso' | 'membresía' | 'descarga' | etc. (already humanized)
  creatorName: string;
  startUrl: string;
  brandName?: string;
}

export interface BookingCancelledProps {
  recipientName: string;
  cancelledBy: 'patient' | 'creator' | 'system';
  bookingDate: string;
  bookingTime: string;
  refundEligible: boolean | null;
  refundAmount?: string;     // pre-formatted, e.g. "€60.00"
  brandName?: string;
}

export type TemplatePropsByslug = {
  booking_confirmed_patient: BookingConfirmedPatientProps;
  booking_confirmed_creator: BookingConfirmedCreatorProps;
  enrollment_created: EnrollmentCreatedProps;
  booking_cancelled: BookingCancelledProps;
};
