/**
 * Tests for the renderTemplate dispatcher.
 *
 * What we verify (eval-style — see documentation/testing-strategy.md):
 *  - Each slug renders without throwing
 *  - The subject line is composed from the right props
 *  - The rendered HTML contains the data the recipient cares about
 *    (recipient name, dates, key URLs, brand mention)
 *
 * What we DO NOT verify:
 *  - Pixel-level layout (visual review by humans, manual)
 *  - Email-client rendering quirks (Litmus / Email on Acid land — out of MVP)
 *  - Subject character counts (transactional, no character budget pressure)
 */
import { describe, it, expect } from 'vitest';
import { renderTemplate } from './index';

describe('renderTemplate', () => {
  describe('booking_confirmed_patient', () => {
    it('renders with the patient name, creator name, date, time and brand', async () => {
      const out = await renderTemplate('booking_confirmed_patient', {
        patientName: 'Ana López',
        creatorName: 'María Dr.',
        bookingDate: 'Lunes, 12 de mayo de 2026',
        bookingTime: '11:00 (Europe/Madrid)',
        bookingDurationMin: 60,
      });
      expect(out.subject).toContain('María Dr.');
      expect(out.subject).toContain('Lunes, 12 de mayo de 2026');
      expect(out.html).toContain('Ana López');
      expect(out.html).toContain('María Dr.');
      expect(out.html).toContain('Lunes, 12 de mayo de 2026');
      expect(out.html).toContain('11:00 (Europe/Madrid)');
      expect(out.html).toContain('60');
      expect(out.html).toContain('Consciousness Class');
    });

    it('includes the meeting button when meetingLink is provided', async () => {
      const out = await renderTemplate('booking_confirmed_patient', {
        patientName: 'Ana',
        creatorName: 'María',
        bookingDate: 'X', bookingTime: 'Y', bookingDurationMin: 60,
        meetingLink: 'https://meet.example.com/xyz',
      });
      expect(out.html).toContain('https://meet.example.com/xyz');
      expect(out.html.toLowerCase()).toContain('unirme');
    });

    it('omits the meeting section when no meetingLink is provided', async () => {
      const out = await renderTemplate('booking_confirmed_patient', {
        patientName: 'Ana',
        creatorName: 'María',
        bookingDate: 'X', bookingTime: 'Y', bookingDurationMin: 60,
      });
      expect(out.html.toLowerCase()).not.toContain('unirme');
    });

    it('honors a custom brandName', async () => {
      const out = await renderTemplate('booking_confirmed_patient', {
        patientName: 'Ana', creatorName: 'María',
        bookingDate: 'X', bookingTime: 'Y', bookingDurationMin: 60,
        brandName: 'Studio Wellbeing',
      });
      expect(out.html).toContain('Studio Wellbeing');
      expect(out.html).not.toContain('Consciousness Class');
    });
  });

  describe('booking_confirmed_creator', () => {
    it('renders with patient details and dashboard CTA', async () => {
      const out = await renderTemplate('booking_confirmed_creator', {
        creatorName: 'María',
        patientName: 'Ana López',
        patientEmail: 'ana@example.com',
        bookingDate: '12/05/2026', bookingTime: '11:00', bookingDurationMin: 60,
        dashboardUrl: 'https://app.example.com/dashboard/coaching/bookings',
      });
      expect(out.subject).toContain('Ana López');
      expect(out.html).toContain('Ana López');
      expect(out.html).toContain('ana@example.com');
      expect(out.html).toContain('https://app.example.com/dashboard/coaching/bookings');
    });
  });

  describe('enrollment_created', () => {
    it('renders the welcome with start CTA', async () => {
      const out = await renderTemplate('enrollment_created', {
        studentName: 'Pedro',
        assetName: 'Curso de Mindfulness',
        assetType: 'curso',
        creatorName: 'María',
        startUrl: 'https://app.example.com/learn/abc',
      });
      expect(out.subject).toContain('Curso de Mindfulness');
      expect(out.html).toContain('Pedro');
      expect(out.html).toContain('Curso de Mindfulness');
      expect(out.html).toContain('María');
      expect(out.html).toContain('https://app.example.com/learn/abc');
      expect(out.html.toLowerCase()).toContain('empezar');
    });
  });

  describe('booking_cancelled', () => {
    it('shows refund-eligible message when refundEligible=true and refundAmount provided', async () => {
      const out = await renderTemplate('booking_cancelled', {
        recipientName: 'Ana',
        cancelledBy: 'patient',
        bookingDate: '12/05/2026',
        bookingTime: '11:00',
        refundEligible: true,
        refundAmount: '€60.00',
      });
      expect(out.subject).toContain('cancelada');
      expect(out.html).toContain('€60.00');
      expect(out.html.toLowerCase()).toContain('reembolso');
    });

    it('shows refund-NOT-eligible message when refundEligible=false', async () => {
      const out = await renderTemplate('booking_cancelled', {
        recipientName: 'Ana',
        cancelledBy: 'patient',
        bookingDate: 'X', bookingTime: 'Y',
        refundEligible: false,
      });
      expect(out.html.toLowerCase()).toContain('no es elegible');
      expect(out.html).toContain('24');
    });

    it('phrases the cancellation differently per cancelledBy actor', async () => {
      const byPatient = await renderTemplate('booking_cancelled', {
        recipientName: 'Ana', cancelledBy: 'patient',
        bookingDate: 'X', bookingTime: 'Y', refundEligible: null,
      });
      const byCreator = await renderTemplate('booking_cancelled', {
        recipientName: 'Ana', cancelledBy: 'creator',
        bookingDate: 'X', bookingTime: 'Y', refundEligible: null,
      });
      const bySystem = await renderTemplate('booking_cancelled', {
        recipientName: 'Ana', cancelledBy: 'system',
        bookingDate: 'X', bookingTime: 'Y', refundEligible: null,
      });
      expect(byPatient.html).toContain('Has cancelado');
      expect(byCreator.html).toContain('El creador ha cancelado');
      expect(bySystem.html).toContain('automáticamente');
    });

    it('falls back to "no hay cargo" message when refundEligible is null (e.g. cancel from pending_payment)', async () => {
      const out = await renderTemplate('booking_cancelled', {
        recipientName: 'Ana',
        cancelledBy: 'system',
        bookingDate: 'X', bookingTime: 'Y',
        refundEligible: null,
      });
      expect(out.html.toLowerCase()).toContain('no hay cargo');
    });
  });
});
