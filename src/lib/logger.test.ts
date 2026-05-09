/**
 * Tests for the structured logger.
 * Test-after rigorous (per documentation/testing-strategy.md — src/lib/ is
 * not a TDD-strict directory).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('logger', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.resetModules(); // re-import so isProd() picks up vi.stubEnv changes
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  // ============================================================
  // Dev mode (default in tests): pretty format
  // ============================================================
  describe('dev mode (NODE_ENV !== production)', () => {
    it('info() prints "[INFO] message" to stdout', async () => {
      vi.stubEnv('NODE_ENV', 'test');
      const { logger } = await import('./logger');
      logger.info('hello');
      expect(logSpy).toHaveBeenCalledWith('[INFO] hello');
      expect(errorSpy).not.toHaveBeenCalled();
    });

    it('error() prints "[ERROR] message" to stderr', async () => {
      vi.stubEnv('NODE_ENV', 'development');
      const { logger } = await import('./logger');
      logger.error('boom');
      expect(errorSpy).toHaveBeenCalledWith('[ERROR] boom');
      expect(logSpy).not.toHaveBeenCalled();
    });

    it('warn() goes to stderr (matches GCP convention)', async () => {
      vi.stubEnv('NODE_ENV', 'development');
      const { logger } = await import('./logger');
      logger.warn('careful');
      expect(errorSpy).toHaveBeenCalledWith('[WARNING] careful');
    });

    it('passes context as second arg when present', async () => {
      vi.stubEnv('NODE_ENV', 'development');
      const { logger } = await import('./logger');
      logger.info('with ctx', { uid: 'u1', count: 3 });
      expect(logSpy).toHaveBeenCalledWith('[INFO] with ctx', { uid: 'u1', count: 3 });
    });

    it('does not pass empty context as a second arg', async () => {
      vi.stubEnv('NODE_ENV', 'development');
      const { logger } = await import('./logger');
      logger.info('no ctx');
      // Single argument, not (msg, {})
      expect(logSpy.mock.calls[0]).toHaveLength(1);
    });
  });

  // ============================================================
  // Production mode: single-line JSON
  // ============================================================
  describe('production mode', () => {
    it('emits a single JSON line with severity, message, timestamp', async () => {
      vi.stubEnv('NODE_ENV', 'production');
      const { logger } = await import('./logger');
      logger.info('booked', { bookingId: 'b1' });
      expect(logSpy).toHaveBeenCalledTimes(1);
      const json = JSON.parse(logSpy.mock.calls[0][0] as string);
      expect(json.severity).toBe('INFO');
      expect(json.message).toBe('booked');
      expect(typeof json.timestamp).toBe('string');
      expect(() => new Date(json.timestamp).toISOString()).not.toThrow();
      expect(json.bookingId).toBe('b1');
    });

    it('routes ERROR severity to stderr', async () => {
      vi.stubEnv('NODE_ENV', 'production');
      const { logger } = await import('./logger');
      logger.error('webhook failed', { eventId: 'evt_1' });
      expect(errorSpy).toHaveBeenCalledTimes(1);
      expect(logSpy).not.toHaveBeenCalled();
      const json = JSON.parse(errorSpy.mock.calls[0][0] as string);
      expect(json.severity).toBe('ERROR');
    });

    it('serializes Error objects in context (name + message + stack)', async () => {
      vi.stubEnv('NODE_ENV', 'production');
      const { logger } = await import('./logger');
      const err = new Error('boom');
      logger.error('caught', { err });
      const json = JSON.parse(errorSpy.mock.calls[0][0] as string);
      expect(json.err.name).toBe('Error');
      expect(json.err.message).toBe('boom');
      expect(typeof json.err.stack).toBe('string');
    });

    it('skips DEBUG in production by default', async () => {
      vi.stubEnv('NODE_ENV', 'production');
      vi.stubEnv('LOG_DEBUG', '');
      const { logger } = await import('./logger');
      logger.debug('chatty');
      expect(logSpy).not.toHaveBeenCalled();
      expect(errorSpy).not.toHaveBeenCalled();
    });

    it('emits DEBUG in production when LOG_DEBUG=true', async () => {
      vi.stubEnv('NODE_ENV', 'production');
      vi.stubEnv('LOG_DEBUG', 'true');
      const { logger } = await import('./logger');
      logger.debug('chatty');
      expect(logSpy).toHaveBeenCalledTimes(1);
      const json = JSON.parse(logSpy.mock.calls[0][0] as string);
      expect(json.severity).toBe('DEBUG');
    });

    it('drops undefined context values', async () => {
      vi.stubEnv('NODE_ENV', 'production');
      const { logger } = await import('./logger');
      logger.info('with undef', { a: 1, b: undefined, c: 'x' });
      const json = JSON.parse(logSpy.mock.calls[0][0] as string);
      expect(json.a).toBe(1);
      expect(json.c).toBe('x');
      expect('b' in json).toBe(false);
    });
  });
});
