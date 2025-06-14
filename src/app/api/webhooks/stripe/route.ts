
import { NextResponse, type NextRequest } from 'next/server';
import Stripe from 'stripe';
import { adminDb } from '@/lib/firebase/admin';
import { FirebaseUserRepository } from '@/features/user/infrastructure/repositories/firebase-user.repository';
import { FirebaseCourseRepository } from '@/features/course/infrastructure/repositories/firebase-course.repository';
import { EnrollmentService } from '@/features/enrollment/application/enrollment.service';

// Collection for storing webhook logs
const LOGS_COLLECTION = 'webhookLogs';

// Helper to write log steps into Firestore (root collection for visibility)
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
    // No vamos a devolver un error 400 inmediatamente aquí para permitir el modo de depuración si fuera necesario,
    // pero la construcción del evento fallará si sig es nulo.
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

  // -- REINTRODUCIENDO LA LÓGICA COMPLETA DEL WEBHOOK --
  let event: Stripe.Event;
  try {
    if (!sig) { // Ahora hacemos la comprobación estricta aquí
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
          
          const userId = session.metadata?.userId ?? session.metadata?.userid;
          const courseId = session.metadata?.courseId ?? session.metadata?.courseid;
          
          console.log('[Stripe Webhook] Raw Metadata from Stripe session:', JSON.stringify(session.metadata)); 
          console.log(`[Stripe Webhook] Extracted - User ID: ${userId}, Course ID: ${courseId}`);
          await writeWebhookLog(eventId, 'extracted_metadata', { userId, courseId, rawMetadata: session.metadata });

          if (!userId || !courseId) {
            console.error(`[Stripe Webhook] CRITICAL: Missing essential metadata. User ID: ${userId}, Course ID: ${courseId}. Cannot proceed with enrollment for session ${session.id}.`);
            await writeWebhookLog(eventId, 'missing_metadata_error', { userId, courseId, rawMetadata: session.metadata });
            return NextResponse.json({ error: 'Webhook Error: Missing essential metadata (userId or courseId).' }, { status: 400 });
          }

          console.log(`[Stripe Webhook] Metadata OK. Calling EnrollmentService for User: ${userId}, Course: ${courseId}`);
          const userRepository = new FirebaseUserRepository();
          const courseRepository = new FirebaseCourseRepository();
          const enrollmentService = new EnrollmentService(userRepository, courseRepository);
          
          await enrollmentService.enrollStudentToCourse(userId, courseId);
          console.log(`[Stripe Webhook] EnrollmentService.enrollStudentToCourse completed successfully for User: ${userId}, Course: ${courseId}.`);
          await writeWebhookLog(eventId, 'enrollment_service_success', { userId, courseId });

        } else {
          console.log(`[Stripe Webhook] Payment status is '${session.payment_status}', not 'paid'. No enrollment action taken for session ${session.id}.`);
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

    