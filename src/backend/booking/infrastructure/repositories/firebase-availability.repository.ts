import { adminDb } from '@/lib/firebase/admin';
import { AvailabilityEntity, AvailabilityProperties } from '../../domain/entities/availability.entity';

export class FirebaseAvailabilityRepository {
  private readonly collectionName = 'availability';

  async getByCreatorUid(creatorUid: string): Promise<AvailabilityEntity | null> {
    const doc = await adminDb.collection(this.collectionName).doc(creatorUid).get();
    if (!doc.exists) return null;
    
    const data = doc.data() as AvailabilityProperties;
    return new AvailabilityEntity({ ...data, id: doc.id });
  }

  async save(entity: AvailabilityEntity): Promise<void> {
    const data = entity.toPlainObject();
    await adminDb.collection(this.collectionName).doc(entity.creatorUid).set(data);
  }

  // Gets availability or creates default if not exists
  async getOrCreateDefault(creatorUid: string): Promise<AvailabilityEntity> {
    let entity = await this.getByCreatorUid(creatorUid);
    if (!entity) {
      entity = AvailabilityEntity.create({
        creatorUid,
        timezone: 'Europe/Madrid', // Should probably default to UTC or user's preference in a real app
        weeklySchedule: AvailabilityEntity.generateDefaultSchedule(),
        exceptions: [],
      });
      await this.save(entity);
    }
    return entity;
  }
}
