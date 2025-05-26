import admin from '../../share/firebase/FirebaseClient';
import { ICourseRepository } from '../domain/ICourseRepository';
import { Course, CoursePersistence } from '../domain/Course';
import { UniqueEntityID } from '../../share/utils/UniqueEntityID';

export class FirebaseCourseRepository implements ICourseRepository {
  private db = admin.firestore();

  async save(course: Course): Promise<void> {
    const data = course.toPersistence();
    await this.db
      .collection('courses')
      .doc(data.id)
      .set(data as FirebaseFirestore.DocumentData);
  }

  async findById(id: UniqueEntityID): Promise<Course | null> {
    const snap = await this.db.collection('courses').doc(id.toString()).get();
    if (!snap.exists) return null;
    const data = snap.data() as CoursePersistence;
    return Course.fromPersistence(data);
  }

  async findAllByInstructor(instructorId: string): Promise<Course[]> {
    const snapshot = await this.db
      .collection('courses')
      .where('instructorId', '==', instructorId)
      .get();
    return snapshot.docs.map(doc => {
      const data = doc.data() as CoursePersistence;
      return Course.fromPersistence(data);
    });
  }

  async delete(id: UniqueEntityID): Promise<void> {
    await this.db.collection('courses').doc(id.toString()).delete();
  }
}