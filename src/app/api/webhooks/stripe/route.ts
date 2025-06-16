
import { NextResponse, type NextRequest } from 'next/server';
import Stripe from 'stripe';
import { adminDb } from '@/lib/firebase/admin';
import { FirebaseUserRepository } from '@/features/user/infrastructure/repositories/firebase-user.repository';
import { FirebaseCourseRepository } from '@/features/course/infrastructure/repositories/firebase-course.repository';
import { EnrollmentService } from '@/features/enrollment/application/enrollment.service';
import { FieldValue } from 'firebase-admin/firestore';

const LOGS_COLLECTION = 'webhookLogs';
const COMMISSIONS_COLLECTION = 'comisionesRegistradas';
const SUBSCRIPTIONS_COLLECTION = 'suscripciones'; // Subcolección bajo usuarios

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

// Helper function to handle checkout.session.completed logic
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session, eventId: string) {
  console.log(`[Stripe Webhook] Processing 'checkout.session.completed'. Session ID: ${session.id}, Payment Status: ${session.payment_status}`);
  await writeWebhookLog(eventId, 'checkout.session.completed_received', { sessionId: session.id, payment_status: session.payment_status, metadata: session.metadata });

  if (session.payment_status === 'paid') {
    console.log('[Stripe Webhook] Payment status is "paid". Extracting metadata...');

    const buyerUserId = session.metadata?.userId;
    const courseIdPurchased = session.metadata?.courseId;
    const referralCodeUsed = session.metadata?.referralCodeUsed;
    const promotedCourseId = session.metadata?.promotedCourseId;
    const tipoAcceso = session.metadata?.tipoAcceso; // 'unico' o 'suscripcion'
    const stripeSubscriptionId = session.subscription as string | null; // El ID de la suscripción de Stripe, si es una.

    console.log('[Stripe Webhook] Raw Metadata from Stripe session:', JSON.stringify(session.metadata));
    console.log(`[Stripe Webhook] Extracted - Buyer User ID: ${buyerUserId}, Course ID Purchased: ${courseIdPurchased}, Referral Code Used: ${referralCodeUsed}, Promoted Course ID: ${promotedCourseId}, Tipo Acceso: ${tipoAcceso}, Stripe Subscription ID: ${stripeSubscriptionId}`);
    await writeWebhookLog(eventId, 'extracted_metadata', { buyerUserId, courseIdPurchased, referralCodeUsed, promotedCourseId, tipoAcceso, stripeSubscriptionId, rawMetadata: session.metadata });

    if (!buyerUserId || !courseIdPurchased) {
      console.error(`[Stripe Webhook] CRITICAL: Missing essential metadata. Buyer User ID: ${buyerUserId}, Course ID Purchased: ${courseIdPurchased}. Cannot proceed for session ${session.id}.`);
      await writeWebhookLog(eventId, 'missing_metadata_error_core', { buyerUserId, courseIdPurchased, rawMetadata: session.metadata });
      return; // No podemos continuar sin estos datos
    }

    // ---- Enrollment Logic ----
    console.log(`[Stripe Webhook] Enrollment Metadata OK. Calling EnrollmentService for User: ${buyerUserId}, Course: ${courseIdPurchased}`);
    const userRepository = new FirebaseUserRepository();
    const courseRepository = new FirebaseCourseRepository();
    const enrollmentService = new EnrollmentService(userRepository, courseRepository);

    await enrollmentService.enrollStudentToCourse(buyerUserId, courseIdPurchased);
    console.log(`[Stripe Webhook] EnrollmentService.enrollStudentToCourse completed successfully for User: ${buyerUserId}, Course: ${courseIdPurchased}.`);
    await writeWebhookLog(eventId, 'enrollment_service_success', { buyerUserId, courseIdPurchased });

    // ---- Subscription Initial Record (if it's a subscription) ----
    if (tipoAcceso === 'suscripcion' && stripeSubscriptionId) {
        try {
            const subscriptionObject = await stripe.subscriptions.retrieve(stripeSubscriptionId);
            const userSubscriptionRef = adminDb!.collection('usuarios').doc(buyerUserId).collection(SUBSCRIPTIONS_COLLECTION).doc(stripeSubscriptionId);
            await userSubscriptionRef.set({
                stripeSubscriptionId: stripeSubscriptionId,
                stripeCustomerId: typeof subscriptionObject.customer === 'string' ? subscriptionObject.customer : subscriptionObject.customer.id,
                stripePriceId: session.metadata?.stripePriceId || subscriptionObject.items.data[0]?.price.id,
                courseId: courseIdPurchased,
                status: subscriptionObject.status, // e.g., 'active', 'trialing'
                currentPeriodStart: new Date(subscriptionObject.current_period_start * 1000).toISOString(),
                currentPeriodEnd: new Date(subscriptionObject.current_period_end * 1000).toISOString(),
                cancelAtPeriodEnd: subscriptionObject.cancel_at_period_end,
                createdAt: new Date(subscriptionObject.created * 1000).toISOString(),
                updatedAt: new Date().toISOString(),
            }, { merge: true });
            console.log(`[Stripe Webhook] Initial subscription record created/merged for user ${buyerUserId}, subscription ${stripeSubscriptionId}, course ${courseIdPurchased}.`);
            await writeWebhookLog(eventId, 'initial_subscription_record_created', { buyerUserId, stripeSubscriptionId, courseIdPurchased });
        } catch (subError: any) {
            console.error(`[Stripe Webhook] Error creating initial subscription record for user ${buyerUserId}, subscription ${stripeSubscriptionId}:`, subError.message);
            await writeWebhookLog(eventId, 'initial_subscription_record_error', { buyerUserId, stripeSubscriptionId, error: subError.message });
        }
    }


    // ---- Referral and Commission Logic ----
    console.log(`[Stripe Webhook] Checking conditions for referral processing: referralCodeUsed ('${referralCodeUsed}') and buyerUserId ('${buyerUserId}') must be present.`);
    if (referralCodeUsed && buyerUserId) {
      console.log(`[Stripe Webhook] Referral code "${referralCodeUsed}" found. Processing referral for buyer ${buyerUserId}...`);
      const referrerUser = await userRepository.findByReferralCode(referralCodeUsed);

      if (referrerUser) {
        console.log(`[Stripe Webhook] Referrer found: UID ${referrerUser.uid}.`);
        if (referrerUser.uid === buyerUserId) {
          console.log(`[Stripe Webhook] Buyer ${buyerUserId} used their own referral code. No commission or referral increment.`);
          await writeWebhookLog(eventId, 'self_referral_attempt', { referralCodeUsed, buyerUserId });
        } else {
          console.log(`[Stripe Webhook] Referrer ${referrerUser.uid} is different from buyer ${buyerUserId}. Proceeding with referral logic.`);
          await userRepository.incrementSuccessfulReferrals(referrerUser.uid);
          console.log(`[Stripe Webhook] Incremented successful referrals for referrer ${referrerUser.uid}.`);
          await writeWebhookLog(eventId, 'referrer_successful_referral_incremented', { referrerUid: referrerUser.uid });

          const coursePurchasedEntity = await courseRepository.findById(courseIdPurchased);
          if (coursePurchasedEntity) {
            console.log(`[Stripe Webhook] Course purchased details: ID ${coursePurchasedEntity.id}, Name: ${coursePurchasedEntity.nombre}, Commission %: ${coursePurchasedEntity.comisionReferidoPorcentaje}`);
            if (typeof coursePurchasedEntity.comisionReferidoPorcentaje === 'number' && coursePurchasedEntity.comisionReferidoPorcentaje > 0) {
              console.log(`[Stripe Webhook] Course ${courseIdPurchased} has a commission of ${coursePurchasedEntity.comisionReferidoPorcentaje}%.`);
              console.log(`[Stripe Webhook] Checking if purchased course (${courseIdPurchased}) matches promoted course (${promotedCourseId}).`);

              if (courseIdPurchased === promotedCourseId) {
                console.log(`[Stripe Webhook] Purchased course ${courseIdPurchased} MATCHES promoted course ${promotedCourseId}. Calculating commission.`);
                const commissionPercentage = coursePurchasedEntity.comisionReferidoPorcentaje / 100;
                const purchaseAmount = session.amount_total ? session.amount_total / 100 : 0; // amount_total is in cents
                const commissionAmount = purchaseAmount * commissionPercentage;

                const commissionData = {
                  referenteUid: referrerUser.uid,
                  referidoUid: buyerUserId,
                  courseIdComprado: courseIdPurchased,
                  promotedCourseId: promotedCourseId,
                  stripeSessionId: session.id,
                  montoCompra: purchaseAmount,
                  porcentajeComisionCurso: coursePurchasedEntity.comisionReferidoPorcentaje,
                  montoComisionCalculado: commissionAmount,
                  fechaCreacion: new Date().toISOString(),
                  estadoPagoComision: 'pendiente',
                };
                await adminDb!.collection(COMMISSIONS_COLLECTION).add(commissionData);
                console.log(`[Stripe Webhook] Commission registered in '${COMMISSIONS_COLLECTION}' for referrer ${referrerUser.uid} for course ${courseIdPurchased}. Amount: ${commissionAmount.toFixed(2)}`);
                await writeWebhookLog(eventId, 'commission_registered', commissionData);

                await userRepository.updateReferrerBalance(referrerUser.uid, commissionAmount);
                console.log(`[Stripe Webhook] Updated pending commission balance for referrer ${referrerUser.uid} by ${commissionAmount.toFixed(2)}.`);
                await writeWebhookLog(eventId, 'referrer_balance_updated', { referrerUid: referrerUser.uid, amount: commissionAmount });
              } else {
                console.log(`[Stripe Webhook] Commission NOT registered: Purchased course ${courseIdPurchased} (Name: ${coursePurchasedEntity.nombre}) does NOT match promoted course ${promotedCourseId}. No commission for this specific promotion link.`);
                await writeWebhookLog(eventId, 'commission_not_registered_course_mismatch', { courseIdPurchased, promotedCourseId, courseCommission: coursePurchasedEntity.comisionReferidoPorcentaje });
              }
            } else {
              console.log(`[Stripe Webhook] Course ${courseIdPurchased} (Name: ${coursePurchasedEntity.nombre}) has no referral commission percentage defined (value: ${coursePurchasedEntity.comisionReferidoPorcentaje}). No commission registered.`);
              await writeWebhookLog(eventId, 'commission_not_registered_no_course_commission_percentage', { courseIdPurchased, courseCommission: coursePurchasedEntity.comisionReferidoPorcentaje });
            }
          } else {
            console.error(`[Stripe Webhook] CRITICAL: Course with ID ${courseIdPurchased} NOT FOUND in database, but was part of a paid session. Cannot process commission.`);
            await writeWebhookLog(eventId, 'commission_error_course_not_found', { courseIdPurchased });
          }
        }
      } else {
        console.log(`[Stripe Webhook] Referrer not found for code "${referralCodeUsed}". No commission action.`);
        await writeWebhookLog(eventId, 'referrer_not_found_for_code', { referralCodeUsed, buyerUserId });
      }
    } else {
      console.log(`[Stripe Webhook] Skipping referral/commission processing: referralCodeUsed is '${referralCodeUsed}', buyerUserId is '${buyerUserId}'.`);
      await writeWebhookLog(eventId, 'skipping_referral_no_code_or_buyer', { referralCodeUsed, buyerUserId });
    }
  } else {
    console.log(`[Stripe Webhook] Payment status is '${session.payment_status}', not 'paid'. No enrollment or commission action taken for session ${session.id}.`);
    await writeWebhookLog(eventId, 'payment_not_paid', { sessionId: session.id, payment_status: session.payment_status });
  }
}

async function handleCustomerSubscriptionEvent(subscription: Stripe.Subscription, eventId: string, eventType: string) {
    const userId = subscription.metadata?.platform_user_id;
    const courseId = subscription.metadata?.platform_course_id; // O el ID del PriceItem si es más granular
    const stripeSubscriptionId = subscription.id;

    if (!userId || !stripeSubscriptionId) {
        console.error(`[Stripe Webhook] ${eventType}: Missing platform_user_id or subscription ID in metadata for subscription ${stripeSubscriptionId}. Metadata:`, subscription.metadata);
        await writeWebhookLog(eventId, `${eventType}_missing_metadata`, { stripeSubscriptionId, metadata: subscription.metadata });
        return;
    }
    if (!adminDb) {
        console.error('[Stripe Webhook] Firebase adminDb not initialized for subscription event.');
        await writeWebhookLog(eventId, `${eventType}_adminDb_not_init`, { stripeSubscriptionId });
        return;
    }

    const userSubscriptionRef = adminDb.collection('usuarios').doc(userId).collection(SUBSCRIPTIONS_COLLECTION).doc(stripeSubscriptionId);

    try {
        const subscriptionDataToStore = {
            stripeSubscriptionId: stripeSubscriptionId,
            stripeCustomerId: typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id,
            stripePriceId: subscription.items.data[0]?.price.id, // Asume un solo item por ahora
            courseId: courseId || subscription.items.data[0]?.price.metadata?.platform_course_id || null, // Intenta obtenerlo de varios lugares
            status: subscription.status,
            currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            createdAt: new Date(subscription.created * 1000).toISOString(),
            updatedAt: new Date().toISOString(), // Siempre actualizamos la fecha de modificación
        };

        await userSubscriptionRef.set(subscriptionDataToStore, { merge: true });
        console.log(`[Stripe Webhook] ${eventType}: Subscription record for ${stripeSubscriptionId} for user ${userId} (course: ${courseId || 'N/A'}) ${eventType === 'customer.subscription.deleted' ? 'status updated/marked as deleted' : 'created/updated'}.`);
        await writeWebhookLog(eventId, `${eventType}_record_saved`, { userId, stripeSubscriptionId, courseId, status: subscription.status });

        // Si es una creación y el estado es activo, asegurar la inscripción
        if (eventType === 'customer.subscription.created' && (subscription.status === 'active' || subscription.status === 'trialing') && courseId) {
            const userRepository = new FirebaseUserRepository();
            const courseRepository = new FirebaseCourseRepository();
            const enrollmentService = new EnrollmentService(userRepository, courseRepository);
            await enrollmentService.enrollStudentToCourse(userId, courseId);
            console.log(`[Stripe Webhook] ${eventType}: Ensured enrollment for user ${userId} to course ${courseId}.`);
            await writeWebhookLog(eventId, `${eventType}_enrollment_ensured`, { userId, courseId });
        }
        // Podríamos añadir lógica para revocar acceso si subscription.status es 'canceled' o 'unpaid' etc.

    } catch (error: any) {
        console.error(`[Stripe Webhook] ${eventType}: Error processing subscription ${stripeSubscriptionId} for user ${userId}:`, error.message);
        await writeWebhookLog(eventId, `${eventType}_processing_error`, { userId, stripeSubscriptionId, error: error.message });
    }
}


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
  // No hacer log aquí aún, hacerlo dentro del case para evitar duplicados si el evento se procesa varias veces

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session, eventId);
        break;
      }
      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        await writeWebhookLog(eventId, 'customer.subscription.created_received', { subscriptionId: subscription.id });
        await handleCustomerSubscriptionEvent(subscription, eventId, 'customer.subscription.created');
        break;
      }
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await writeWebhookLog(eventId, 'customer.subscription.updated_received', { subscriptionId: subscription.id, status: subscription.status });
        await handleCustomerSubscriptionEvent(subscription, eventId, 'customer.subscription.updated');
        break;
      }
      case 'customer.subscription.deleted': { // Cancelada inmediatamente o al final del periodo
        const subscription = event.data.object as Stripe.Subscription;
        await writeWebhookLog(eventId, 'customer.subscription.deleted_received', { subscriptionId: subscription.id });
        await handleCustomerSubscriptionEvent(subscription, eventId, 'customer.subscription.deleted');
        break;
      }
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await writeWebhookLog(eventId, 'invoice.payment_succeeded_received', { invoiceId: invoice.id, subscriptionId: invoice.subscription, customer: invoice.customer });
        // Podríamos usar esto para comisiones recurrentes, o para asegurar el estado de la suscripción
        if (invoice.billing_reason === 'subscription_cycle' && invoice.subscription && typeof invoice.subscription === 'string') {
             const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
             // Aquí se podría reactivar el acceso o confirmar que sigue activo.
             // Y si se quieren comisiones recurrentes para referidos, se calcularían aquí.
             console.log(`[Stripe Webhook] Invoice paid for subscription cycle: ${invoice.subscription}.`);
             // Para MVP, el acceso se gestiona principalmente por customer.subscription.updated/created
        }
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await writeWebhookLog(eventId, 'invoice.payment_failed_received', { invoiceId: invoice.id, subscriptionId: invoice.subscription, customer: invoice.customer });
        // Lógica para manejar pago fallido: marcar suscripción como 'past_due', notificar al usuario, etc.
        if (invoice.subscription && typeof invoice.subscription === 'string') {
            const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
            await handleCustomerSubscriptionEvent(subscription, eventId, 'invoice.payment_failed_subscription_update');
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

    