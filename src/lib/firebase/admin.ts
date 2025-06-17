
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
    // console.log('[Firebase Admin] Raw FIREBASE_ADMIN_PROJECT_ID from env:', projectIdFromEnv);
    // console.log('[Firebase Admin] Raw FIREBASE_ADMIN_CLIENT_EMAIL from env:', clientEmailFromEnv ? 'SET' : 'NOT SET');
    // console.log('[Firebase Admin] Raw FIREBASE_ADMIN_PRIVATE_KEY from env (initial check):', privateKeyFromEnv ? 'SET' : 'NOT SET');

    if (!projectIdFromEnv || !clientEmailFromEnv || !privateKeyFromEnv) {
      console.error(
        'CRITICAL: Firebase Admin SDK init failed: Missing required env vars (FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY).'
      );
    } else {
      // Log a small, identifiable, and safe part of the key
      const pkPreviewStart = privateKeyFromEnv.substring(0, 30);
      const pkPreviewEnd = privateKeyFromEnv.substring(privateKeyFromEnv.length - 30);
      console.log(`[Firebase Admin] Initial privateKeyFromEnv (preview): "${pkPreviewStart}..."..."${pkPreviewEnd}"`);
      console.log(`[Firebase Admin] Initial privateKeyFromEnv length: ${privateKeyFromEnv.length}`);


      // 1. Trim whitespace
      let processedKey = privateKeyFromEnv.trim();
      if (processedKey.length !== privateKeyFromEnv.length) {
        console.log('[Firebase Admin] Whitespace trimmed from private key.');
      }

      // 2. Remove potential surrounding quotes
      const originalLengthBeforeQuoteRemoval = processedKey.length;
      processedKey = processedKey.replace(/^"|"$/g, '');
      if (processedKey.length < originalLengthBeforeQuoteRemoval) {
        console.log('[Firebase Admin] Surrounding quotes removed from private key.');
      }
      
      // Log after trimming and quote removal
      const processedPkPreviewStart = processedKey.substring(0, 30);
      const processedPkPreviewEnd = processedKey.substring(processedKey.length - 30);
      console.log(`[Firebase Admin] Processed key after trim/quote removal (preview): "${processedPkPreviewStart}..."..."${processedPkPreviewEnd}"`);
      console.log(`[Firebase Admin] Processed key length: ${processedKey.length}`);
      console.log(`[Firebase Admin] Does processed key contain literal \\n? ${processedKey.includes('\\n')}`);
      console.log(`[Firebase Admin] Does processed key contain actual newlines (char code 10)? ${processedKey.includes('\n')}`);


      // 3. Replace literal "\\n" with actual newlines "\n"
      const formattedPrivateKey = processedKey.replace(/\\n/g, '\n');
      if (formattedPrivateKey.includes('\n') && !processedKey.includes('\n') && processedKey.includes('\\n')) {
          console.log('[Firebase Admin] Literal "\\n" sequences replaced with actual newlines.');
      } else if (processedKey.includes('\n')) {
          console.log('[Firebase Admin] Processed key already contained actual newlines before final formatting step. This might be okay if Vercel handles multiline envs correctly at runtime.');
      } else if (processedKey.includes('\\n') && !formattedPrivateKey.includes('\n')) {
          console.warn('[Firebase Admin] Replacement of "\\n" did not seem to introduce newlines. This could be an issue.');
      }


      const finalPkPreviewStart = formattedPrivateKey.substring(0, 30);
      const finalPkPreviewEnd = formattedPrivateKey.substring(formattedPrivateKey.length - 30);
      console.log(`[Firebase Admin] Final formattedPrivateKey for cert() (preview): "${finalPkPreviewStart}..."..."${finalPkPreviewEnd}"`);
      console.log(`[Firebase Admin] Does final key contain actual newlines (char code 10)? ${formattedPrivateKey.includes('\n')}`);
      

      const credentialConfig = {
        projectId: projectIdFromEnv,
        clientEmail: clientEmailFromEnv,
        privateKey: formattedPrivateKey,
      };
      
      // console.log('[Firebase Admin] Credentials object for cert():', JSON.stringify(credentialConfig, (key, value) => key === 'privateKey' ? '[REDACTED]' : value));

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
    // console.error('[Firebase Admin] Error details (if any):', error);
  }
} else {
  const currentApp = admin.app();
  // console.log(
  //   'Firebase Admin SDK: App already initialized. Reusing. Project ID: ' + (currentApp.options.credential as any)?.projectId || currentApp.options.projectId || 'N/A'
  // );
  adminAuth = admin.auth();
  adminDb = admin.firestore();
  adminStorage = admin.storage();
}

export { adminAuth, adminDb, adminStorage };

