
// src/features/course/infrastructure/repositories/firebase-course.repository.ts
import type { ICourseRepository } from '@/features/course/domain/repositories/course.repository';
import { CourseEntity, type CourseProperties } from '@/features/course/domain/entities/course.entity';
import { adminDb } from '@/lib/firebase/admin';
import type { FirebaseError } from 'firebase-admin';
// FieldValue ahora no se usa, ya que leeremos y escribiremos el valor numérico.
// import { FieldValue } from 'firebase-admin/firestore';


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
      const courseDoc = await courseRef.get();
      if (!courseDoc.exists) {
        console.error(`[FirebaseCourseRepository] incrementStudentCount - Course ${courseId} not found.`);
        throw new Error(`Course ${courseId} not found for student count increment.`);
      }

      const courseData = courseDoc.data() as CourseProperties;
      const currentStudentCount = typeof courseData.totalEstudiantes === 'number' ? courseData.totalEstudiantes : 0;
      const newStudentCount = currentStudentCount + 1;

      console.log(`[FirebaseCourseRepository] incrementStudentCount - Course ${courseId}: Current count ${currentStudentCount}, New count ${newStudentCount}. Attempting update...`);
      await courseRef.update({
        totalEstudiantes: newStudentCount,
        fechaActualizacion: new Date().toISOString(),
      });
      console.log(`[FirebaseCourseRepository] incrementStudentCount - Firestore update called for course ${courseId}.`);

      // Verification step
      console.log(`[FirebaseCourseRepository] incrementStudentCount - VERIFICATION STEP: Re-reading course document ${courseId}...`);
      const updatedCourseSnap = await courseRef.get();
      const updatedCourseData = updatedCourseSnap.data() as CourseProperties | undefined;

      if (updatedCourseData && updatedCourseData.totalEstudiantes === newStudentCount) {
        console.log(`[FirebaseCourseRepository] incrementStudentCount - SUCCESS: Student count for course ${courseId} confirmed as ${newStudentCount} AFTER update.`);
      } else {
        console.error(`[FirebaseCourseRepository] incrementStudentCount - CRITICAL FAILURE: Firestore update for totalEstudiantes for course ${courseId} DID NOT PERSIST or value mismatch. Expected: ${newStudentCount}, Read back: ${updatedCourseData?.totalEstudiantes}`);
        throw new Error(`DB_CONFIRMATION_FAILED: Course totalStudents for ${courseId} not reflected after increment. Expected ${newStudentCount}, got ${updatedCourseData?.totalEstudiantes}`);
      }

    } catch (error: any) {
      const firebaseError = error as FirebaseError;
      console.error(`[FirebaseCourseRepository] incrementStudentCount - ERROR for course ID (${courseId}):`, firebaseError.message);
      if (error.message.startsWith('DB_CONFIRMATION_FAILED:')) {
        throw error;
      }
      throw new Error(`Firestore incrementStudentCount operation for course failed: ${firebaseError.message}`);
    }
  }
}
