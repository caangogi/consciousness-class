import * as admin from 'firebase-admin';

const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT!;
let serviceAccount: admin.ServiceAccount;
try {
  serviceAccount = JSON.parse(serviceAccountJson);
} catch (err) {

  console.error('Error parsing FIREBASE_SERVICE_ACCOUNT JSON:', err);
  throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT JSON');
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });
}

export default admin;