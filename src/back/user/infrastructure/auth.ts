import { NextRequest } from 'next/server';
import admin from '@back/share/firebase/FirebaseClient';
import { Role } from '../domain/Role';

export interface CurrentUser {
  uid: string;
  email: string;
  role: Role;
}

/**
 * Verifica ID Token de Firebase y obtiene el rol almacenado en Firestore
 */
export async function authenticate(request: NextRequest): Promise<CurrentUser> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Missing or invalid Authorization header');
  }
  const idToken = authHeader.split(' ')[1];
  let decoded;
  try {
    decoded = await admin.auth().verifyIdToken(idToken);
  } catch (err) {
    throw new Error('Invalid or expired token');
  }
  const uid = decoded.uid;
  // Obtener rol desde Firestore
  const doc = await admin.firestore().collection('users').doc(uid).get();
  if (!doc.exists) {
    throw new Error('User profile not found');
  }
  const data = doc.data()!;
  return { uid, email: data.email, role: data.role as Role };
}