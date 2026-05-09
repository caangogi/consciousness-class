import { NextResponse, type NextRequest } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { requireRoles } from '@/lib/auth/rbac';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/roles/sync
 * Utility to sync roles from Firestore (`usuarios/{uid}.role`) to Firebase Auth Custom Claims (`role`).
 * Only accessible by superadmins.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. RBAC: Only superadmin
    const authResult = await requireRoles(request, ['superadmin']);
    if ('error' in authResult) return authResult.error;

    const { action, uid, newRole } = await request.json().catch(() => ({}));

    // Mode A: Update a single user's claim
    if (action === 'update' && uid && newRole) {
      // 1. Update Custom Claim
      await adminAuth.setCustomUserClaims(uid, { role: newRole });
      
      // 2. Try to update Firestore as well to keep them in sync
      const dbRef = adminDb.collection('usuarios').doc(uid);
      if ((await dbRef.get()).exists) {
        await dbRef.update({ role: newRole });
      } else {
        await dbRef.set({ role: newRole }, { merge: true });
      }

      return NextResponse.json({ success: true, uid, newRole });
    }

    // Mode B: Bulk Sync (Read entire Firestore `usuarios` and overwrite claims)
    if (action === 'bulk-sync') {
      const snap = await adminDb.collection('usuarios').get();
      let count = 0;
      let errors = 0;

      for (const doc of snap.docs) {
        const uid = doc.id;
        const role = doc.data().role;
        if (role) {
          try {
            await adminAuth.setCustomUserClaims(uid, { role });
            count++;
          } catch (e) {
            console.warn(`Failed to set claim for ${uid}:`, e);
            errors++;
          }
        }
      }

      return NextResponse.json({ success: true, message: `Synced ${count} users. Errors: ${errors}` });
    }

    return NextResponse.json({ error: 'Acción inválida. Usa action="update" o "bulk-sync"' }, { status: 400 });
  } catch (error: any) {
    console.error('POST /api/admin/roles/sync error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
