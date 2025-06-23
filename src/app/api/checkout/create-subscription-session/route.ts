
// src/app/api/checkout/create-subscription-session/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { FirebaseCourseRepository } from '@/features/course/infrastructure/repositories/firebase-course.repository';
import Stripe from 'stripe';

// Safely initialize Stripe
let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
} else {
  console.warn('[API /checkout/create-subscription-session] STRIPE_SECRET_KEY is not set. Stripe functionality will be disabled.');
}

export async function POST(request: NextRequest) {
  if (!stripe) {
    console.error('[API /checkout/create-subscription-session] Stripe is not configured because STRIPE_SECRET_KEY is missing.');
    return NextResponse.json({ error: 'Server configuration error', details: 'Stripe is not configured.' }, { status: 503 });
  }

  try {
    const authorization = request.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing or invalid token format' }, { status: 401 });
    }
    const idToken = authorization.split('Bearer ')[1];

    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch (error: any) {
      console.error('Error verifying ID token in /api/checkout/create-subscription-session:', error);
      return NextResponse.json({ error: 'Unauthorized: Invalid ID token', details: error.message }, { status: 401 });
    }
    const userId = decodedToken.uid;
    const userEmail = decodedToken.email;

    const { courseId, referralCode, promotedCourseId } = await request.json();
    console.log('[API /checkout/create-subscription-session] Received payload:', { courseId, referralCode, promotedCourseId });


    if (!courseId || typeof courseId !== 'string') {
      return NextResponse.json({ error: 'Bad Request: Missing or invalid courseId.' }, { status: 400 });
    }

    const courseRepository = new FirebaseCourseRepository();
    const course = await courseRepository.findById(courseId);

    if (!course) {
      return NextResponse.json({ error: 'Course not found.' }, { status: 404 });
    }
    if (course.estado !== 'publicado') {
      return NextResponse.json({ error: 'Course not available for purchase.' }, { status: 403 });
    }
    if (course.tipoAcceso !== 'suscripcion') {
      return NextResponse.json({ error: 'This course is not a subscription type.' }, { status: 400 });
    }
    if (!course.stripePriceId) {
      return NextResponse.json({ error: 'Subscription price for this course is not configured in Stripe.' }, { status: 500 });
    }
    if (course.precio <= 0 && course.tipoAcceso === 'suscripcion') {
        console.warn(`[API /checkout/create-subscription-session] Attempt to subscribe to a free subscription course ${courseId}. This might be an edge case to handle (e.g., free trials).`);
        // Depending on business logic, might want to allow this or block it.
        // For now, if price is 0, it implies it's free and shouldn't go through Stripe checkout for subscription.
        // Or, if using Stripe trials, this logic needs adjustment.
        return NextResponse.json({ error: 'Free subscriptions should be handled differently.' }, { status: 400 });
    }


    const origin = request.headers.get('origin') || 'http://localhost:9003';

    const metadata: Stripe.MetadataParam = {
        courseId: course.id,
        userId: userId,
        stripePriceId: course.stripePriceId, // Important for webhook to know which price was used
        tipoAcceso: course.tipoAcceso, // To differentiate in webhook if needed
    };

    if (referralCode) {
        metadata.referralCodeUsed = referralCode;
        console.log(`[API /checkout/create-subscription-session] Adding referralCodeUsed to metadata: ${referralCode}`);
    }
    if (promotedCourseId) {
        metadata.promotedCourseId = promotedCourseId;
        console.log(`[API /checkout/create-subscription-session] Adding promotedCourseId to metadata: ${promotedCourseId}`);
    }

    console.log('[API /checkout/create-subscription-session] Final metadata for Stripe session:', metadata);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: course.stripePriceId, // Use the Stripe Price ID for subscriptions
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${origin}/payment/success?session_id={CHECKOUT_SESSION_ID}&courseId=${courseId}&type=subscription`,
      cancel_url: `${origin}/courses/${courseId}?canceled=true`,
      customer_email: userEmail,
      metadata: metadata,
      subscription_data: { // Pass metadata to the subscription object as well for easier retrieval
        metadata: {
            platform_course_id: course.id,
            platform_user_id: userId,
        }
      }
    });

    if (!session.id || !session.url) {
      console.error("[API /checkout/create-subscription-session] Stripe session ID or URL is null or undefined after creation.");
      throw new Error("Failed to create Stripe checkout session ID or URL.");
    }

    return NextResponse.json({ sessionId: session.id, sessionUrl: session.url }, { status: 200 });

  } catch (error: any) {
    console.error('Error creating Stripe subscription checkout session:', error);
    let errorMessage = 'Internal Server Error';
    let errorDetails = 'An unexpected error occurred while creating the subscription checkout session.';

    if (error instanceof Error) {
      errorDetails = error.message;
      errorMessage = error.name === 'Error' ? 'Subscription Checkout Error' : error.name;
    }

    const stack = process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : String(error)) : undefined;
    return NextResponse.json({ error: errorMessage, details: errorDetails, stack }, { status: 500 });
  }
}

    