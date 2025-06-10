
import admin from 'firebase-admin';

// Declarar las variables para que puedan ser asignadas después de la inicialización
let adminAuth: admin.auth.Auth | null = null;
let adminDb: admin.firestore.Firestore | null = null;
let adminStorage: admin.storage.Storage | null = null;

if (!admin.apps.length) {
  try {
    const serviceAccountString = process.env.FIREBASE_ADMIN_CREDENTIALS_JSON;
    if (!serviceAccountString) {
      console.error('CRITICAL: Firebase Admin SDK initialization failed: The FIREBASE_ADMIN_CREDENTIALS_JSON environment variable is not defined or is empty. Please check your .env.local file.');
      // adminAuth, adminDb, adminStorage permanecerán null
    } else {
      let serviceAccount;
      try {
        serviceAccount = JSON.parse(serviceAccountString);
      } catch (parseError: any) {
        console.error('CRITICAL: Firebase Admin SDK initialization failed: Could not parse FIREBASE_ADMIN_CREDENTIALS_JSON. Ensure it is a valid JSON string (e.g., properly escaped, no trailing commas, etc.). Error:', parseError.message);
        console.error('Attempted to parse string:', serviceAccountString.substring(0, 100) + '...'); // Log a snippet for diagnosis
        // adminAuth, adminDb, adminStorage permanecerán null
      }

      if (serviceAccount) { // Solo inicializar si serviceAccount se parseó correctamente
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        console.log('Firebase Admin SDK initialized successfully using JSON string from FIREBASE_ADMIN_CREDENTIALS_JSON.');
        // Asignar a las variables exportadas después de la inicialización exitosa
        adminAuth = admin.auth();
        adminDb = admin.firestore();
        adminStorage = admin.storage();
      } else {
        console.error('CRITICAL: Firebase Admin SDK initialization skipped because serviceAccount object could not be parsed from FIREBASE_ADMIN_CREDENTIALS_JSON.');
      }
    }
  } catch (error: any) { // Catch para admin.initializeApp o errores inesperados durante la inicialización
    console.error('CRITICAL: Firebase Admin SDK initialization failed unexpectedly during admin.initializeApp():', error.message, error.stack);
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
