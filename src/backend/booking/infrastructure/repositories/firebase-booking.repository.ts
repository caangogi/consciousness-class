import { adminDb } from '@/lib/firebase/admin';
import { BookingEntity, BookingProperties } from '../../domain/entities/booking.entity';

export class FirebaseBookingRepository {
  private readonly collectionName = 'bookings';

  async getById(id: string): Promise<BookingEntity | null> {
    const doc = await adminDb.collection(this.collectionName).doc(id).get();
    if (!doc.exists) return null;
    
    return new BookingEntity(doc.data() as BookingProperties);
  }

  async save(entity: BookingEntity): Promise<void> {
    const data = entity.toPlainObject();
    await adminDb.collection(this.collectionName).doc(entity.id).set(data, { merge: true });
  }

  // Get all active bookings for a creator in a specific time range to calculate availability
  async getCreatorBookingsInRange(creatorUid: string, startIso: string, endIso: string): Promise<BookingEntity[]> {
    const snapshot = await adminDb.collection(this.collectionName)
      .where('creatorUid', '==', creatorUid)
      .where('startTime', '>=', startIso)
      .where('startTime', '<=', endIso)
      .where('status', 'in', ['scheduled', 'completed', 'pending_payment']) // pending_payment blocks the slot temporarily
      .get();

    return snapshot.docs.map(doc => new BookingEntity(doc.data() as BookingProperties));
  }

  // Get bookings for a specific patient
  async getPatientBookings(patientUid: string): Promise<BookingEntity[]> {
    const snapshot = await adminDb.collection(this.collectionName)
      .where('patientUid', '==', patientUid)
      .orderBy('startTime', 'desc')
      .get();

    return snapshot.docs.map(doc => new BookingEntity(doc.data() as BookingProperties));
  }

  // Find a booking by its payment session ID (for Stripe webhooks)
  async getByPaymentSessionId(sessionId: string): Promise<BookingEntity | null> {
    const snapshot = await adminDb.collection(this.collectionName)
      .where('paymentSessionId', '==', sessionId)
      .limit(1)
      .get();

    if (snapshot.empty) return null;
    return new BookingEntity(snapshot.docs[0].data() as BookingProperties);
  }

  // Get all bookings for a creator (for dashboard view)
  async getCreatorBookings(creatorUid: string): Promise<BookingEntity[]> {
    const snapshot = await adminDb.collection(this.collectionName)
      .where('creatorUid', '==', creatorUid)
      .orderBy('startTime', 'desc')
      .get();

    return snapshot.docs.map(doc => new BookingEntity(doc.data() as BookingProperties));
  }
}
