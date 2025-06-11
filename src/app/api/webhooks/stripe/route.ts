
// src/app/api/webhooks/stripe/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import Stripe from 'stripe';
import { adminDb } from '@/lib/firebase/admin'; // Necesario para instanciar repositorios
import { FirebaseUserRepository } from '@/features/user/infrastructure/repositories/firebase-user.repository';
import { FirebaseCourseRepository } from '@/features/course/infrastructure/repositories/firebase-course.repository';
import { EnrollmentService } from '@/features/enrollment/application/enrollment.service';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20', // Utiliza la última versión de la API o la que corresponda a tu integración
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Deshabilitar el bodyParser predeterminado de Next.js para este endpoint, ya que necesitamos el cuerpo raw.
export const config = {
  api: {
    bodyParser: false,
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
  // Leer el cuerpo como texto para la verificación de la firma
  const reqBuffer = await request.text();

  let event: Stripe.Event;

  try {
    if (!sig) {
      console.warn('Webhook sin firma recibido.');
      return NextResponse.json({ error: 'Webhook Error: Missing stripe-signature header' }, { status: 400 });
    }
    event = stripe.webhooks.constructEvent(reqBuffer, sig, webhookSecret);
  } catch (err: any) {
    console.error(`Error al verificar la firma del webhook de Stripe: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Manejar el evento
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;
      console.log('[Webhook] Checkout session completed:', session.id, 'Payment Status:', session.payment_status);

      // Solo procesar si el pago fue exitoso
      if (session.payment_status === 'paid') {
        const userId = session.metadata?.userId;
        const courseId = session.metadata?.courseId;

        if (!userId || !courseId) {
          console.error('[Webhook] Faltan metadatos (userId o courseId) en la sesión de Stripe:', session.id, 'Metadata:', session.metadata);
          // Aún así, responder 200 a Stripe para que no reintente, pero loguear el error.
          return NextResponse.json({ received: true, error: 'Missing metadata' }, { status: 200 });
        }

        try {
          console.log(`[Webhook] Procesando inscripción para Usuario: ${userId}, Curso: ${courseId}`);
          const userRepository = new FirebaseUserRepository();
          const courseRepository = new FirebaseCourseRepository();
          const enrollmentService = new EnrollmentService(userRepository, courseRepository);

          await enrollmentService.enrollStudentToCourse(userId, courseId);
          console.log(`[Webhook] Inscripción exitosa para Usuario: ${userId}, Curso: ${courseId}`);
        } catch (enrollmentError: any) {
          console.error(`[Webhook] Error al inscribir al usuario ${userId} en el curso ${courseId} después del pago:`, enrollmentError.message, enrollmentError.stack);
          // Devolver 200 a Stripe para evitar reintentos, pero loguear el error severamente.
          // Podrías implementar un sistema de reintento interno o notificaciones aquí.
          return NextResponse.json({ received: true, error: 'Enrollment failed post-payment', details: enrollmentError.message }, { status: 200 });
        }
      } else {
        console.log(`[Webhook] Checkout session ${session.id} completada pero no pagada (estado: ${session.payment_status}). No se procesa inscripción.`);
      }
      break;
    // ... manejar otros tipos de eventos si es necesario
    default:
      console.log(`[Webhook] Evento no manejado recibido: ${event.type}`);
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
