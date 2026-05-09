import { adminDb } from '@/lib/firebase/admin';
import { NotificationEntity } from '@/backend/community/domain/entities/notification.entity';

export class FirebaseNotificationRepository {
  private col(uid: string) {
    return adminDb.collection('notifications').doc(uid).collection('items');
  }

  async create(notification: NotificationEntity): Promise<void> {
    await this.col(notification.recipientUid)
      .doc(notification.id)
      .set(notification.toPlainObject());
  }

  async getForUser(uid: string, limit = 30): Promise<NotificationEntity[]> {
    const snap = await this.col(uid)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();
    return snap.docs.map(d => new NotificationEntity(d.data() as any));
  }

  async markAsRead(uid: string, notifId: string): Promise<void> {
    await this.col(uid).doc(notifId).update({ isRead: true });
  }

  async markAllAsRead(uid: string): Promise<void> {
    const batch = adminDb.batch();
    const snap = await this.col(uid).where('isRead', '==', false).get();
    snap.docs.forEach(d => batch.update(d.ref, { isRead: true }));
    await batch.commit();
  }

  async getUnreadCount(uid: string): Promise<number> {
    const snap = await this.col(uid).where('isRead', '==', false).count().get();
    return snap.data().count;
  }
}
