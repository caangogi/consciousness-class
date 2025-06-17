
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

    if (!projectIdFromEnv || !clientEmailFromEnv || !privateKeyFromEnv) {
      console.error(
        'CRITICAL: Firebase Admin SDK init failed: Missing required env vars (FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY).'
      );
      // Early exit if essential vars are missing
      adminAuth = null;
      adminDb = null;
      adminStorage = null;
    } else {
      // Log initial state of the private key from environment
      const initialPkPreviewStart = privateKeyFromEnv.substring(0, Math.min(30, privateKeyFromEnv.length));
      const initialPkPreviewEnd = privateKeyFromEnv.substring(Math.max(0, privateKeyFromEnv.length - 30));
      console.log(`[Firebase Admin] Initial privateKeyFromEnv (preview): "${initialPkPreviewStart}..."..."${initialPkPreviewEnd}"`);
      console.log(`[Firebase Admin] Initial privateKeyFromEnv length: ${privateKeyFromEnv.length}`);

      // Step 1: Trim whitespace from the entire string
      let processedKey = privateKeyFromEnv.trim();
      if (processedKey.length !== privateKeyFromEnv.length) {
        console.log('[Firebase Admin] Whitespace trimmed from private key. New length:', processedKey.length);
      }

      // Step 2: Remove potential surrounding double quotes
      // Check if it actually starts and ends with a double quote before replacing
      if (processedKey.startsWith('"') && processedKey.endsWith('"')) {
        processedKey = processedKey.substring(1, processedKey.length - 1);
        console.log('[Firebase Admin] Surrounding double quotes removed from private key. New length:', processedKey.length);
      } else {
        console.log('[Firebase Admin] No surrounding double quotes found or key not properly quoted.');
      }
      
      // Log after trimming and quote removal
      const afterQuoteRemovalPkPreviewStart = processedKey.substring(0, Math.min(30, processedKey.length));
      const afterQuoteRemovalPkPreviewEnd = processedKey.substring(Math.max(0, processedKey.length - 30));
      console.log(`[Firebase Admin] Processed key after trim/quote removal (preview): "${afterQuoteRemovalPkPreviewStart}..."..."${afterQuoteRemovalPkPreviewEnd}"`);
      console.log(`[Firebase Admin] Processed key length after trim/quote: ${processedKey.length}`);
      console.log(`[Firebase Admin] Does processed key (after quote removal) contain literal \\n? ${processedKey.includes('\\n')}`);
      console.log(`[Firebase Admin] Does processed key (after quote removal) contain actual newlines (char code 10)? ${processedKey.includes('\n')}`);

      // Step 3: Replace literal "\\n" sequences with actual newline characters "\n"
      let formattedPrivateKey = processedKey.replace(/\\n/g, '\n');
      if (formattedPrivateKey.includes('\n') && !processedKey.includes('\n') && processedKey.includes('\\n')) {
          console.log('[Firebase Admin] Literal "\\n" sequences replaced with actual newlines.');
      } else if (processedKey.includes('\n')) {
          console.log('[Firebase Admin] Processed key (after quote removal) already contained actual newlines. No literal \\n replacement needed.');
      } else if (!processedKey.includes('\\n') && !processedKey.includes('\n')) {
          console.log('[Firebase Admin] Processed key (after quote removal) contained no literal \\n and no actual newlines. This might be an issue if key needs newlines.');
      } else if (processedKey.includes('\\n') && !formattedPrivateKey.includes('\n')) {
          console.warn('[Firebase Admin] Replacement of "\\n" did not seem to result in actual newlines. This is unexpected.');
      }
      
      // Log the final formatted private key (preview) before use
      const finalPkPreviewStart = formattedPrivateKey.substring(0, Math.min(60, formattedPrivateKey.length)); // Show more for checking header
      const finalPkPreviewEnd = formattedPrivateKey.substring(Math.max(0, formattedPrivateKey.length - 60)); // Show more for checking footer
      console.log(`[Firebase Admin] DIAGNOSTIC: Final formattedPrivateKey for cert() (preview, redacted middle): \n"${finalPkPreviewStart} [...REDACTED MIDDLE...] ${finalPkPreviewEnd}"`);
      console.log(`[Firebase Admin] Final formattedPrivateKey length: ${formattedPrivateKey.length}`);
      console.log(`[Firebase Admin] Does final formattedPrivateKey contain actual newlines (char code 10)? ${formattedPrivateKey.includes('\n')}`);
      console.log(`[Firebase Admin] Does final formattedPrivateKey start with '-----BEGIN PRIVATE KEY-----'? ${formattedPrivateKey.startsWith('-----BEGIN PRIVATE KEY-----')}`);
      console.log(`[Firebase Admin] Does final formattedPrivateKey end with '-----END PRIVATE KEY-----'? ${formattedPrivateKey.trim().endsWith('-----END PRIVATE KEY-----')}`); // Trim for endswith check as last \n might be there


      const credentialConfig = {
        projectId: projectIdFromEnv,
        clientEmail: clientEmailFromEnv,
        privateKey: formattedPrivateKey, // Use the fully processed key
      };
      
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
  }
} else {
  const currentApp = admin.app();
  adminAuth = admin.auth();
  adminDb = admin.firestore();
  adminStorage = admin.storage();
}

export { adminAuth, adminDb, adminStorage };
