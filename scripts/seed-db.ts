import * as path from 'path';
import * as dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { adminDb } = require('../src/lib/firebase/admin');

async function clearCollections(collections: string[]) {
  for (const coll of collections) {
    console.log(`Clearing ${coll}...`);
    const snapshot = await adminDb.collection(coll).get();
    const batch = adminDb.batch();
    snapshot.docs.forEach((doc: any) => batch.delete(doc.ref));
    await batch.commit();
  }
}

async function runSeed() {
  console.log("🌱 Iniciando Seeding de Base de Datos...");

  // 1. Limpiar colecciones
  await clearCollections(['catalog_items', 'courses', 'downloads', 'podcasts', 'coaching', 'communities', 'memberships']);

  const CREATOR_UID = 'creator_mock_uid_001';
  const db = adminDb;

  // 1. COURSE
  const courseId = uuidv4();
  const courseData = {
    id: courseId,
    creatorUid: CREATOR_UID,
    nombre: "Sanación de Heridas de la Infancia",
    descripcionCorta: "Aprende a abrazar a tu niño interior y reprogramar tus creencias limitantes.",
    descripcionLarga: "Un viaje profundo de 3 semanas donde exploraremos las 5 heridas del alma y cómo sanarlas desde la psicología transpersonal...",
    imagenPortadaUrl: "https://images.unsplash.com/photo-1518002171953-a080ee817e1f?w=800&q=80",
    precio: 99.00,
    estado: 'publicado',
    modulos: [
      { id: 'm1', titulo: 'Conociendo al Niño Interior', lecciones: [{ id: 'l1', titulo: 'La herida de abandono', videoUrl: 'https://example.com/video1.mp4' }] }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  await db.collection('courses').doc(courseId).set(courseData);

  // 2. DOWNLOAD
  const downloadId = uuidv4();
  const downloadData = {
    id: downloadId,
    creatorUid: CREATOR_UID,
    title: "Diario Somático de 30 Días",
    description: "PDF interactivo con ejercicios de liberación de trauma guiados.",
    coverUrl: "https://images.unsplash.com/photo-1544830251-11cda320f269?w=800&q=80",
    fileUrl: "https://example.com/diario.pdf",
    price: 15.00,
    currency: "EUR",
    status: 'published',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  await db.collection('downloads').doc(downloadId).set(downloadData);

  // 3. PODCAST
  const podcastId = uuidv4();
  const podcastData = {
    id: podcastId,
    creatorUid: CREATOR_UID,
    title: "Voces de la Consciencia",
    description: "Meditaciones guiadas premium y reflexiones profundas no disponibles en otras plataformas.",
    coverUrl: "https://images.unsplash.com/photo-1593697972679-c4041d132a46?w=800&q=80",
    price: 25.00,
    currency: "EUR",
    status: 'published',
    episodes: [
      { id: 'ep1', title: 'Ep. 1: Soltar el control', duration: 1800, audioUrl: "https://example.com/audio1.mp3" }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  await db.collection('podcasts').doc(podcastId).set(podcastData);

  // 4. COMMUNITY
  const communityId = uuidv4();
  const communityData = {
    id: communityId,
    creatorUid: CREATOR_UID,
    title: "Tribu de Sanadores",
    shortDescription: "Comunidad privada para estudiantes y terapeutas.",
    coverUrl: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&q=80",
    price: 49.00,
    isPrivate: false,
    status: 'published',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  await db.collection('communities').doc(communityId).set(communityData);

  // 5. MEMBERSHIP
  const membershipId = uuidv4();
  const membershipData = {
    id: membershipId,
    creatorUid: CREATOR_UID,
    title: "Suscripción All-Access",
    description: "Acceso completo a todos los cursos y la comunidad.",
    coverUrl: "https://images.unsplash.com/photo-1542435503-956c469947f6?w=800&q=80",
    price: 29.99,
    billingPeriod: 'monthly',
    status: 'published',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  await db.collection('memberships').doc(membershipId).set(membershipData);

  // 6. COACHING
  const coachingId = uuidv4();
  const coachingData = {
    id: coachingId,
    creatorUid: CREATOR_UID,
    title: "Mentoría 1:1 Avanzada",
    description: "Sesión de 60 minutos enfocada en tu crecimiento profesional o sanación personal.",
    coverUrl: "https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=800&q=80",
    price: 150.00,
    durationMinutes: 60,
    status: 'published',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  await db.collection('coaching').doc(coachingId).set(coachingData);

  // CATALOG ITEMS
  const catalogBatch = db.batch();
  
  const assets = [
    { id: courseId, data: courseData, type: 'course', name: courseData.nombre },
    { id: downloadId, data: downloadData, type: 'download', name: downloadData.title },
    { id: podcastId, data: podcastData, type: 'podcast', name: podcastData.title },
    { id: communityId, data: communityData, type: 'community', name: communityData.title },
    { id: membershipId, data: membershipData, type: 'membership', name: membershipData.title },
    { id: coachingId, data: coachingData, type: 'coaching', name: coachingData.title },
  ];

  for (const asset of assets) {
    catalogBatch.set(db.collection('catalog_items').doc(asset.id), {
      id: asset.id,
      assetReferenceId: asset.id,
      assetType: asset.type,
      creatorUid: CREATOR_UID,
      publicName: asset.name,
      coverUrl: asset.data.coverUrl || asset.data.imagenPortadaUrl,
      price: asset.data.price || asset.data.precio,
      currency: "EUR",
      status: 'published',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  await catalogBatch.commit();

  // 7. ENROLLMENTS (Migración Universal Testing)
  // Reutilizamos el UID del SuperAdmin o el usuario por defecto
  const TEST_USER_UID = "2wZwYsz83veWV6hRNubUVPw66Zx2"; // The user uid from earlier join error logs
  
  const enrollmentsBatch = db.batch();
  const enrollmentRef = db.collection('usuarios').doc(TEST_USER_UID).collection('inscripciones').doc(courseId);
  enrollmentsBatch.set(enrollmentRef, {
    uid: TEST_USER_UID,
    assetId: courseId,
    assetType: 'course',
    accessType: 'paid_one_time',
    sourceId: 'seed_script',
    status: 'active',
    enrolledAt: new Date().toISOString()
  });

  const communityEnrollmentRef = db.collection('usuarios').doc(TEST_USER_UID).collection('inscripciones').doc(communityId);
  enrollmentsBatch.set(communityEnrollmentRef, {
    uid: TEST_USER_UID,
    assetId: communityId,
    assetType: 'community',
    accessType: 'free',
    sourceId: 'seed_script',
    status: 'active',
    enrolledAt: new Date().toISOString()
  });

  await enrollmentsBatch.commit();
  console.log(`✅ Inscripciones sembradas para el usuario de pruebas (${TEST_USER_UID}).`);

  console.log("✅ Seed finalizado exitosamente.");
  process.exit(0);
}

runSeed().catch(console.error);
