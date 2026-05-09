/**
 * Tests de regresión + cobertura para requireRoles.
 *
 * Estos tests verifican el comportamiento ya implementado en rbac.ts.
 * Si alguno FALLA, hemos encontrado un bug real en la implementación
 * y aplicamos el ciclo TDD: commit del test rojo → fix → commit verde.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { NextRequest } from 'next/server';

// Mock del SDK admin antes de importar rbac.
vi.mock('@/lib/firebase/admin', () => ({
  adminAuth: {
    verifyIdToken: vi.fn(),
  },
}));

import { requireRoles } from './rbac';
import { adminAuth } from '@/lib/firebase/admin';

const verifyIdToken = vi.mocked(adminAuth.verifyIdToken);

/** Construye un NextRequest mínimo con un header Authorization opcional. */
function makeRequest(authHeader?: string): NextRequest {
  return {
    headers: {
      get: (name: string) =>
        name.toLowerCase() === 'authorization' ? (authHeader ?? null) : null,
    },
  } as unknown as NextRequest;
}

/** Helper para inspeccionar el body JSON de la NextResponse de error. */
async function readErrorBody(result: any): Promise<{ status: number; body: any }> {
  expect(result).toHaveProperty('error');
  const response: Response = result.error;
  return { status: response.status, body: await response.json() };
}

describe('requireRoles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Asegurar entorno limpio para variables que afectan dev-superadmin.
    delete process.env.NEXT_PUBLIC_SUPERADMIN_DEV_EMAIL;
    // Silenciar console.error del catch para no ensuciar output de tests.
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------
  // 1. Sin header Authorization
  // -------------------------------------------------------------
  it('returns 401 when Authorization header is missing', async () => {
    const result = await requireRoles(makeRequest(), ['student']);
    const { status, body } = await readErrorBody(result);
    expect(status).toBe(401);
    expect(body.error).toMatch(/Falta token/i);
    expect(verifyIdToken).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------
  // 2. Header sin "Bearer "
  // -------------------------------------------------------------
  it('returns 401 when Authorization header does not start with "Bearer "', async () => {
    const result = await requireRoles(makeRequest('Basic abc123'), ['student']);
    const { status } = await readErrorBody(result);
    expect(status).toBe(401);
    expect(verifyIdToken).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------
  // 3. verifyIdToken lanza → 401
  // -------------------------------------------------------------
  it('returns 401 when verifyIdToken throws (invalid/expired token)', async () => {
    verifyIdToken.mockRejectedValueOnce(new Error('Token expired'));
    const result = await requireRoles(makeRequest('Bearer some.invalid.token'), ['student']);
    const { status, body } = await readErrorBody(result);
    expect(status).toBe(401);
    expect(body.error).toMatch(/Token inválido|expirado/i);
  });

  // -------------------------------------------------------------
  // 4. Token válido + rol permitido → devuelve uid/role/decodedToken
  // -------------------------------------------------------------
  it('returns uid+role+decodedToken when token valid AND role allowed', async () => {
    verifyIdToken.mockResolvedValueOnce({
      uid: 'user_42',
      role: 'creator',
      email: 'creator@example.com',
    } as any);
    const result = await requireRoles(makeRequest('Bearer good.token'), ['creator', 'admin']);
    expect(result).toEqual(
      expect.objectContaining({
        uid: 'user_42',
        role: 'creator',
      })
    );
    expect(result).not.toHaveProperty('error');
  });

  // -------------------------------------------------------------
  // 5. Token válido + rol NO permitido → 403 con mensaje
  // -------------------------------------------------------------
  it('returns 403 when token valid but role NOT in allowedRoles', async () => {
    verifyIdToken.mockResolvedValueOnce({
      uid: 'user_42',
      role: 'student',
      email: 'student@example.com',
    } as any);
    const result = await requireRoles(makeRequest('Bearer good.token'), ['creator']);
    const { status, body } = await readErrorBody(result);
    expect(status).toBe(403);
    expect(body.error).toMatch(/Prohibido/i);
    expect(body.error).toMatch(/student/);
  });

  // -------------------------------------------------------------
  // 6. Sin custom claim "role" → default 'student'
  // -------------------------------------------------------------
  it("defaults to role 'student' when custom claim is absent", async () => {
    verifyIdToken.mockResolvedValueOnce({
      uid: 'user_42',
      email: 'someone@example.com',
      // no `role` claim
    } as any);
    const result = await requireRoles(makeRequest('Bearer good.token'), ['student']);
    expect(result).toEqual(
      expect.objectContaining({ uid: 'user_42', role: 'student' })
    );
  });

  // -------------------------------------------------------------
  // 7. Dev-superadmin override por NEXT_PUBLIC_SUPERADMIN_DEV_EMAIL
  // -------------------------------------------------------------
  it('bypasses role check when email matches NEXT_PUBLIC_SUPERADMIN_DEV_EMAIL', async () => {
    process.env.NEXT_PUBLIC_SUPERADMIN_DEV_EMAIL = 'devboss@example.com';
    verifyIdToken.mockResolvedValueOnce({
      uid: 'dev_user',
      role: 'student', // explícitamente NO superadmin
      email: 'devboss@example.com',
    } as any);
    const result = await requireRoles(makeRequest('Bearer good.token'), ['superadmin']);
    expect(result).toEqual(
      expect.objectContaining({ uid: 'dev_user', role: 'student' })
    );
    expect(result).not.toHaveProperty('error');
  });

  // -------------------------------------------------------------
  // 8. SECURITY: caangogi@gmail.com must NOT be a hardcoded backdoor.
  //    Without NEXT_PUBLIC_SUPERADMIN_DEV_EMAIL set, the same email lands
  //    a 403 just like any other student. Test #7 already covers the
  //    legitimate env-var-driven dev-superadmin bypass.
  // -------------------------------------------------------------
  it('does NOT bypass role check for caangogi@gmail.com when env var is unset', async () => {
    // beforeEach already deletes NEXT_PUBLIC_SUPERADMIN_DEV_EMAIL.
    verifyIdToken.mockResolvedValueOnce({
      uid: 'caa_uid',
      role: 'student',
      email: 'caangogi@gmail.com',
    } as any);
    const result = await requireRoles(makeRequest('Bearer good.token'), ['superadmin']);
    const { status, body } = await readErrorBody(result);
    expect(status).toBe(403);
    expect(body.error).toMatch(/Prohibido/i);
  });

  // -------------------------------------------------------------
  // 9. EDGE: header "Bearer " sin token después
  //    Comportamiento esperado: 401 (token vacío no es válido).
  //    El código actual pasa "" a verifyIdToken — ¿qué hace?
  // -------------------------------------------------------------
  it('returns 401 when header is "Bearer " with no token', async () => {
    verifyIdToken.mockRejectedValueOnce(new Error('decoding Firebase ID token failed'));
    const result = await requireRoles(makeRequest('Bearer '), ['student']);
    const { status } = await readErrorBody(result);
    expect(status).toBe(401);
  });

  // -------------------------------------------------------------
  // 10. EDGE: header "Bearer  token" con DOBLE espacio.
  //     split('Bearer ')[1] devuelve " token" (con espacio inicial).
  //     Esto es BUG potencial: el token llega con whitespace al verifier.
  //     Esperado: que igualmente falle limpio (401).
  // -------------------------------------------------------------
  it('handles "Bearer  token" with double space gracefully (no crash)', async () => {
    verifyIdToken.mockRejectedValueOnce(new Error('decoding Firebase ID token failed'));
    const result = await requireRoles(makeRequest('Bearer  good.token'), ['student']);
    const { status } = await readErrorBody(result);
    expect(status).toBe(401);
    // Documentar el comportamiento actual: el token se pasa con whitespace
    expect(verifyIdToken).toHaveBeenCalledWith(' good.token');
  });
});
