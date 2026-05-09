/**
 * Structured logger compatible with Google Cloud Logging.
 *
 * In production (NODE_ENV === 'production') emits one JSON line per entry
 * with the field mapping that Cloud Logging auto-parses:
 *   - severity   → log level (DEBUG | INFO | WARNING | ERROR)
 *   - message    → human-readable string
 *   - timestamp  → ISO 8601 UTC
 *   - labels     → flat string KV (indexed by Cloud Logging)
 *   - logging.googleapis.com/sourceLocation → file/line/function (when available)
 *   - any other context fields are preserved at the top level
 *
 * In dev/test it pretty-prints to the console for legibility.
 *
 * Why a wrapper instead of pino/winston: zero deps, zero startup cost, and
 * all our callsites are short-lived API routes where a 1-line JSON via
 * console.log/error is exactly what Cloud Run / Vercel ingest natively.
 *
 * Usage:
 *   import { logger } from '@/lib/logger';
 *   logger.info('Booking confirmed', { bookingId, patientUid });
 *   logger.error('Stripe webhook failed', { eventId, err });
 */

export type LogContext = Record<string, unknown>;

type Severity = 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR';

const isProd = (): boolean => process.env.NODE_ENV === 'production';

/** Serialize an Error so the JSON output keeps name/message/stack/cause. */
function serializeError(err: unknown): unknown {
  if (err instanceof Error) {
    return {
      name: err.name,
      message: err.message,
      stack: err.stack,
      ...(err.cause !== undefined ? { cause: serializeError(err.cause) } : {}),
    };
  }
  return err;
}

/** Walk a context object and replace any Error values with serialized form. */
function sanitizeContext(context: LogContext | undefined): LogContext | undefined {
  if (!context) return undefined;
  const out: LogContext = {};
  for (const [k, v] of Object.entries(context)) {
    if (v === undefined) continue;
    out[k] = v instanceof Error ? serializeError(v) : v;
  }
  return out;
}

interface LogEntry {
  severity: Severity;
  message: string;
  timestamp: string;
  context?: LogContext;
}

function emit(entry: LogEntry): void {
  const ctx = sanitizeContext(entry.context);
  if (isProd()) {
    // Cloud Logging compatible single-line JSON.
    // Top-level severity + message + timestamp; context fields are spread.
    const payload: Record<string, unknown> = {
      severity: entry.severity,
      message: entry.message,
      timestamp: entry.timestamp,
      ...(ctx ?? {}),
    };
    // ERROR/WARNING go to stderr, INFO/DEBUG to stdout — matches GCP convention.
    const channel = entry.severity === 'ERROR' || entry.severity === 'WARNING'
      ? console.error
      : console.log;
    channel(JSON.stringify(payload));
  } else {
    // Dev pretty: [LEVEL] message {context}
    const tag = `[${entry.severity}]`;
    const channel = entry.severity === 'ERROR' || entry.severity === 'WARNING'
      ? console.error
      : console.log;
    if (ctx && Object.keys(ctx).length > 0) {
      channel(`${tag} ${entry.message}`, ctx);
    } else {
      channel(`${tag} ${entry.message}`);
    }
  }
}

export const logger = {
  debug(message: string, context?: LogContext): void {
    // Skip DEBUG in production to keep volume down; opt-in via env.
    if (isProd() && process.env.LOG_DEBUG !== 'true') return;
    emit({ severity: 'DEBUG', message, timestamp: new Date().toISOString(), context });
  },

  info(message: string, context?: LogContext): void {
    emit({ severity: 'INFO', message, timestamp: new Date().toISOString(), context });
  },

  warn(message: string, context?: LogContext): void {
    emit({ severity: 'WARNING', message, timestamp: new Date().toISOString(), context });
  },

  error(message: string, context?: LogContext): void {
    emit({ severity: 'ERROR', message, timestamp: new Date().toISOString(), context });
  },
};
