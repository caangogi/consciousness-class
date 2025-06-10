
import admin from 'firebase-admin';

let adminAuth: admin.auth.Auth | null = null;
let adminDb: admin.firestore.Firestore | null = null;
let adminStorage: admin.storage.Storage | null = null;

if (!admin.apps.length) {
  try {
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
      console.error('CRITICAL: Firebase Admin SDK initialization failed: One or more required environment variables (FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY) are not defined. Please check your .env.local file.');
    } else {
      // Replace \\n with \n in the private key because .env files might escape them.
      const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');

      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: projectId,
          clientEmail: clientEmail,
          privateKey: formattedPrivateKey,
        }),
      });
      console.log('Firebase Admin SDK initialized successfully using separate environment variables.');
      adminAuth = admin.auth();
      adminDb = admin.firestore();
      adminStorage = admin.storage();
    }
  } catch (error: any) {
    console.error('CRITICAL: Firebase Admin SDK initialization failed unexpectedly during admin.initializeApp() with separate variables:', error.message, error.stack);
  }
} else {
  console.log('Firebase Admin SDK: App already initialized. Reusing existing instance.');
  adminAuth = admin.auth();
  adminDb = admin.firestore();
  adminStorage = admin.storage();
}

export { adminAuth, adminDb, adminStorage };
