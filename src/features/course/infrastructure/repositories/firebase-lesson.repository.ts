
// src/features/course/infrastructure/repositories/firebase-lesson.repository.ts
import type { ILessonRepository } from '@/features/course/domain/repositories/lesson.repository';
import { LessonEntity, type LessonProperties } from '@/features/course/domain/entities/lesson.entity';
import { adminDb } from '@/lib/firebase/admin';
import type { FirebaseError } from 'firebase-admin';

const COURSES_COLLECTION = 'cursos';
const MODULES_SUBCOLLECTION = 'modulos';
const LESSONS_SUBCOLLECTION = 'lecciones';

export class FirebaseLessonRepository implements ILessonRepository {
  private getLessonsCollection(courseId: string, moduleId: string) {
    if (!adminDb) {
      throw new Error('Firebase Admin SDK (adminDb) not initialized.');
    }
    return adminDb.collection(COURSES_COLLECTION).doc(courseId)
                  .collection(MODULES_SUBCOLLECTION).doc(moduleId)
                  .collection(LESSONS_SUBCOLLECTION);
  }

  async save(lesson: LessonEntity): Promise<void> {
    try {
      const lessonData = lesson.toPlainObject();
      await this.getLessonsCollection(lesson.courseId, lesson.moduleId)
                .doc(lesson.id).set(lessonData, { merge: true });
      console.log(`[FirebaseLessonRepository] Lesson saved/updated successfully for Course ID: ${lesson.courseId}, Module ID: ${lesson.moduleId}, Lesson ID: ${lesson.id}`);
    } catch (error: any) {
      const firebaseError = error as FirebaseError;
      console.error(`[FirebaseLessonRepository] Error saving lesson (Lesson ID: ${lesson.id}):`, firebaseError.message);
      throw new Error(`Firestore save operation for lesson failed: ${firebaseError.message}`);
    }
  }

  async findById(courseId: string, moduleId: string, lessonId: string): Promise<LessonEntity | null> {
    try {
      const docSnap = await this.getLessonsCollection(courseId, moduleId).doc(lessonId).get();
      if (!docSnap.exists) {
        console.log(`[FirebaseLessonRepository] Lesson not found for Lesson ID: ${lessonId}`);
        return null;
      }
      return new LessonEntity(docSnap.data() as LessonProperties);
    } catch (error: any) {
      const firebaseError = error as FirebaseError;
      console.error(`[FirebaseLessonRepository] Error finding lesson by ID (Lesson ID: ${lessonId}):`, firebaseError.message);
      throw new Error(`Firestore findById operation for lesson failed: ${firebaseError.message}`);
    }
  }

  async findAllByModuleId(courseId: string, moduleId: string): Promise<LessonEntity[]> {
    try {
      const snapshot = await this.getLessonsCollection(courseId, moduleId).orderBy('orden', 'asc').get();
      if (snapshot.empty) {
        return [];
      }
      return snapshot.docs.map(doc => new LessonEntity(doc.data() as LessonProperties));
    } catch (error: any) {
      const firebaseError = error as FirebaseError;
      console.error(`[FirebaseLessonRepository] Error finding lessons by Module ID (${moduleId}):`, firebaseError.message);
      throw new Error(`Firestore findAllByModuleId operation for lesson failed: ${firebaseError.message}`);
    }
  }

  async delete(courseId: string, moduleId: string, lessonId: string): Promise<void> {
    try {
      await this.getLessonsCollection(courseId, moduleId).doc(lessonId).delete();
      console.log(`[FirebaseLessonRepository] Lesson deleted successfully. Lesson ID: ${lessonId}`);
    } catch (error: any) {
      const firebaseError = error as FirebaseError;
      console.error(`[FirebaseLessonRepository] Error deleting lesson (Lesson ID: ${lessonId}):`, firebaseError.message);
      throw new Error(`Firestore delete operation for lesson failed: ${firebaseError.message}`);
    }
  }
}
