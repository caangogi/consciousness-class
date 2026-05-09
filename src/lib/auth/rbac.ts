import { NextResponse, type NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';

export type Role = 'student' | 'creator' | 'admin' | 'superadmin';

/**
 * Validates the Authorization header and ensures the user has one of the allowed roles.
 * Usage in API routes:
 * 
 * const authResult = await requireRoles(request, ['superadmin']);
 * if ('error' in authResult) return authResult.error; // Returns 401 or 403 response
 * const { uid, decodedToken } = authResult;
 */
export async function requireRoles(request: NextRequest, allowedRoles: Role[]) {
  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) {
    return { error: NextResponse.json({ error: 'Falta token de autorización' }, { status: 401 }) };
  }

  const idToken = authorization.split('Bearer ')[1];
  
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    
    // Check Custom Claims
    const userRole = (decodedToken.role as Role) || 'student';

    // In development or early stages, if an email is marked as superadmin, we force allow
    const isDevSuperAdmin = 
      decodedToken.email === process.env.NEXT_PUBLIC_SUPERADMIN_DEV_EMAIL || 
      decodedToken.email === 'caangogi@gmail.com';

    if (isDevSuperAdmin || allowedRoles.includes(userRole)) {
      return { uid: decodedToken.uid, decodedToken, role: userRole };
    }

    return { 
      error: NextResponse.json(
        { error: 'Prohibido: No tienes los permisos necesarios (Role: ' + userRole + ')' }, 
        { status: 403 }
      ) 
    };
  } catch (error: any) {
    console.error('[RBAC] Error validando token:', error);
    return { error: NextResponse.json({ error: 'Token inválido o expirado' }, { status: 401 }) };
  }
}
