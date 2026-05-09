import { NextResponse, type NextRequest } from 'next/server';
import Stripe from 'stripe';
import { adminDb } from '@/lib/firebase/admin';
import { FirebaseWalletRepository } from '@/backend/wallet/infrastructure/repositories/firebase-wallet.repository';
import { WalletTransactionEntity } from '@/backend/wallet/domain/entities/wallet-transaction.entity';
import { EnrollmentService } from '@/backend/enrollment/application/enrollment.service';
import type { AssetType } from '@/backend/shared/domain/interfaces/asset.interface';
import * as admin from 'firebase-admin';

let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
}

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
const enrollmentService = new EnrollmentService();

export async function POST(request: NextRequest) {
  if (!stripe || !endpointSecret) {
    console.error('Stripe webhook or secret not configured.');
    return NextResponse.json({ error: 'Stripe webhook not configured' }, { status: 503 });
  }

  const payload = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'No signature found' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, sig, endpointSecret);
  } catch (err: any) {
    console.error(`⚠️ Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Handle successful checkout
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    const metadata = session.metadata;
    if (!metadata || !metadata.catalogItemId || !metadata.buyerUid) {
      console.warn('⚠️ Webhook missing metadata. Cannot fulfill order.', metadata);
      return NextResponse.json({ received: true });
    }

    try {
      await fulfillOrder(session, metadata);
    } catch (error) {
      console.error('⚠️ Error fulfilling order:', error);
      return NextResponse.json({ error: 'Fulfillment Error' }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}

async function fulfillOrder(session: Stripe.Checkout.Session, metadata: Stripe.MetadataParam) {
  const {
    catalogItemId,
    assetReferenceId,
    assetType,
    creatorUid,
    buyerUid,
    affiliate1Uid,
    affiliate1Amount,
    affiliate2Uid,
    affiliate2Amount
  } = metadata as Record<string, string>;

  const walletRepo = new FirebaseWalletRepository();
  const ts = new Date().toISOString();
  
  const totalAmount = session.amount_total ? session.amount_total / 100 : 0;

  // 1. Enroll via inscripciones subcollection (canonical)
  await enrollmentService.enrollStudentToAsset(
    buyerUid,
    assetReferenceId,
    (assetType as AssetType) || 'course',
    'paid_one_time',
    catalogItemId
  );

  console.log(`✅ User ${buyerUid} enrolled in ${assetType} (${assetReferenceId}) via inscripciones`);

  // 2. Distribute funds via Ledger
  let remainingForCreator = totalAmount; // Total amount available to distribute
  const platformFeeRaw = parseFloat(process.env.PLATFORM_FEE_PERCENTAGE || "10"); // Ej: 10% de comisión de plataforma
  const platformFeeAmount = (totalAmount * platformFeeRaw) / 100;
  
  remainingForCreator -= platformFeeAmount;

  // A. Process Affiliate Level 1 if exists
  if (affiliate1Uid && affiliate1Amount) {
    const amount = parseFloat(affiliate1Amount);
    remainingForCreator -= amount;

    const txRef1 = WalletTransactionEntity.create({
      walletId: affiliate1Uid,
      type: 'commission_tier_1',
      amount: amount,
      sourceAssetId: catalogItemId,
      relatedStripeChargeId: session.payment_intent as string,
      description: `Comisión Directa (Nivel 1) por venta de ${assetType}`
    });
    
    await walletRepo.processTransaction(txRef1);
    console.log(`💸 Commission L1 granted to ${affiliate1Uid}: $${amount}`);
  }

  // B. Process Affiliate Level 2 if exists
  if (affiliate2Uid && affiliate2Amount) {
    const amount = parseFloat(affiliate2Amount);
    remainingForCreator -= amount;

    const txRef2 = WalletTransactionEntity.create({
      walletId: affiliate2Uid,
      type: 'commission_tier_2',
      amount: amount,
      sourceAssetId: catalogItemId,
      relatedStripeChargeId: session.payment_intent as string,
      description: `Comisión Indirecta (Nivel 2) por venta de ${assetType}`
    });
    
    await walletRepo.processTransaction(txRef2);
    console.log(`💸 Commission L2 granted to ${affiliate2Uid}: $${amount}`);
  }

  // C. Process Creator Earnings
  // In a real app we might validate that remainingForCreator > 0 to avoid negative balances
  const txCreator = WalletTransactionEntity.create({
    walletId: creatorUid,
    type: 'sale',
    amount: Math.max(0, remainingForCreator),
    sourceAssetId: catalogItemId,
    relatedStripeChargeId: session.payment_intent as string,
    description: `Ingreso por venta propia de ${assetType} (Neto)`
  });

  await walletRepo.processTransaction(txCreator);
  console.log(`💸 Creator earning granted to ${creatorUid}: $${remainingForCreator}`);
}
