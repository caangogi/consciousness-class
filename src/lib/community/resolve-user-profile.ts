import { adminAuth, adminDb } from '@/lib/firebase/admin';

/**
 * Resolves a user's display name and avatar from Firestore first,
 * falling back to Firebase Auth record (which always has Google profile data).
 */
export async function resolveUserProfile(uid: string): Promise<{
  displayName: string;
  photoURL: string | null;
}> {
  // 1. Try Firestore first (the source of truth for the platform profile)
  const userDoc = await adminDb.collection('usuarios').doc(uid).get();
  const firestoreData = userDoc.data();

  const firestoreName = firestoreData?.displayName?.trim() || '';
  const firestorePhoto = firestoreData?.photoURL || null;

  // If Firestore has both, use them
  if (firestoreName && firestorePhoto) {
    return { displayName: firestoreName, photoURL: firestorePhoto };
  }

  // 2. Fall back to Firebase Auth record (always up to date for social sign-ins)
  try {
    const authUser = await adminAuth.getUser(uid);
    return {
      displayName: firestoreName || authUser.displayName || authUser.email || 'Usuario',
      photoURL: firestorePhoto || authUser.photoURL || null,
    };
  } catch {
    return {
      displayName: firestoreName || 'Usuario',
      photoURL: firestorePhoto,
    };
  }
}
