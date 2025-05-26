import { initializeApp } from 'firebase/app';

// Leer configuración completa de Firebase desde variable de entorno
const firebaseConfigJson = process.env.NEXT_PUBLIC_FIREBASE_CLIENT!;
let firebaseConfig;
try {
  firebaseConfig = JSON.parse(firebaseConfigJson);
} catch (err) {
  throw new Error('Invalid JSON in NEXT_PUBLIC_FIREBASE_CLIENT');
}

const app = initializeApp(firebaseConfig);
export default app;