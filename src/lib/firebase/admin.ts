
import admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    const serviceAccountString = process.env.FIREBASE_ADMIN_CREDENTIALS_JSON;
    if (!serviceAccountString) {
      throw new Error('La variable de entorno FIREBASE_ADMIN_CREDENTIALS_JSON no está definida.');
    }

    const serviceAccount = JSON.parse(serviceAccountString);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('Firebase Admin SDK initialized successfully using JSON string.');
  } catch (error: any) {
    console.error('Firebase Admin SDK initialization error:', error.message);
    // Considera un manejo de error más robusto en producción
    // Por ejemplo, podrías lanzar el error para que el build falle si las credenciales no son válidas.
  }
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
export const adminStorage = admin.storage();
