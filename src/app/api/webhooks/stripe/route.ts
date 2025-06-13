
// src/app/api/webhooks/stripe/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import Stripe from 'stripe';
import { adminDb } from '@/lib/firebase/admin'; // Necesario para instanciar repositorios
import { FirebaseUserRepository } from '@/features/user/infrastructure/repositories/firebase-user.repository';
import { FirebaseCourseRepository } from '@/features/course/infrastructure/repositories/firebase-course.repository';
import { EnrollmentService } from '@/features/enrollment/application/enrollment.service';

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
  if (!webhookSecret) {
    console.error('[Stripe Webhook] CRITICAL: Stripe webhook secret no está configurado.');
    return NextResponse.json({ error: 'Server configuration error: Stripe webhook secret missing.' }, { status: 500 });
  }
  if (!adminDb) {
    console.error('[Stripe Webhook] CRITICAL: Firebase Admin SDK (adminDb) not initialized. Webhook cannot process.');
    return NextResponse.json({ error: 'Server configuration error: Firebase Admin not available.' }, { status: 503 });
  }

  const sig = request.headers.get('stripe-signature');
  let reqBuffer;
  try {
    reqBuffer = await request.text();
  } catch (bufferError) {
    console.error('[Stripe Webhook] Error reading request body:', bufferError);
    return NextResponse.json({ error: 'Webhook Error: Could not read request body' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    if (!sig) {
      console.warn('[Stripe Webhook] Sin firma (stripe-signature) recibida.');
      return NextResponse.json({ error: 'Webhook Error: Missing stripe-signature header' }, { status: 400 });
    }
    event = stripe.webhooks.constructEvent(reqBuffer, sig, webhookSecret);
  } catch (err: any) {
    console.error(`[Stripe Webhook] Error al verificar la firma: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  console.log(`[Stripe Webhook] Evento recibido: ${event.type}`);

  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;
      console.log(`[Stripe Webhook] Handling 'checkout.session.completed'. Session ID: ${session.id}, Payment Status: ${session.payment_status}`);

      if (session.payment_status === 'paid') {
        const userId = session.metadata?.userId;
        const courseId = session.metadata?.courseId;

        console.log(`[Stripe Webhook] Payment successful. Extracted metadata: userId='${userId}', courseId='${courseId}'`);

        if (!userId || !courseId) {
          console.error('[Stripe Webhook] ERROR: Faltan metadatos críticos (userId o courseId) en la sesión de Stripe:', session.id, 'Metadata:', session.metadata);
          return NextResponse.json({ error: 'Webhook Error: Missing critical metadata (userId or courseId) from Stripe session.' }, { status: 400 });
        }
        
        // *** La "PRUEBA DE ESCRITURA DIRECTA" ha sido eliminada de aquí ***

        try {
          console.log(`[Stripe Webhook] Attempting to enroll User: ${userId} in Course: ${courseId}`);
          const userRepository = new FirebaseUserRepository();
          const courseRepository = new FirebaseCourseRepository();
          const enrollmentService = new EnrollmentService(userRepository, courseRepository);

          await enrollmentService.enrollStudentToCourse(userId, courseId);
          console.log(`[Stripe Webhook] SUCCESS: EnrollmentService completed for User: ${userId}, Course: ${courseId}.`);
        } catch (enrollmentError: any) {
          console.error(`[Stripe Webhook] ERROR during enrollment for User: ${userId}, Course: ${courseId}. Details:`, enrollmentError.message, enrollmentError.stack);
          // Incluir más detalles del error si es posible, y un identificador único para el error.
          const errorId = `enrollErr_${new Date().getTime()}`;
          console.error(`[Stripe Webhook] Error ID: ${errorId}. Full error object:`, enrollmentError);
          return NextResponse.json({ 
            error: 'Enrollment processing failed.', 
            details: enrollmentError.message,
            errorCode: enrollmentError.code, // Si el error tiene un código
            errorId: errorId,
            stack: process.env.NODE_ENV === 'development' ? enrollmentError.stack : undefined
          }, { status: 500 });
        }
      } else {
        console.log(`[Stripe Webhook] Checkout session ${session.id} completed but payment_status is '${session.payment_status}'. No enrollment action taken.`);
      }
      break;

    // ... (otros cases del switch)
    case 'checkout.session.async_payment_succeeded':
      const asyncSuccessSession = event.data.object as Stripe.Checkout.Session;
      console.log(`[Stripe Webhook] Checkout session async_payment_succeeded: ${asyncSuccessSession.id}`);
      // Similar logic for enrollment if this event is primary for some payment methods
      // Ensure to handle idempotency if 'checkout.session.completed' might also fire
      break;

    case 'checkout.session.async_payment_failed':
      const asyncFailedSession = event.data.object as Stripe.Checkout.Session;
      console.log(`[Stripe Webhook] Checkout session async_payment_failed: ${asyncFailedSession.id}. Razón: ${asyncFailedSession.last_payment_error?.message || 'No especificada'}`);
      break;

    case 'checkout.session.expired':
      const expiredSession = event.data.object as Stripe.Checkout.Session;
      console.log(`[Stripe Webhook] Checkout session expired: ${expiredSession.id}.`);
      break;

    // --- Eventos de Suscripción ---
    case 'customer.subscription.created':
      const subscriptionCreated = event.data.object as Stripe.Subscription;
      console.log(`[Stripe Webhook] Customer subscription created: ${subscriptionCreated.id}, Customer: ${subscriptionCreated.customer}, Status: ${subscriptionCreated.status}`);
      break;

    case 'customer.subscription.updated':
      const subscriptionUpdated = event.data.object as Stripe.Subscription;
      console.log(`[Stripe Webhook] Customer subscription updated: ${subscriptionUpdated.id}, Status: ${subscriptionUpdated.status}`);
      // Handle subscription status changes (e.g., active, past_due, canceled)
      // Update user access to subscription-based courses accordingly
      break;

    case 'customer.subscription.deleted':
      const subscriptionDeleted = event.data.object as Stripe.Subscription;
      console.log(`[Stripe Webhook] Customer subscription deleted: ${subscriptionDeleted.id}, Customer: ${subscriptionDeleted.customer}`);
      // Revoke access to subscription-based courses
      break;

    // --- Eventos de Facturación ---
    case 'invoice.payment_succeeded':
      const invoicePaymentSucceeded = event.data.object as Stripe.Invoice;
      console.log(`[Stripe Webhook] Invoice payment_succeeded: ${invoicePaymentSucceeded.id}, Subscription: ${invoicePaymentSucceeded.subscription}, Customer: ${invoicePaymentSucceeded.customer}`);
      if (invoicePaymentSucceeded.billing_reason === 'subscription_cycle' && invoicePaymentSucceeded.subscription) {
        console.log(`[Stripe Webhook] Subscription renewal ${invoicePaymentSucceeded.subscription} paid successfully. Ensuring access continues.`);
        // Potentially update user's subscription end date or confirm active status
      }
      break;

    case 'invoice.paid':
      const invoicePaid = event.data.object as Stripe.Invoice;
      console.log(`[Stripe Webhook] Invoice paid: ${invoicePaid.id}, Subscription: ${invoicePaid.subscription}, Customer: ${invoicePaid.customer}`);
      // Similar to invoice.payment_succeeded, often redundant if the other is handled
      break;

    case 'invoice.payment_failed':
      const invoicePaymentFailed = event.data.object as Stripe.Invoice;
      console.log(`[Stripe Webhook] Invoice payment_failed: ${invoicePaymentFailed.id}, Subscription: ${invoicePaymentFailed.subscription}, Customer: ${invoicePaymentFailed.customer}`);
      // Handle failed subscription payments (e.g., notify user, mark subscription as past_due, eventually revoke access)
      break;

    case 'invoice.upcoming':
      const invoiceUpcoming = event.data.object as Stripe.Invoice;
      console.log(`[Stripe Webhook] Invoice upcoming: ${invoiceUpcoming.id}, Subscription: ${invoiceUpcoming.subscription}, Customer: ${invoiceUpcoming.customer}, Due Date: ${invoiceUpcoming.due_date ? new Date(invoiceUpcoming.due_date * 1000) : 'N/A'}`);
      // Optionally notify user about upcoming payment
      break;

    default:
      console.log(`[Stripe Webhook] Evento no manejado recibido: ${event.type}`);
  }

  return NextResponse.json({ received: true }, { status: 200 });
}

    