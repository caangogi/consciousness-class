
import admin from 'firebase-admin';

// Declarar las variables para que puedan ser asignadas después de la inicialización
let adminAuth: admin.auth.Auth | null = null;
let adminDb: admin.firestore.Firestore | null = null;
let adminStorage: admin.storage.Storage | null = null;

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
    // Asignar a las variables exportadas después de la inicialización exitosa
    adminAuth = admin.auth();
    adminDb = admin.firestore();
    adminStorage = admin.storage();

  } catch (error: any) {
    console.error('CRITICAL: Firebase Admin SDK initialization failed:', error.message);
    // adminAuth, adminDb, adminStorage permanecerán null si la inicialización falla
  }
} else {
  // Si la app ya está inicializada (puede ocurrir en entornos serverless o con hot-reloading)
  console.log('Firebase Admin SDK: App already initialized. Reusing existing instance.');
  adminAuth = admin.auth();
  adminDb = admin.firestore();
  adminStorage = admin.storage();
}

export { adminAuth, adminDb, adminStorage };
