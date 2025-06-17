
import admin from 'firebase-admin';

let adminAuth: admin.auth.Auth | null = null;
let adminDb: admin.firestore.Firestore | null = null;
let adminStorage: admin.storage.Storage | null = null;

if (!admin.apps.length) {
  try {
    const projectIdFromEnv = process.env.FIREBASE_ADMIN_PROJECT_ID;
    const clientEmailFromEnv = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const privateKeyFromEnv = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

    console.log('[Firebase Admin] Attempting to initialize Admin SDK...');
    console.log('[Firebase Admin] Raw FIREBASE_ADMIN_PROJECT_ID from env:', projectIdFromEnv);
    console.log('[Firebase Admin] Raw FIREBASE_ADMIN_CLIENT_EMAIL from env:', clientEmailFromEnv ? 'SET' : 'NOT SET');
    console.log('[Firebase Admin] Raw FIREBASE_ADMIN_PRIVATE_KEY from env:', privateKeyFromEnv ? 'SET (content details below)' : 'NOT SET');

    if (privateKeyFromEnv) {
      console.log(`[Firebase Admin] Length of FIREBASE_ADMIN_PRIVATE_KEY: ${privateKeyFromEnv.length}`);
      console.log(`[Firebase Admin] FIREBASE_ADMIN_PRIVATE_KEY starts with: "${privateKeyFromEnv.substring(0, 30)}..."`);
      console.log(`[Firebase Admin] FIREBASE_ADMIN_PRIVATE_KEY ends with: "...${privateKeyFromEnv.substring(privateKeyFromEnv.length - 30)}"`);
      console.log(`[Firebase Admin] FIREBASE_ADMIN_PRIVATE_KEY contains '\\n' (literal string slash-n): ${privateKeyFromEnv.includes('\\n')}`);
      console.log(`[Firebase Admin] FIREBASE_ADMIN_PRIVATE_KEY contains actual newline characters (char code 10): ${privateKeyFromEnv.includes('\n')}`);
    }


    if (!projectIdFromEnv || !clientEmailFromEnv || !privateKeyFromEnv) {
      console.error(
        'CRITICAL: Firebase Admin SDK initialization failed: One or more required environment variables (FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY) are not defined. Please check your .env.local file or Vercel environment variables.'
      );
      console.error('[Firebase Admin] Values checked: projectId=' + projectIdFromEnv + ', clientEmail=' + (clientEmailFromEnv ? 'Exists' : 'Missing') + ', privateKey=' + (privateKeyFromEnv ? 'Exists' : 'Missing'));
    } else {
      // Replace \\n with \n in the private key because .env files might escape them.
      const formattedPrivateKey = privateKeyFromEnv.replace(/\\n/g, '\n');
      
      if (privateKeyFromEnv.includes('\\n') && !formattedPrivateKey.includes('\n')) {
        console.warn("[Firebase Admin] Replacement of '\\n' to actual newlines might not have occurred as expected. This could happen if the original key already had actual newlines or no '\\n' strings.");
      } else if (privateKeyFromEnv.includes('\\n')) {
        console.log("[Firebase Admin] Successfully replaced '\\n' with actual newlines in private key.");
      }


      const credentialConfig = {
        projectId: projectIdFromEnv,
        clientEmail: clientEmailFromEnv,
        privateKey: formattedPrivateKey,
      };
      
      console.log('[Firebase Admin] Credentials object to be used for cert():', JSON.stringify(credentialConfig, (key, value) => key === 'privateKey' ? '[REDACTED]' : value));

      admin.initializeApp({
        credential: admin.credential.cert(credentialConfig),
      });
      
      console.log('Firebase Admin SDK initialized successfully using separate environment variables. Project ID used: ' + projectIdFromEnv);
      adminAuth = admin.auth();
      adminDb = admin.firestore();
      adminStorage = admin.storage();
    }
  } catch (error: any) {
    console.error(
      'CRITICAL: Firebase Admin SDK initialization failed unexpectedly during admin.initializeApp() with separate variables:',
      error.message,
      error.stack
    );
  }
} else {
  const currentApp = admin.app();
  console.log(
    'Firebase Admin SDK: App already initialized. Reusing existing instance. Project ID: ' + (currentApp.options.credential as any)?.projectId || currentApp.options.projectId || 'N/A'
  );
  adminAuth = admin.auth();
  adminDb = admin.firestore();
  adminStorage = admin.storage();
}

export { adminAuth, adminDb, adminStorage };
