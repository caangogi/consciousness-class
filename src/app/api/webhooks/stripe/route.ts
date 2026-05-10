
import { NextResponse, type NextRequest } from 'next/server';
import Stripe from 'stripe';
import { adminDb } from '@/lib/firebase/admin';
import { FirebaseUserRepository } from '@/backend/user/infrastructure/repositories/firebase-user.repository';
import { FirebaseCourseRepository } from '@/backend/course/infrastructure/repositories/firebase-course.repository';
import { EnrollmentService } from '@/backend/enrollment/application/enrollment.service';
import { FieldValue } from 'firebase-admin/firestore';
import { PaymentOrchestratorService } from '@/backend/payments/application/payment.orchestrator.service';
import { ReferralService } from '@/backend/referrals/application/referral.service';
import { FirebaseReferralPolicyRepository } from '@/backend/referrals/infrastructure/repositories/firebase-referral-policy.repository';
import { ProcessedStripeEventEntity } from '@/backend/payments/domain/entities/processed-stripe-event.entity';
import { FirebaseProcessedStripeEventRepository } from '@/backend/payments/infrastructure/repositories/firebase-processed-stripe-event.repository';
import { domainEvents } from '@/backend/shared/application/domain-events';

const LOGS_COLLECTION = 'webhookLogs';
const COMMISSIONS_COLLECTION = 'comisionesRegistradas';
const SUBSCRIPTIONS_COLLECTION = 'suscripciones'; // Subcolección bajo usuarios

// Definir la comisión de la plataforma (ej. 20%)
const PLATFORM_COMMISSION_PERCENTAGE = 0.20;


async function writeWebhookLog(eventId: string, step: string, details: any) {
  const timestamp = new Date().toISOString();
  const sanitizedDetails: Record<string, any> = {};
  for (const key in details) {
    if (details[key] !== undefined) {
      sanitizedDetails[key] = details[key];
    } else {
      sanitizedDetails[key] = null;
    }
  }

  try {
    if (!adminDb) {
      console.error('[Stripe Webhook Log] CRITICAL: adminDb is not initialized. Cannot write webhook log.');
      return;
    }
    await adminDb
      .collection(LOGS_COLLECTION)
      .add({ eventId, timestamp, step, details: sanitizedDetails });
    console.log(`[Stripe Webhook Log] Logged: ${step} for event ${eventId}`);
  } catch (err) {
    console.error('[Stripe Webhook Log] writeWebhookLog failed:', err);
  }
}

// Safely initialize Stripe
let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-06-20',
  });
} else {
    console.warn('[Stripe Webhook] STRIPE_SECRET_KEY is not set. Stripe functionality will be disabled.');
}

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export const config = {
  api: {
    bodyParser: false,
  },
};

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session, eventId: string) {
  console.log(`[Stripe Webhook] Processing 'checkout.session.completed'. Session ID: ${session.id}, Payment Status: ${session.payment_status}`);
  await writeWebhookLog(eventId, 'checkout.session.completed_received', { sessionId: session.id, payment_status: session.payment_status, metadata: session.metadata });

  if (session.payment_status === 'paid') {
    console.log('[Stripe Webhook] Payment status is "paid". Extracting metadata...');

    const buyerUserId = session.metadata?.userId || session.metadata?.buyerUid;
    const courseIdPurchased = session.metadata?.courseId || session.metadata?.assetReferenceId;
    const assetType = session.metadata?.assetType || 'course';
    const referralCodeUsed = session.metadata?.referralCodeUsed;
    const promotedCourseId = session.metadata?.promotedCourseId;
    const tipoAcceso = session.metadata?.tipoAcceso;
    const stripeSubscriptionId = session.subscription as string | null;
    const bookingId = session.metadata?.bookingId;

    console.log('[Stripe Webhook] Raw Metadata from Stripe session:', JSON.stringify(session.metadata));
    console.log(`[Stripe Webhook] Extracted - Buyer User ID: ${buyerUserId}, Asset ID: ${courseIdPurchased}, Asset Type: ${assetType}, Booking ID: ${bookingId}`);
    await writeWebhookLog(eventId, 'extracted_metadata', { buyerUserId, courseIdPurchased, assetType, bookingId, rawMetadata: session.metadata });

    if (!buyerUserId || !courseIdPurchased) {
      console.error(`[Stripe Webhook] CRITICAL: Missing essential metadata. Buyer User ID: ${buyerUserId}, Asset ID Purchased: ${courseIdPurchased}. Cannot proceed for session ${session.id}.`);
      await writeWebhookLog(eventId, 'missing_metadata_error_core', { buyerUserId, courseIdPurchased, rawMetadata: session.metadata });
      return;
    }

    const userRepository = new FirebaseUserRepository();
    const courseRepository = new FirebaseCourseRepository();
    const enrollmentService = new EnrollmentService();

    // 1. Core Enrollment
    await enrollmentService.enrollStudentToAsset(buyerUserId, courseIdPurchased, assetType as any, 'paid_one_time', session.id);
    console.log(`[Stripe Webhook] EnrollmentService completed for User: ${buyerUserId}, Asset: ${courseIdPurchased}.`);
    await writeWebhookLog(eventId, 'enrollment_service_success', { buyerUserId, courseIdPurchased });

    // 1.b · T4.1.1 · Emit enrollment.created. Subscribers (e.g. transactional
    //       email handler in T4.1.2) MAY rehydrate fields not available inline
    //       (studentEmail, full asset name, etc.) from Firestore.
    const creatorUidForEvent =
      session.metadata?.creatorUid ||
      (await courseRepository.findById(courseIdPurchased))?.creadorUid ||
      'unknown';
    await domainEvents.emit('enrollment.created', {
      enrollmentId: session.id,
      studentUid: buyerUserId,
      studentEmail: session.customer_details?.email ?? null,
      creatorUid: creatorUidForEvent,
      assetId: courseIdPurchased,
      assetType: assetType ?? 'course',
      paymentMode: 'paid_one_time',
    });

    // 2. Booking Confirmation (if applicable)
    if (bookingId) {
      try {
        const { BookingService } = await import('@/backend/booking/application/booking.service');
        const bookingService = new BookingService();
        await bookingService.confirmBooking(bookingId);
        console.log(`[Stripe Webhook] Confirmed booking: ${bookingId}`);
        await writeWebhookLog(eventId, 'booking_confirmed', { bookingId });

        // 2.b · T4.1.1 · Emit booking.confirmed. Payload uses what we have
        //        inline from the Stripe session; the email subscriber loads
        //        the BookingEntity to fill startTime/endTime/meetLink.
        await domainEvents.emit('booking.confirmed', {
          bookingId,
          creatorUid: creatorUidForEvent,
          patientUid: buyerUserId,
          patientEmail: session.customer_details?.email ?? null,
          startTime: '', // hydrated by handler from BookingEntity.startTime
          endTime: '',   // hydrated by handler from BookingEntity.endTime
          assetId: courseIdPurchased,
        });
      } catch (err: any) {
        console.error(`[Stripe Webhook] Error confirming booking ${bookingId}:`, err);
        await writeWebhookLog(eventId, 'booking_confirmation_error', { bookingId, error: err.message });
      }
    }

    // ---- Creator Revenue and Referral Logic via PaymentOrchestrator ----
    try {
        const coursePurchasedEntity = await courseRepository.findById(courseIdPurchased);
        const creatorUid = session.metadata?.creatorUid || coursePurchasedEntity?.creadorUid;

        if (creatorUid && session.amount_total) {
            const orchestrator = new PaymentOrchestratorService(userRepository as any, new ReferralService());
            
            // Extract Affiliate and Policy metadata
            const referralPolicyId = session.metadata?.referralPolicyId;
            const affiliate1Uid = session.metadata?.affiliate1Uid;
            const affiliate2Uid = session.metadata?.affiliate2Uid;

            let policy = null;
            if (referralPolicyId) {
                const policyRepo = new FirebaseReferralPolicyRepository();
                policy = await policyRepo.getById(referralPolicyId);
            }

            // Distribute Funds
            await orchestrator.distributeStripePayment({
                grossAmount: session.amount_total / 100,
                currency: session.currency || 'eur',
                platformFeePercentage: PLATFORM_COMMISSION_PERCENTAGE,
                policy: policy,
                creatorUid: creatorUid,
                affiliate1Uid: affiliate1Uid,
                affiliate2Uid: affiliate2Uid
            });

            console.log(`[Stripe Webhook] Payment distributed via Orchestrator for session ${session.id}`);
            await writeWebhookLog(eventId, 'payment_distributed_via_orchestrator', { creatorUid, affiliate1Uid, affiliate2Uid, policyId: referralPolicyId });
        } else {
            console.warn(`[Stripe Webhook] Could not process orchestrator revenue. CreatorUID: ${creatorUid}, AmountTotal: ${session.amount_total}`);
            await writeWebhookLog(eventId, 'orchestrator_revenue_processing_skipped', { courseExists: !!coursePurchasedEntity, creatorUid, amount_total: session.amount_total });
        }
    } catch (revError: any) {
        console.error(`[Stripe Webhook] Error processing payment orchestrator for course ${courseIdPurchased}:`, revError.message);
        await writeWebhookLog(eventId, 'orchestrator_revenue_error', { courseId: courseIdPurchased, error: revError.message, stack: revError.stack });
    }
  } else {
    console.log(`[Stripe Webhook] Payment status is '${session.payment_status}', not 'paid'. No enrollment or commission action taken for session ${session.id}.`);
    await writeWebhookLog(eventId, 'payment_not_paid', { sessionId: session.id, payment_status: session.payment_status });
  }
}

async function handleCustomerSubscriptionEvent(subscription: Stripe.Subscription, eventId: string, eventType: string) {
    const userId = subscription.metadata?.platform_user_id;
    const courseIdFromSubMetadata = subscription.metadata?.platform_course_id;
    const courseIdFromPriceMetadata = subscription.items.data[0]?.price?.metadata?.platform_course_id;
    const courseId = courseIdFromSubMetadata || courseIdFromPriceMetadata || null;

    const stripeSubscriptionId = subscription.id;

    console.log(`[Stripe Webhook] ${eventType}: Processing for subscription ${stripeSubscriptionId}. Platform UserID: ${userId}, Platform CourseID (from metadata/price): ${courseId}`);

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
        const createdAtISO = typeof subscription.created === 'number' ? new Date(subscription.created * 1000).toISOString() : new Date().toISOString();
        const currentPeriodStartISO = typeof subscription.current_period_start === 'number' ? new Date(subscription.current_period_start * 1000).toISOString() : null;
        const currentPeriodEndISO = typeof subscription.current_period_end === 'number' ? new Date(subscription.current_period_end * 1000).toISOString() : null;

        console.log(`[Stripe Webhook] ${eventType}: Timestamps - created_raw: ${subscription.created}, created_iso: ${createdAtISO}`);
        console.log(`[Stripe Webhook] ${eventType}: Timestamps - start_raw: ${subscription.current_period_start}, start_iso: ${currentPeriodStartISO}`);
        console.log(`[Stripe Webhook] ${eventType}: Timestamps - end_raw: ${subscription.current_period_end}, end_iso: ${currentPeriodEndISO}`);

        if (!createdAtISO) {
             console.error(`[Stripe Webhook] ${eventType}: CRITICAL: createdAt timestamp is missing or invalid for subscription ${stripeSubscriptionId}.`);
             throw new Error(`Stripe createdAt timestamp is missing or invalid for subscription ${stripeSubscriptionId}.`);
        }
        if (currentPeriodStartISO === null || currentPeriodEndISO === null) {
             console.warn(`[Stripe Webhook] ${eventType}: current_period_start or current_period_end is null after conversion for subscription ${stripeSubscriptionId}. This might be acceptable for some statuses. Proceeding with available data.`);
        }

        const subscriptionDataToStore: any = {
            stripeSubscriptionId: stripeSubscriptionId,
            stripeCustomerId: typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id,
            stripePriceId: subscription.items.data[0]?.price?.id || subscription.items.data[0]?.id || null,
            courseId: courseId,
            status: subscription.status,
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            createdAt: createdAtISO,
            updatedAt: new Date().toISOString(),
        };

        if (currentPeriodStartISO) subscriptionDataToStore.currentPeriodStart = currentPeriodStartISO;
        if (currentPeriodEndISO) subscriptionDataToStore.currentPeriodEnd = currentPeriodEndISO;

        Object.keys(subscriptionDataToStore).forEach(key => {
            if (subscriptionDataToStore[key] === undefined) {
                delete subscriptionDataToStore[key];
            }
        });

        await userSubscriptionRef.set(subscriptionDataToStore, { merge: true });
        console.log(`[Stripe Webhook] ${eventType}: Subscription record for ${stripeSubscriptionId} for user ${userId} (course: ${courseId || 'N/A'}) ${eventType === 'customer.subscription.deleted' ? 'status updated/marked as deleted' : 'created/updated'}. Data:`, JSON.stringify(subscriptionDataToStore));
        await writeWebhookLog(eventId, `${eventType}_record_saved`, { userId, stripeSubscriptionId, courseId, status: subscription.status, dataStored: subscriptionDataToStore });

        if ((eventType === 'customer.subscription.created' || eventType === 'customer.subscription.updated') && (subscription.status === 'active' || subscription.status === 'trialing') && courseId) {
            const enrollmentService = new EnrollmentService();
            await enrollmentService.enrollStudentToAsset(userId, courseId, 'course', 'paid_subscription', stripeSubscriptionId);
            console.log(`[Stripe Webhook] ${eventType}: Ensured enrollment for user ${userId} to course ${courseId}.`);
            await writeWebhookLog(eventId, `${eventType}_enrollment_ensured`, { userId, courseId });
        }

    } catch (error: any) {
        console.error(`[Stripe Webhook] ${eventType}: Error processing subscription ${stripeSubscriptionId} for user ${userId}:`, error.message, error.stack);
        await writeWebhookLog(eventId, `${eventType}_processing_error`, { userId, stripeSubscriptionId, error: error.message, stack: error.stack });
    }
}


async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice, eventId: string) {
    console.log(`[Stripe Webhook] Processing 'invoice.payment_succeeded'. Invoice ID: ${invoice.id}, Subscription ID: ${invoice.subscription}, Billing Reason: ${invoice.billing_reason}, Customer: ${invoice.customer}`);
    await writeWebhookLog(eventId, 'invoice.payment_succeeded_received', {
        invoiceId: invoice.id,
        subscriptionId: invoice.subscription,
        customer: invoice.customer,
        billing_reason: invoice.billing_reason,
        amount_paid: invoice.amount_paid,
    });

    if (typeof invoice.subscription !== 'string') {
        console.log(`[Stripe Webhook] Invoice ${invoice.id} is not related to a subscription or subscription ID is not a string. Skipping further subscription processing.`);
        await writeWebhookLog(eventId, 'invoice.payment_succeeded_not_subscription', { invoiceId: invoice.id, subscription: invoice.subscription });
        return;
    }

    if (!stripe) {
        console.error(`[Stripe Webhook] Stripe not initialized, cannot retrieve subscription for invoice ${invoice.id}.`);
        await writeWebhookLog(eventId, 'invoice.payment_succeeded_stripe_not_init', { invoiceId: invoice.id, subscriptionId: invoice.subscription });
        return;
    }

    const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
    if (subscription) {
        console.log(`[Stripe Webhook] Invoice paid (ID: ${invoice.id}) for subscription: ${invoice.subscription}. Ensuring subscription status is updated.`);
        await handleCustomerSubscriptionEvent(subscription, eventId, 'invoice.payment_succeeded_subscription_update');

        // Logic for creator revenue for recurring payments
        if (invoice.billing_reason === 'subscription_cycle' || invoice.billing_reason === 'subscription_create') { // Also handle initial creation if it comes through here
            const courseIdFromSubMetadata = subscription.metadata?.platform_course_id;
            const courseIdFromPriceMetadata = subscription.items.data[0]?.price?.metadata?.platform_course_id;
            const courseId = courseIdFromSubMetadata || courseIdFromPriceMetadata || null;

            const creatorUidFromSubMetadata = subscription.metadata?.platform_creator_uid; // Assuming you add this to subscription metadata
            
            let creatorUid = creatorUidFromSubMetadata;

            if (!creatorUid && courseId) {
                const courseRepository = new FirebaseCourseRepository();
                const courseEntity = await courseRepository.findById(courseId);
                if (courseEntity) {
                    creatorUid = courseEntity.creadorUid;
                }
            }
            
            if (courseId && creatorUid && invoice.amount_paid) {
                const grossAmount = invoice.amount_paid / 100;
                const platformFee = grossAmount * PLATFORM_COMMISSION_PERCENTAGE;
                const creatorNetRevenue = grossAmount - platformFee;

                const courseRepository = new FirebaseCourseRepository();
                const userRepository = new FirebaseUserRepository();

                await courseRepository.incrementCourseRevenue(courseId, grossAmount);
                console.log(`[Stripe Webhook] Course ${courseId} gross revenue incremented by ${grossAmount.toFixed(2)} from invoice ${invoice.id}.`);
                await writeWebhookLog(eventId, 'course_revenue_incremented_invoice', { courseId, amount: grossAmount, invoiceId: invoice.id });

                await userRepository.updateCreatorPendingRevenue(creatorUid, creatorNetRevenue);
                console.log(`[Stripe Webhook] Creator ${creatorUid} pending revenue updated by ${creatorNetRevenue.toFixed(2)} for course ${courseId} from invoice ${invoice.id}.`);
                await writeWebhookLog(eventId, 'creator_revenue_updated_invoice', { creatorUid, amount: creatorNetRevenue, courseId, invoiceId: invoice.id });
            } else {
                 console.warn(`[Stripe Webhook] Could not process creator revenue from invoice ${invoice.id}. Missing data: courseId=${courseId}, creatorUid=${creatorUid}, amount_paid=${invoice.amount_paid}`);
                 await writeWebhookLog(eventId, 'creator_revenue_invoice_skipped_missing_data', { invoiceId: invoice.id, courseId, creatorUid, amount_paid: invoice.amount_paid });
            }
        }

    } else {
        console.warn(`[Stripe Webhook] Could not retrieve subscription ${invoice.subscription} for invoice ${invoice.id}.`);
        await writeWebhookLog(eventId, 'invoice.payment_succeeded_subscription_not_found', { invoiceId: invoice.id, subscriptionId: invoice.subscription });
    }
}


export async function POST(request: NextRequest) {
  console.log('[Stripe Webhook] Received a request - START.');

  if (!stripe || !webhookSecret) {
    console.error('[Stripe Webhook] Server error: Stripe webhook secret or API key missing.');
    return NextResponse.json({ error: 'Server error: Stripe secrets are not configured.' }, { status: 500 });
  }
  console.log('[Stripe Webhook] Webhook secrets are present.');

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

  // F1.4b · idempotency guard. Atomic insert into processedStripeEvents
  // (using Firestore .create()) gives first-writer-wins under concurrent
  // re-deliveries. If markProcessed returns false, this event has already
  // been processed — return 200 OK so Stripe stops retrying.
  try {
    const idempotencyRepo = new FirebaseProcessedStripeEventRepository();
    const marker = ProcessedStripeEventEntity.create({
      id: event.id,
      eventType: event.type,
    });
    const isFirstTime = await idempotencyRepo.markProcessed(marker);
    if (!isFirstTime) {
      console.log(`[Stripe Webhook] Duplicate event ${event.id} (${event.type}) — skipping reprocessing.`);
      await writeWebhookLog(eventId, 'duplicate_event_skipped', { type: event.type });
      return NextResponse.json({ received: true, duplicate: true }, { status: 200 });
    }
  } catch (idemErr: any) {
    // If the idempotency check itself fails, we MUST 5xx so Stripe retries
    // — better to retry than to silently drop a payment.
    console.error(`[Stripe Webhook] Idempotency check failed for event ${event.id}:`, idemErr);
    await writeWebhookLog(eventId, 'idempotency_check_failed', { type: event.type, error: idemErr.message });
    return NextResponse.json({ error: 'Idempotency check failed', details: idemErr.message }, { status: 503 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session, eventId);
        break;
      }
      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        await writeWebhookLog(eventId, 'customer.subscription.created_received', { subscriptionId: subscription.id, status: subscription.status });
        await handleCustomerSubscriptionEvent(subscription, eventId, 'customer.subscription.created');
        break;
      }
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await writeWebhookLog(eventId, 'customer.subscription.updated_received', { subscriptionId: subscription.id, status: subscription.status });
        await handleCustomerSubscriptionEvent(subscription, eventId, 'customer.subscription.updated');
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await writeWebhookLog(eventId, 'customer.subscription.deleted_received', { subscriptionId: subscription.id, status: subscription.status });
        await handleCustomerSubscriptionEvent(subscription, eventId, 'customer.subscription.deleted');
        break;
      }
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentSucceeded(invoice, eventId);
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await writeWebhookLog(eventId, 'invoice.payment_failed_received', { invoiceId: invoice.id, subscriptionId: invoice.subscription, customer: invoice.customer });
        if (typeof invoice.subscription === 'string') {
            if (!stripe) {
                console.error(`[Stripe Webhook] Stripe not initialized, cannot retrieve subscription ${invoice.subscription} for failed invoice.`);
                await writeWebhookLog(eventId, 'invoice.payment_failed_stripe_not_init', { invoiceId: invoice.id, subscriptionId: invoice.subscription });
            } else {
                const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
                await handleCustomerSubscriptionEvent(subscription, eventId, 'invoice.payment_failed_subscription_update');
            }
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

    