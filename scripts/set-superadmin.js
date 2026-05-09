/**
 * Script para asignar el rol de 'superadmin' a un usuario específico en Firestore.
 * 
 * Uso: 
 * node scripts/set-superadmin.js
 */

require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const admin = require('firebase-admin');

// Inicializar Firebase Admin. Depende de service-account o de variables de entorno configuradas
function initializeFirebase() {
  if (admin.apps.length > 0) return;

  // Usar las variables específicas del archivo .env
  if (process.env.FIREBASE_ADMIN_PROJECT_ID && process.env.FIREBASE_ADMIN_CLIENT_EMAIL && process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
    try {
      let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
      
      // Limpiar comillas iniciales y finales si dotenv no las eliminó
      if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
          privateKey = privateKey.substring(1, privateKey.length - 1);
      }
      // Reemplazar de forma segura los saltos de línea literales '\n' por saltos de línea reales
      privateKey = privateKey.replace(/\\n/g, '\n');

      admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
            clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
            privateKey: privateKey
        })
      });
      return;
    } catch (error) {
      console.error("No se pudo iniciar el SDK con las credenciales aisladas en el .env", error);
    }
  }

  // Fallback a inicialización por defecto (utiliza GOOGLE_APPLICATION_CREDENTIALS)
  try {
      admin.initializeApp();
  } catch(e) {
      console.error("Error crítico inicializando Firebase Admin. Asegúrate de tener las credenciales.", e);
      process.exit(1);
  }
}

async function makeSuperAdmin(email) {
  try {
    initializeFirebase();
    const db = admin.firestore();

    console.log(`🔍 Buscando usuario en Auth con email: ${email}...`);
    const authUser = await admin.auth().getUserByEmail(email);

    if (!authUser) {
      console.error(`❌ No se encontró la cuenta. ¿El usuario se ha registrado en la plataforma?`);
      process.exit(1);
    }

    const uid = authUser.uid;
    console.log(`✅ Usuario encontrado (UID: ${uid}). Actualizando su rol en Firestore...`);

    const userRef = db.collection('usuarios').doc(uid);
    
    // Firestore usa el campo "role" para manejar roles. (No custom claims internamente)
    await userRef.set({
      role: 'superadmin',
      updatedAt: new Date().toISOString()
    }, { merge: true });

    console.log(`🎉 ¡Éxito! El usuario ${email} ahora tiene permisos de SUPERADMIN en la base de datos.`);

  } catch (error) {
    console.error("❌ Ocurrió un error ejecutando el script:", error.message);
  }
}

// Ejecutar para caangogi@gmail.com
makeSuperAdmin('caangogi@gmail.com');
