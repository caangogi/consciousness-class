/**
 * Tests for EmailLogEntity.
 * Test-after rigorous (per documentation/testing-strategy.md — entity is
 * not on the TDD-strict critical money/auth list).
 */
import { describe, it, expect } from 'vitest';
import { EmailLogEntity } from './email-log.entity';

describe('EmailLogEntity', () => {
  describe('create()', () => {
    it('initializes a pending log with sane defaults', () => {
      const log = EmailLogEntity.create({
        recipientEmail: 'p@example.com',
        template: 'booking_confirmed_patient',
        eventId: 'evt_1',
      });
      expect(log.id).toBeTypeOf('string');
      expect(log.id.length).toBeGreaterThan(0);
      expect(log.recipientEmail).toBe('p@example.com');
      expect(log.template).toBe('booking_confirmed_patient');
      expect(log.eventId).toBe('evt_1');
      expect(log.status).toBe('pending');
      expect(log.provider).toBe('resend');
      expect(log.providerMessageId).toBeNull();
      expect(log.error).toBeNull();
      expect(log.attempts).toBe(0);
      expect(log.sentAt).toBeNull();
      expect(log.createdAt).toBeInstanceOf(Date);
    });

    it('allows passing a different provider', () => {
      const log = EmailLogEntity.create({
        recipientEmail: 'p@example.com',
        template: 'whatever',
        provider: 'creator_smtp',
      });
      expect(log.provider).toBe('creator_smtp');
    });

    it('throws on empty recipientEmail', () => {
      expect(() =>
        EmailLogEntity.create({ recipientEmail: '', template: 't' })
      ).toThrow(/recipientEmail.*required/i);
      expect(() =>
        EmailLogEntity.create({ recipientEmail: '   ', template: 't' })
      ).toThrow(/recipientEmail.*required/i);
    });

    it('throws on empty template', () => {
      expect(() =>
        EmailLogEntity.create({ recipientEmail: 'p@example.com', template: '' })
      ).toThrow(/template.*required/i);
    });
  });

  describe('markSent()', () => {
    it('moves pending → sent and stores providerMessageId + sentAt', () => {
      const log = EmailLogEntity.create({ recipientEmail: 'p@x.com', template: 't' });
      log.markSent('resend_msg_123');
      expect(log.status).toBe('sent');
      expect(log.providerMessageId).toBe('resend_msg_123');
      expect(log.error).toBeNull();
      expect(log.sentAt).toBeInstanceOf(Date);
      expect(log.attempts).toBe(1);
    });

    it('moves failed → sent on a successful retry (resilience)', () => {
      const log = EmailLogEntity.create({ recipientEmail: 'p@x.com', template: 't' });
      log.markFailed('temporary 5xx');
      expect(log.attempts).toBe(1);
      log.markSent('resend_msg_456');
      expect(log.status).toBe('sent');
      expect(log.attempts).toBe(2);
      expect(log.error).toBeNull();
    });

    it('throws when already sent (no double-send accounting)', () => {
      const log = EmailLogEntity.create({ recipientEmail: 'p@x.com', template: 't' });
      log.markSent('msg_1');
      expect(() => log.markSent('msg_2')).toThrow(/cannot markSent.*sent/i);
    });

    it('throws when bounced (terminal)', () => {
      const log = EmailLogEntity.create({ recipientEmail: 'p@x.com', template: 't' });
      log.markBounced('mailbox does not exist');
      expect(() => log.markSent('msg_1')).toThrow(/cannot markSent.*bounced/i);
    });
  });

  describe('markFailed()', () => {
    it('records the error and increments attempts', () => {
      const log = EmailLogEntity.create({ recipientEmail: 'p@x.com', template: 't' });
      log.markFailed('Connection refused');
      expect(log.status).toBe('failed');
      expect(log.error).toBe('Connection refused');
      expect(log.attempts).toBe(1);
    });

    it('can be called repeatedly to model retry attempts', () => {
      const log = EmailLogEntity.create({ recipientEmail: 'p@x.com', template: 't' });
      log.markFailed('try 1');
      log.markFailed('try 2');
      log.markFailed('try 3');
      expect(log.attempts).toBe(3);
      expect(log.error).toBe('try 3');
    });
  });

  describe('markBounced()', () => {
    it('moves to terminal bounced state with the error', () => {
      const log = EmailLogEntity.create({ recipientEmail: 'p@x.com', template: 't' });
      log.markBounced('mailbox unavailable');
      expect(log.status).toBe('bounced');
      expect(log.error).toBe('mailbox unavailable');
    });

    it('throws when called twice (already terminal)', () => {
      const log = EmailLogEntity.create({ recipientEmail: 'p@x.com', template: 't' });
      log.markBounced('first');
      expect(() => log.markBounced('second')).toThrow(/already bounced/i);
    });
  });

  describe('toPlainObject()', () => {
    it('serializes timestamps as ISO strings (Firestore-friendly)', () => {
      const log = EmailLogEntity.create({ recipientEmail: 'p@x.com', template: 't' });
      log.markSent('msg_1');
      const obj = log.toPlainObject();
      expect(typeof obj.createdAt).toBe('string');
      expect(typeof obj.updatedAt).toBe('string');
      expect(typeof obj.sentAt).toBe('string');
      // valid ISO 8601
      expect(new Date(obj.sentAt!).toISOString()).toBe(obj.sentAt);
    });

    it('serializes sentAt as null when never sent', () => {
      const log = EmailLogEntity.create({ recipientEmail: 'p@x.com', template: 't' });
      const obj = log.toPlainObject();
      expect(obj.sentAt).toBeNull();
    });
  });
});
