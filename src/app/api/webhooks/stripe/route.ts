
import { NextResponse, type NextRequest } from 'next/server';
import Stripe from 'stripe';
import { adminDb } from '@/lib/firebase/admin';
import { FirebaseUserRepository } from '@/features/user/infrastructure/repositories/firebase-user.repository';
import { FirebaseCourseRepository } from '@/features/course/infrastructure/repositories/firebase-course.repository';
import { EnrollmentService } from '@/features/enrollment/application/enrollment.service';
import { FieldValue } from 'firebase-admin/firestore';

const LOGS_COLLECTION = 'webhookLogs';
const COMMISSIONS_COLLECTION = 'comisionesRegistradas'; // Nueva colección

async function writeWebhookLog(eventId: string, step: string, details: any) {
  const timestamp = new Date().toISOString();
  try {
    if (!adminDb) {
      console.error('[Stripe Webhook Log] CRITICAL: adminDb is not initialized. Cannot write webhook log.');
      return; 
    }
    await adminDb
      .collection(LOGS_COLLECTION)
      .add({ eventId, timestamp, step, details });
    console.log(`[Stripe Webhook Log] Logged: ${step} for event ${eventId}`);
  } catch (err) {
    console.error('[Stripe Webhook Log] writeWebhookLog failed:', err);
  }
}


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20', 
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export const config = {
  api: {
    bodyParser: false, 
  },
};

export async function POST(request: NextRequest) {
  console.log('[Stripe Webhook] Received a request - START.');

  if (!webhookSecret) {
    console.error('[Stripe Webhook] Server error: Stripe webhook secret missing. STRIPE_WEBHOOK_SECRET env var must be set.');
    return NextResponse.json({ error: 'Server error: Stripe webhook secret missing.' }, { status: 500 });
  }
  console.log('[Stripe Webhook] Webhook secret is present.');

  if (!adminDb) {
    console.error('[Stripe Webhook] Server error: Firebase Admin (adminDb) not initialized. Check server startup logs for Firebase Admin SDK issues.');
    return NextResponse.json({ error: 'Server error: Firebase Admin not initialized.' }, { status: 503 });
  }
  console.log('[Stripe Webhook] Firebase Admin (adminDb) is initialized.');

  const sig = request.headers.get('stripe-signature');
  if (!sig) {
    console.error('[Stripe Webhook] Webhook Error: Missing "stripe-signature" header. Cannot verify event.');
  } else {
    console.log('[Stripe Webhook] Stripe signature header is present.');
  }

  let rawBody: string;
  try {
    rawBody = await request.text();
    console.log('[Stripe Webhook] Successfully read request body.');
  } catch (err: any) {
    console.error('[Stripe Webhook] Error reading request body:', err);
    return NextResponse.json({ error: 'Webhook Error: could not read body' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    if (!sig) { 
      console.error('[Stripe Webhook] Webhook Error: Missing "stripe-signature" header after attempting to read body. Cannot verify event.');
      await writeWebhookLog("NO_EVENT_ID_NO_SIGNATURE", 'missing_signature_header', { error: "Missing stripe-signature header" });
      return NextResponse.json({ error: 'Webhook Error: Missing signature header' }, { status: 400 });
    }
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    console.log(`[Stripe Webhook] Event constructed successfully. Type: ${event.type}, ID: ${event.id}`);
  } catch (err: any) {
    console.error(`[Stripe Webhook] Webhook signature verification FAILED: ${err.message}. Ensure webhook secret matches Stripe Dashboard and 'stripe listen'.`);
    await writeWebhookLog("SIGNATURE_VERIFICATION_FAILED", 'signature_verification_failed', { error: err.message });
    return NextResponse.json({ error: `Webhook signature verification failed: ${err.message}` }, { status: 400 });
  }
  
  const eventId = event.id; 
  await writeWebhookLog(eventId, 'received_and_verified_event', { type: event.type, id: event.id });

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log(`[Stripe Webhook] Processing '${event.type}'. Session ID: ${session.id}, Payment Status: ${session.payment_status}`);
        await writeWebhookLog(eventId, 'checkout.session.completed_received', { sessionId: session.id, payment_status: session.payment_status, metadata: session.metadata });

        if (session.payment_status === 'paid') {
          console.log('[Stripe Webhook] Payment status is "paid". Extracting metadata...');
          
          const buyerUserId = session.metadata?.userId;
          const courseIdPurchased = session.metadata?.courseId;
          const referralCodeUsed = session.metadata?.referralCodeUsed;
          const promotedCourseId = session.metadata?.promotedCourseId;
          
          console.log('[Stripe Webhook] Raw Metadata from Stripe session:', JSON.stringify(session.metadata)); 
          console.log(`[Stripe Webhook] Extracted - Buyer User ID: ${buyerUserId}, Course ID Purchased: ${courseIdPurchased}, Referral Code Used: ${referralCodeUsed}, Promoted Course ID: ${promotedCourseId}`);
          await writeWebhookLog(eventId, 'extracted_metadata', { buyerUserId, courseIdPurchased, referralCodeUsed, promotedCourseId, rawMetadata: session.metadata });

          if (!buyerUserId || !courseIdPurchased) {
            console.error(`[Stripe Webhook] CRITICAL: Missing essential metadata. Buyer User ID: ${buyerUserId}, Course ID Purchased: ${courseIdPurchased}. Cannot proceed with enrollment for session ${session.id}.`);
            await writeWebhookLog(eventId, 'missing_metadata_error_enrollment', { buyerUserId, courseIdPurchased, rawMetadata: session.metadata });
            // No devolver error 400 todavía, intentar procesar comisión si es posible.
            // return NextResponse.json({ error: 'Webhook Error: Missing essential metadata (userId or courseId) for enrollment.' }, { status: 400 });
          } else {
             // Proceder con la inscripción
            console.log(`[Stripe Webhook] Enrollment Metadata OK. Calling EnrollmentService for User: ${buyerUserId}, Course: ${courseIdPurchased}`);
            const userRepository = new FirebaseUserRepository();
            const courseRepository = new FirebaseCourseRepository();
            const enrollmentService = new EnrollmentService(userRepository, courseRepository);
            
            await enrollmentService.enrollStudentToCourse(buyerUserId, courseIdPurchased);
            console.log(`[Stripe Webhook] EnrollmentService.enrollStudentToCourse completed successfully for User: ${buyerUserId}, Course: ${courseIdPurchased}.`);
            await writeWebhookLog(eventId, 'enrollment_service_success', { buyerUserId, courseIdPurchased });
          }


          // Lógica de Referidos y Comisiones
          if (referralCodeUsed && buyerUserId) {
            console.log(`[Stripe Webhook] Referral code "${referralCodeUsed}" found. Processing referral...`);
            const userRepository = new FirebaseUserRepository();
            const courseRepository = new FirebaseCourseRepository();

            const referrerUser = await userRepository.findByReferralCode(referralCodeUsed);

            if (referrerUser && referrerUser.uid !== buyerUserId) {
              console.log(`[Stripe Webhook] Referrer found: UID ${referrerUser.uid}. Buyer UID: ${buyerUserId}.`);
              
              // Incrementar referidosExitosos del referente
              await userRepository.incrementSuccessfulReferrals(referrerUser.uid);
              console.log(`[Stripe Webhook] Incremented successful referrals for referrer ${referrerUser.uid}.`);

              const coursePurchased = await courseRepository.findById(courseIdPurchased);
              if (coursePurchased && coursePurchased.comisionReferidoPorcentaje && coursePurchased.comisionReferidoPorcentaje > 0) {
                // Solo registrar comisión si el curso comprado es el mismo que el promocionado (si promotedCourseId existe)
                // O si promotedCourseId no existe, se asume que cualquier compra con el código de referido aplica.
                // Para MVP, si el curso comprado ES el promocionado Y tiene comisión.
                if (courseIdPurchased === promotedCourseId) {
                  const commissionPercentage = coursePurchased.comisionReferidoPorcentaje / 100;
                  const purchaseAmount = session.amount_total ? session.amount_total / 100 : 0; // Convertir de céntimos a euros/USD
                  const commissionAmount = purchaseAmount * commissionPercentage;

                  const commissionData = {
                    referenteUid: referrerUser.uid,
                    referidoUid: buyerUserId,
                    courseIdComprado: courseIdPurchased,
                    promotedCourseId: promotedCourseId, // Guardar para trazabilidad
                    stripeSessionId: session.id,
                    montoCompra: purchaseAmount,
                    porcentajeComisionCurso: coursePurchased.comisionReferidoPorcentaje,
                    montoComisionCalculado: commissionAmount,
                    fechaCreacion: new Date().toISOString(),
                    estadoPagoComision: 'pendiente',
                  };
                  await adminDb.collection(COMMISSIONS_COLLECTION).add(commissionData);
                  console.log(`[Stripe Webhook] Commission registered for referrer ${referrerUser.uid} for course ${courseIdPurchased}. Amount: ${commissionAmount.toFixed(2)}`);
                  await writeWebhookLog(eventId, 'commission_registered', commissionData);
                  
                  // Actualizar balanceComisionesPendientes del referente
                  await userRepository.updateReferrerBalance(referrerUser.uid, commissionAmount);
                  console.log(`[Stripe Webhook] Updated pending commission balance for referrer ${referrerUser.uid} by ${commissionAmount.toFixed(2)}.`);

                } else {
                  console.log(`[Stripe Webhook] Commission not registered: Purchased course ${courseIdPurchased} does not match promoted course ${promotedCourseId}, or course has no commission.`);
                  await writeWebhookLog(eventId, 'commission_not_registered_mismatch_or_no_course_commission', { courseIdPurchased, promotedCourseId, courseCommission: coursePurchased.comisionReferidoPorcentaje });
                }
              } else {
                console.log(`[Stripe Webhook] Course ${courseIdPurchased} not found or has no referral commission percentage. No commission registered.`);
                await writeWebhookLog(eventId, 'commission_not_registered_no_course_commission', { courseIdPurchased });
              }
            } else {
              console.log(`[Stripe Webhook] Referrer not found for code "${referralCodeUsed}" or referrer is the same as buyer. No commission action.`);
              await writeWebhookLog(eventId, 'referrer_not_found_or_is_buyer', { referralCodeUsed, buyerUserId });
            }
          } else {
            console.log('[Stripe Webhook] No referral code used or buyerUserId missing. Skipping referral processing.');
          }

        } else {
          console.log(`[Stripe Webhook] Payment status is '${session.payment_status}', not 'paid'. No enrollment or commission action taken for session ${session.id}.`);
          await writeWebhookLog(eventId, 'payment_not_paid', { sessionId: session.id, payment_status: session.payment_status });
        }
        break;
      }
      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}. Event ID: ${eventId}`);
        await writeWebhookLog(eventId, 'unhandled_event_type', { type: event.type });
    }

    console.log(`[Stripe Webhook] Webhook processed event ${event.id} (Type: ${event.type}) successfully. Responding 200 OK.`);
    await writeWebhookLog(eventId, 'processing_complete_200_ok', { type: event.type });
    return NextResponse.json({ received: true }, { status: 200 });

  } catch (error: any) {
    console.error(`[Stripe Webhook] CRITICAL ERROR processing event ${event.id} (Type: ${event.type}):`, error.message, error.stack);
    await writeWebhookLog(eventId, 'critical_processing_error_500', { type: event.type, error: error.message, stack: error.stack });
    console.log(`[Stripe Webhook] Responding to Stripe with 500 ERROR after processing failure for event ${event.id}`);
    return NextResponse.json({ error: 'Webhook processing failed.', details: error.message }, { status: 500 });
  }
}

    