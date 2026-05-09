import { NextResponse, type NextRequest } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import Stripe from 'stripe';
import { CatalogItemEntity } from '@/backend/catalog/domain/entities/catalog-item.entity';

// Safely initialize Stripe
let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
} else {
  console.warn('[API /checkout/create-session] STRIPE_SECRET_KEY is not set. Stripe functionality will be disabled.');
}

export async function POST(request: NextRequest) {
  if (!stripe) {
    console.error('Stripe is not configured because STRIPE_SECRET_KEY is missing.');
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
      console.error('Error verifying ID token in checkout:', error);
      return NextResponse.json({ error: 'Unauthorized: Invalid ID token', details: error.message }, { status: 401 });
    }
    const userId = decodedToken.uid;
    const userEmail = decodedToken.email;

    // Accept both for backwards compatibility
    const { catalogItemId, courseId, referralCode, bookingId } = await request.json();
    const itemId = catalogItemId || courseId;
    
    console.log('[API /checkout/create-session] Payload:', { itemId, referralCode, bookingId });

    if (!itemId || typeof itemId !== 'string') {
      return NextResponse.json({ error: 'Bad Request: Missing or invalid catalogItemId/courseId.' }, { status: 400 });
    }

    // 1. Fetch from Unified Catalog
    const catalogDoc = await adminDb.collection('catalog_items').doc(itemId).get();
    
    if (!catalogDoc.exists) {
      return NextResponse.json({ error: 'Product not found in catalog.' }, { status: 404 });
    }
    
    const catalogItem = catalogDoc.data() as any;

    if (catalogItem.status !== 'published') {
      return NextResponse.json({ error: 'Product not available for purchase.' }, { status: 403 });
    }
    if (catalogItem.price <= 0) { 
      return NextResponse.json({ error: 'This product cannot be purchased this way (e.g., free or subscription-based).' }, { status: 400 });
    }

    const origin = request.headers.get('origin') || 'http://localhost:9003'; 

    // 2. Base Metadata
    const metadata: Stripe.MetadataParam = {
        catalogItemId: catalogItem.id,
        assetReferenceId: catalogItem.assetReferenceId,
        assetType: catalogItem.assetType,
        creatorUid: catalogItem.creatorUid,
        buyerUid: userId,
    };

    if (bookingId) {
      metadata.bookingId = bookingId;
    }

    // 3. Referral Metadata resolving
    if (referralCode && catalogItem.referralPolicyId) {
      metadata.referralPolicyId = catalogItem.referralPolicyId;

      const usersSnap = await adminDb.collection('usuarios').where('referralCodeGenerated', '==', referralCode).limit(1).get();
      if (!usersSnap.empty) {
        const affiliate1Uid = usersSnap.docs[0].id;
        
        // Prevent self-referral
        if (affiliate1Uid !== userId) {
          metadata.affiliate1Uid = affiliate1Uid;

          const affiliate1Data = usersSnap.docs[0].data();
          if (affiliate1Data.referredBy) {
            const parentAffSnap = await adminDb.collection('usuarios').where('referralCodeGenerated', '==', affiliate1Data.referredBy).limit(1).get();
            if (!parentAffSnap.empty) {
              metadata.affiliate2Uid = parentAffSnap.docs[0].id;
            }
          }
        }
      }
    }
    
    console.log('[API /checkout/create-session] Final metadata:', metadata);

    // 4. Create Stripe Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: catalogItem.currency || 'eur', 
            product_data: {
              name: catalogItem.publicName,
              description: `Acceso a ${catalogItem.assetType}`,
              images: catalogItem.coverUrl ? [catalogItem.coverUrl] : [],
            },
            unit_amount: Math.round(catalogItem.price * 100), 
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/payment/success?session_id={CHECKOUT_SESSION_ID}&catalogItemId=${catalogItem.id}`,
      cancel_url: `${origin}/products/${catalogItem.id}?canceled=true`,
      customer_email: userEmail, 
      metadata: metadata,
    });

    if (!session.id || !session.url) {
      throw new Error("Failed to create Stripe checkout session ID or URL.");
    }

    return NextResponse.json({ sessionId: session.id, sessionUrl: session.url }, { status: 200 });

  } catch (error: any) {
    console.error('Error creating Stripe checkout session:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}