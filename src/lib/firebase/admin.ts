
import admin from 'firebase-admin';

let adminAuth: admin.auth.Auth | null = null;
let adminDb: admin.firestore.Firestore | null = null;
let adminStorage: admin.storage.Storage | null = null;

if (!admin.apps.length) {
  try {
    const projectIdFromEnv = process.env.FIREBASE_ADMIN_PROJECT_ID;
    const clientEmailFromEnv = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    let privateKeyFromEnv = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

    console.log('[Firebase Admin] Attempting to initialize Admin SDK...');
    console.log('[Firebase Admin] Raw FIREBASE_ADMIN_PROJECT_ID from env:', projectIdFromEnv);
    console.log('[Firebase Admin] Raw FIREBASE_ADMIN_CLIENT_EMAIL from env:', clientEmailFromEnv ? 'SET' : 'NOT SET');
    console.log('[Firebase Admin] Raw FIREBASE_ADMIN_PRIVATE_KEY from env (initial check):', privateKeyFromEnv ? 'SET' : 'NOT SET');

    if (!projectIdFromEnv || !clientEmailFromEnv || !privateKeyFromEnv) {
      console.error(
        'CRITICAL: Firebase Admin SDK initialization failed: One or more required environment variables (FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY) are not defined. Please check your .env.local file or Vercel environment variables.'
      );
      console.error('[Firebase Admin] Values checked: projectId=' + projectIdFromEnv + ', clientEmail=' + (clientEmailFromEnv ? 'Exists' : 'Missing') + ', privateKey=' + (privateKeyFromEnv ? 'Exists' : 'Missing'));
    } else {
      console.log(`[Firebase Admin] Original privateKeyFromEnv (first 30 chars): "${privateKeyFromEnv.substring(0, 30)}..."`);
      console.log(`[Firebase Admin] Original privateKeyFromEnv (last 30 chars): "...${privateKeyFromEnv.substring(privateKeyFromEnv.length - 30)}"`);

      // Trim whitespace
      privateKeyFromEnv = privateKeyFromEnv.trim();
      console.log(`[Firebase Admin] privateKeyFromEnv after trim (first 30): "${privateKeyFromEnv.substring(0, 30)}..."`);

      // Remove leading/trailing quotes if present
      if (privateKeyFromEnv.startsWith('"') && privateKeyFromEnv.endsWith('"')) {
        privateKeyFromEnv = privateKeyFromEnv.substring(1, privateKeyFromEnv.length - 1);
        console.log('[Firebase Admin] Removed leading/trailing double quotes.');
        console.log(`[Firebase Admin] privateKeyFromEnv after quote removal (first 30): "${privateKeyFromEnv.substring(0, 30)}..."`);
      }

      // Replace \\n with \n in the private key
      const formattedPrivateKey = privateKeyFromEnv.replace(/\\n/g, '\n');
      console.log(`[Firebase Admin] formattedPrivateKey after newline replacement (first 30): "${formattedPrivateKey.substring(0, 30)}..."`);
      console.log(`[Firebase Admin] formattedPrivateKey after newline replacement (last 30): "...${formattedPrivateKey.substring(formattedPrivateKey.length - 30)}"`);
      console.log(`[Firebase Admin] Does formattedPrivateKey contain literal \\n now? ${formattedPrivateKey.includes('\\n')}`);
      console.log(`[Firebase Admin] Does formattedPrivateKey contain actual newlines (char code 10)? ${formattedPrivateKey.includes('\n')}`);


      const credentialConfig = {
        projectId: projectIdFromEnv,
        clientEmail: clientEmailFromEnv,
        privateKey: formattedPrivateKey,
      };
      
      console.log('[Firebase Admin] Credentials object to be used for cert():', JSON.stringify(credentialConfig, (key, value) => key === 'privateKey' ? '[REDACTED]' : value));

      admin.initializeApp({
        credential: admin.credential.cert(credentialConfig),
      });
      
      console.log('Firebase Admin SDK initialized successfully. Project ID used: ' + projectIdFromEnv);
      adminAuth = admin.auth();
      adminDb = admin.firestore();
      adminStorage = admin.storage();
    }
  } catch (error: any) {
    console.error(
      'CRITICAL: Firebase Admin SDK initialization failed unexpectedly:',
      error.message,
      error.stack
    );
    console.error('[Firebase Admin] Error details (if any):', error);
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
