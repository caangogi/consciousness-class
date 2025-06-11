
// src/features/progress/infrastructure/repositories/firebase-user-course-progress.repository.ts
import type { IUserCourseProgressRepository } from '@/features/progress/domain/repositories/user-course-progress.repository';
import { UserCourseProgressEntity, type UserCourseProgressProperties } from '@/features/progress/domain/entities/user-course-progress.entity';
import { adminDb } from '@/lib/firebase/admin';
import type { FirebaseError } from 'firebase-admin';

const USERS_COLLECTION = 'usuarios';
const PROGRESS_SUBCOLLECTION = 'progresoCursos';

export class FirebaseUserCourseProgressRepository implements IUserCourseProgressRepository {
  private getProgressDocRef(userId: string, courseId: string) {
    if (!adminDb) {
      throw new Error('Firebase Admin SDK (adminDb) not initialized.');
    }
    return adminDb.collection(USERS_COLLECTION).doc(userId)
                  .collection(PROGRESS_SUBCOLLECTION).doc(courseId);
  }

  async get(userId: string, courseId: string): Promise<UserCourseProgressEntity | null> {
    try {
      const docSnap = await this.getProgressDocRef(userId, courseId).get();
      if (!docSnap.exists) {
        console.log(`[FirebaseUserCourseProgressRepository] No progress found for user ${userId}, course ${courseId}`);
        return null;
      }
      return new UserCourseProgressEntity(docSnap.data() as UserCourseProgressProperties);
    } catch (error: any) {
      const firebaseError = error as FirebaseError;
      console.error(`[FirebaseUserCourseProgressRepository] Error getting progress for user ${userId}, course ${courseId}:`, firebaseError.message);
      throw new Error(`Firestore get progress operation failed: ${firebaseError.message}`);
    }
  }

  async save(progress: UserCourseProgressEntity): Promise<void> {
    try {
      const progressData = progress.toPlainObject();
      await this.getProgressDocRef(progress.userId, progress.courseId).set(progressData, { merge: true });
      console.log(`[FirebaseUserCourseProgressRepository] Progress saved for user ${progress.userId}, course ${progress.courseId}`);
    } catch (error: any) {
      const firebaseError = error as FirebaseError;
      console.error(`[FirebaseUserCourseProgressRepository] Error saving progress for user ${progress.userId}, course ${progress.courseId}:`, firebaseError.message);
      throw new Error(`Firestore save progress operation failed: ${firebaseError.message}`);
    }
  }
}
