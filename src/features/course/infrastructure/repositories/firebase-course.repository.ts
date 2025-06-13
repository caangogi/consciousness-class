
// src/features/course/infrastructure/repositories/firebase-course.repository.ts
import type { ICourseRepository } from '@/features/course/domain/repositories/course.repository';
import { CourseEntity, type CourseProperties } from '@/features/course/domain/entities/course.entity';
import { adminDb } from '@/lib/firebase/admin';
import type { FirebaseError } from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';


const COURSES_COLLECTION = 'cursos';

export class FirebaseCourseRepository implements ICourseRepository {
  private get coursesCollection() {
    if (!adminDb) {
      throw new Error('Firebase Admin SDK (adminDb) not initialized.');
    }
    return adminDb.collection(COURSES_COLLECTION);
  }

  async save(course: CourseEntity): Promise<void> {
    try {
      const courseData = course.toPlainObject();
      await this.coursesCollection.doc(course.id).set(courseData, { merge: true });
      console.log(`[FirebaseCourseRepository] Course saved/updated successfully for ID: ${course.id}`);
    } catch (error: any) {
      const firebaseError = error as FirebaseError;
      console.error(`[FirebaseCourseRepository] Error saving course (ID: ${course.id}):`, firebaseError.message);
      throw new Error(`Firestore save operation for course failed: ${firebaseError.message}`);
    }
  }

  async findById(id: string): Promise<CourseEntity | null> {
    try {
      const docSnap = await this.coursesCollection.doc(id).get();
      if (!docSnap.exists) {
        console.log(`[FirebaseCourseRepository] Course not found for ID: ${id}`);
        return null;
      }
      return new CourseEntity(docSnap.data() as CourseProperties);
    } catch (error: any) {
      const firebaseError = error as FirebaseError;
      console.error(`[FirebaseCourseRepository] Error finding course by ID (${id}):`, firebaseError.message);
      throw new Error(`Firestore findById operation for course failed: ${firebaseError.message}`);
    }
  }

  async findAllByCreator(creatorUid: string): Promise<CourseEntity[]> {
    try {
      const snapshot = await this.coursesCollection.where('creadorUid', '==', creatorUid).orderBy('fechaCreacion', 'desc').get();
      if (snapshot.empty) {
        return [];
      }
      return snapshot.docs.map(doc => new CourseEntity(doc.data() as CourseProperties));
    } catch (error: any) {
      const firebaseError = error as FirebaseError;
      console.error(`[FirebaseCourseRepository] Error finding courses by creatorUid (${creatorUid}):`, firebaseError.message);
      throw new Error(`Firestore findAllByCreator operation for course failed: ${firebaseError.message}`);
    }
  }

  async findAllPublic(): Promise<CourseEntity[]> {
    try {
      const snapshot = await this.coursesCollection
        .where('estado', '==', 'publicado')
        .orderBy('fechaPublicacion', 'desc')
        .get();
      console.log(`[FirebaseCourseRepository] findAllPublic query found ${snapshot.docs.length} documents.`);
      if (snapshot.empty) {
        return [];
      }
      return snapshot.docs.map(doc => new CourseEntity(doc.data() as CourseProperties));
    } catch (error: any) {
      const firebaseError = error as FirebaseError;
      console.error(`[FirebaseCourseRepository] Error finding all public courses:`, firebaseError.message);
      throw new Error(`Firestore findAllPublic operation for course failed: ${firebaseError.message}`);
    }
  }

  async incrementStudentCount(courseId: string): Promise<void> {
    console.log(`[FirebaseCourseRepository] incrementStudentCount - Attempting for Course ID: ${courseId}`);
    const courseRef = this.coursesCollection.doc(courseId);
    try {
      // Ensure adminDb is initialized
      if (!adminDb) {
        const errorMessage = 'Firebase Admin SDK (adminDb) not initialized in incrementStudentCount.';
        console.error(`[FirebaseCourseRepository] incrementStudentCount - CRITICAL: ${errorMessage}`);
        throw new Error(errorMessage);
      }

      console.log(`[FirebaseCourseRepository] incrementStudentCount - About to update course '${courseId}' to increment totalEstudiantes using FieldValue.increment(1).`);
      await courseRef.update({
        totalEstudiantes: FieldValue.increment(1),
        fechaActualizacion: new Date().toISOString(),
      });
      console.log(`[FirebaseCourseRepository] incrementStudentCount - Firestore update call with increment completed for course '${courseId}'.`);

      // Optional: Re-read for verification
      const updatedCourseSnap = await courseRef.get();
      const updatedCourseData = updatedCourseSnap.data() as CourseProperties | undefined;
      const currentStudentCount = updatedCourseData?.totalEstudiantes; // This would be the count *after* increment

      if (updatedCourseData && typeof currentStudentCount === 'number') { // Basic check that it's a number
        console.log(`[FirebaseCourseRepository] incrementStudentCount - SUCCESS: Student count for course ${courseId} is now ${currentStudentCount} AFTER increment update.`);
      } else {
        console.warn(`[FirebaseCourseRepository] incrementStudentCount - VERIFICATION NOTE: totalEstudiantes for course ${courseId} read back as: ${currentStudentCount}. If this is unexpected, further investigation needed.`);
        // Not throwing a CRITICAL FAILURE here as FieldValue.increment is generally reliable.
        // The main concern is if the update call itself fails, which would be caught by the catch block.
      }

    } catch (error: any) {
      const firebaseError = error as FirebaseError;
      console.error(`[FirebaseCourseRepository] incrementStudentCount - ERROR for course ID (${courseId}):`, firebaseError.message);
      throw new Error(`Firestore incrementStudentCount operation for course failed: ${firebaseError.message}`);
    }
  }
}

    