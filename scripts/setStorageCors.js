// scripts/setStorageCors.js
require('dotenv').config();
const path = require('path');
const { Storage } = require('@google-cloud/storage');

async function main() {
  // Cargamos desde .env
  const bucketName = process.env.FIREBASE_STORAGE_BUCKET;
  if (!bucketName) {
    console.error('❌ Falta FIREBASE_STORAGE_BUCKET en .env');
    process.exit(1);
  }

  let credentials;
  try {
    // Si tu FIREBASE_SERVICE_ACCOUNT es el JSON completo
    credentials = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } catch (err) {
    console.error('❌ Error parseando FIREBASE_SERVICE_ACCOUNT:', err);
    process.exit(1);
  }

  const storage = new Storage({
    projectId: credentials.project_id,
    credentials
  });

  // Configuración CORS
  const corsConfig = [
    {
      origin: ['http://localhost:3000', 'https://3000-firebase-consciousness-class-1748280678993.cluster-6vyo4gb53jczovun3dxslzjahs.cloudworkstations.dev'],
      method: ['GET','POST','PUT','DELETE','HEAD','OPTIONS'],
      responseHeader: ['Content-Type','Access-Control-Allow-Origin'],
      maxAgeSeconds: 3600
    }
  ];

  try {
    await storage
      .bucket(bucketName)
      .setCorsConfiguration(corsConfig);
    console.log(`✅ CORS configurado en el bucket ${bucketName}`);
  } catch (err) {
    console.error('❌ Error configurando CORS:', err);
    process.exit(1);
  }
}

main();
