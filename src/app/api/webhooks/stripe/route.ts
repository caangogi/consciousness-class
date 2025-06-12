
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
    bodyParser: false, // Necesitamos el cuerpo raw para la verificación de la firma
  },
};

export async function POST(request: NextRequest) {
  if (!webhookSecret) {
    console.error('Stripe webhook secret no está configurado.');
    return NextResponse.json({ error: 'Server configuration error: Stripe webhook secret missing.' }, { status: 500 });
  }
  if (!adminDb) {
    console.error('CRITICAL: Firebase Admin SDK (adminDb) not initialized. Webhook cannot process.');
    return NextResponse.json({ error: 'Server configuration error: Firebase Admin not available.' }, { status: 503 });
  }

  const sig = request.headers.get('stripe-signature');
  const reqBuffer = await request.text(); // Leer el cuerpo como texto

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

  // Manejar el evento
  console.log(`[Stripe Webhook] Evento recibido: ${event.type}`);

  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;
      console.log(`[Stripe Webhook] Checkout session completed: ${session.id}, Payment Status: ${session.payment_status}`);

      if (session.payment_status === 'paid') {
        const userId = session.metadata?.userId;
        const courseId = session.metadata?.courseId;

        if (!userId || !courseId) {
          console.error('[Stripe Webhook] Faltan metadatos (userId o courseId) en la sesión de Stripe:', session.id, 'Metadata:', session.metadata);
          return NextResponse.json({ received: true, error: 'Missing metadata from Stripe session' }, { status: 200 }); // OK para Stripe, error nuestro
        }

        try {
          console.log(`[Stripe Webhook] Procesando inscripción para Usuario: ${userId}, Curso: ${courseId}`);
          const userRepository = new FirebaseUserRepository();
          const courseRepository = new FirebaseCourseRepository();
          const enrollmentService = new EnrollmentService(userRepository, courseRepository);

          await enrollmentService.enrollStudentToCourse(userId, courseId);
          console.log(`[Stripe Webhook] Inscripción exitosa para Usuario: ${userId}, Curso: ${courseId} tras checkout.session.completed pagada.`);
        } catch (enrollmentError: any) {
          console.error(`[Stripe Webhook] Error al inscribir al usuario ${userId} en el curso ${courseId} (checkout.session.completed):`, enrollmentError.message, enrollmentError.stack);
          // Devolver 200 a Stripe para evitar reintentos, pero loguear el error severamente.
          return NextResponse.json({ received: true, error: 'Enrollment failed post-payment', details: enrollmentError.message }, { status: 200 });
        }
      } else {
        console.log(`[Stripe Webhook] Checkout session ${session.id} completada pero no pagada (estado: ${session.payment_status}). No se procesa inscripción.`);
      }
      break;

    case 'checkout.session.async_payment_succeeded':
      const asyncSuccessSession = event.data.object as Stripe.Checkout.Session;
      console.log(`[Stripe Webhook] Checkout session async_payment_succeeded: ${asyncSuccessSession.id}`);
      // TODO: Lógica similar a 'checkout.session.completed' si es necesario,
      // verificando si la inscripción ya se realizó o si este evento es el primario para ciertos métodos de pago.
      // Por ahora, solo log. Podrías necesitar extraer userId y courseId y llamar a enrollmentService.
      break;

    case 'checkout.session.async_payment_failed':
      const asyncFailedSession = event.data.object as Stripe.Checkout.Session;
      console.log(`[Stripe Webhook] Checkout session async_payment_failed: ${asyncFailedSession.id}. Razón: ${asyncFailedSession.last_payment_error?.message || 'No especificada'}`);
      // TODO: Lógica para manejar el fallo (ej. notificar al usuario, marcar pedido como fallido).
      break;
      
    case 'checkout.session.expired':
      const expiredSession = event.data.object as Stripe.Checkout.Session;
      console.log(`[Stripe Webhook] Checkout session expired: ${expiredSession.id}.`);
      // TODO: Lógica si es necesario (ej. limpiar un carrito abandonado).
      break;

    // --- Eventos de Suscripción (Placeholder para futura implementación) ---
    case 'customer.subscription.created':
      const subscriptionCreated = event.data.object as Stripe.Subscription;
      console.log(`[Stripe Webhook] Customer subscription created: ${subscriptionCreated.id}, Customer: ${subscriptionCreated.customer}, Status: ${subscriptionCreated.status}`);
      // TODO: Lógica para registrar la nueva suscripción en tu sistema.
      break;

    case 'customer.subscription.updated':
      const subscriptionUpdated = event.data.object as Stripe.Subscription;
      console.log(`[Stripe Webhook] Customer subscription updated: ${subscriptionUpdated.id}, Status: ${subscriptionUpdated.status}`);
      // TODO: Lógica para manejar cambios en la suscripción (ej. cambio de plan, renovación, cancelación programada).
      // Si status es 'active' y current_period_end ha cambiado, puede ser una renovación.
      break;

    case 'customer.subscription.deleted':
      const subscriptionDeleted = event.data.object as Stripe.Subscription;
      console.log(`[Stripe Webhook] Customer subscription deleted: ${subscriptionDeleted.id}, Customer: ${subscriptionDeleted.customer}`);
      // TODO: Lógica para marcar la suscripción como cancelada y revocar acceso al final del periodo.
      break;

    // --- Eventos de Facturación (Placeholder para futura implementación, especialmente para suscripciones) ---
    case 'invoice.payment_succeeded':
      const invoicePaymentSucceeded = event.data.object as Stripe.Invoice;
      console.log(`[Stripe Webhook] Invoice payment_succeeded: ${invoicePaymentSucceeded.id}, Subscription: ${invoicePaymentSucceeded.subscription}, Customer: ${invoicePaymentSucceeded.customer}`);
      // TODO: Crucial para renovaciones de suscripción. Confirmar acceso continuo.
      // Podrías verificar si es una renovación de una suscripción activa y actualizar el periodo de acceso del usuario.
      if (invoicePaymentSucceeded.billing_reason === 'subscription_cycle' && invoicePaymentSucceeded.subscription) {
        // Lógica para manejar la renovación exitosa de una suscripción.
        console.log(`[Stripe Webhook] Renovación de suscripción ${invoicePaymentSucceeded.subscription} pagada.`);
      }
      break;
      
    case 'invoice.paid':
      const invoicePaid = event.data.object as Stripe.Invoice;
      console.log(`[Stripe Webhook] Invoice paid: ${invoicePaid.id}, Subscription: ${invoicePaid.subscription}, Customer: ${invoicePaid.customer}`);
      // Similar a invoice.payment_succeeded. Puede ser redundante si ya manejas payment_succeeded.
      // Stripe recomienda usar `invoice.payment_succeeded` para la mayoría de los casos de éxito de pago de facturas.
      break;

    case 'invoice.payment_failed':
      const invoicePaymentFailed = event.data.object as Stripe.Invoice;
      console.log(`[Stripe Webhook] Invoice payment_failed: ${invoicePaymentFailed.id}, Subscription: ${invoicePaymentFailed.subscription}, Customer: ${invoicePaymentFailed.customer}`);
      // TODO: Lógica para manejar fallos en el pago de facturas (ej. notificar al usuario, iniciar proceso de dunning).
      break;
      
    case 'invoice.upcoming':
      const invoiceUpcoming = event.data.object as Stripe.Invoice;
      console.log(`[Stripe Webhook] Invoice upcoming: ${invoiceUpcoming.id}, Subscription: ${invoiceUpcoming.subscription}, Customer: ${invoiceUpcoming.customer}, Due Date: ${invoiceUpcoming.due_date ? new Date(invoiceUpcoming.due_date * 1000) : 'N/A'}`);
      // TODO: Lógica para notificar al usuario sobre una próxima factura.
      break;

    default:
      console.log(`[Stripe Webhook] Evento no manejado recibido: ${event.type}`);
  }

  return NextResponse.json({ received: true }, { status: 200 });
}

