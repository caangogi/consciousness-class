import { adminDb } from '@/lib/firebase/admin';
import { EmailLogEntity, type EmailLogProperties } from '../../domain/entities/email-log.entity';
import type { IEmailLogRepository } from '../../domain/repositories/email-log.repository';

const COLLECTION = 'emailLogs';

export class FirebaseEmailLogRepository implements IEmailLogRepository {
  // Injectable for tests; defaults to the singleton adminDb.
  constructor(private readonly db: any = adminDb) {}

  async save(log: EmailLogEntity): Promise<void> {
    await this.db.collection(COLLECTION).doc(log.id).set(log.toPlainObject());
  }

  async findById(id: string): Promise<EmailLogEntity | null> {
    const snap = await this.db.collection(COLLECTION).doc(id).get();
    if (!snap.exists) return null;
    return EmailLogEntity.fromProperties(snap.data() as EmailLogProperties);
  }

  async findByEventId(eventId: string): Promise<EmailLogEntity[]> {
    const snap = await this.db
      .collection(COLLECTION)
      .where('eventId', '==', eventId)
      .get();
    return snap.docs.map((d: any) =>
      EmailLogEntity.fromProperties(d.data() as EmailLogProperties)
    );
  }
}
