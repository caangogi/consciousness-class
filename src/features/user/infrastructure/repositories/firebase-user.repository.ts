
// src/features/user/infrastructure/repositories/firebase-user.repository.ts
import type { IUserRepository, EnrolledCourseWithProgress, UserWithEnrolledCourses } from '@/features/user/domain/repositories/user.repository';
import { UserEntity, type UserProperties } from '@/features/user/domain/entities/user.entity';
import { adminDb } from '@/lib/firebase/admin';
import type { FirebaseError } from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { CourseProperties } from '@/features/course/domain/entities/course.entity';
import type { UserCourseProgressProperties } from '@/features/progress/domain/entities/user-course-progress.entity';


const USERS_COLLECTION = 'usuarios';
const COURSES_COLLECTION = 'cursos'; // Added for fetching course details
const PROGRESS_SUBCOLLECTION = 'progresoCursos'; // For user progress

export class FirebaseUserRepository implements IUserRepository {
  private get usersCollection() {
    if (!adminDb) {
      console.error('[FirebaseUserRepository] CRITICAL: Firebase Admin SDK (adminDb) not initialized. Cannot access users collection.');
      throw new Error('Firebase Admin SDK (adminDb) not initialized.');
    }
    return adminDb.collection(USERS_COLLECTION);
  }

  async save(user: UserEntity): Promise<void> {
    try {
      const userData = user.toPlainObject(); 
      await this.usersCollection.doc(user.uid).set(userData, { merge: true });
      console.log(`[FirebaseUserRepository] User saved/updated successfully for UID: ${user.uid}`);
    } catch (error: any) {
      const firebaseError = error as FirebaseError;
      console.error(`[FirebaseUserRepository] Error saving user (UID: ${user.uid}):`, firebaseError.message, firebaseError.code, firebaseError.stack);
      throw new Error(`Firestore save operation failed: ${firebaseError.message}`);
    }
  }

  async findByUid(uid: string): Promise<UserEntity | null> {
    try {
      const docSnap = await this.usersCollection.doc(uid).get();
      if (!docSnap.exists) {
        console.log(`[FirebaseUserRepository] User not found for UID: ${uid}`);
        return null;
      }
      const data = docSnap.data() as UserProperties;
      console.log(`[FirebaseUserRepository] findByUid - UID: ${uid}, Raw cursosInscritos from Firestore:`, JSON.stringify(data.cursosInscritos));
      // Ensure cursosInscritos is always an array
      if (!Array.isArray(data.cursosInscritos)) {
        data.cursosInscritos = [];
      }
      return new UserEntity(data);
    } catch (error: any) {
      const firebaseError = error as FirebaseError;
      console.error(`[FirebaseUserRepository] Error finding user by UID (${uid}):`, firebaseError.message, firebaseError.code, firebaseError.stack);
      throw new Error(`Firestore findByUid operation failed: ${firebaseError.message}`);
    }
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    try {
      const snapshot = await this.usersCollection.where('email', '==', email).limit(1).get();
      if (snapshot.empty) {
        console.log(`[FirebaseUserRepository] User not found for email: ${email}`);
        return null;
      }
      const data = snapshot.docs[0].data() as UserProperties;
      // Ensure cursosInscritos is always an array
      if (!Array.isArray(data.cursosInscritos)) {
        data.cursosInscritos = [];
      }
      return new UserEntity(data);
    } catch (error: any) {
      const firebaseError = error as FirebaseError;
      console.error(`[FirebaseUserRepository] Error finding user by email (${email}):`, firebaseError.message, firebaseError.code, firebaseError.stack);
      throw new Error(`Firestore findByEmail operation failed: ${firebaseError.message}`);
    }
  }

  async update(uid: string, data: Partial<Omit<UserProperties, 'uid' | 'email' | 'createdAt'>>): Promise<UserEntity | null> {
    try {
      const userRef = this.usersCollection.doc(uid);
      const userSnap = await userRef.get();
      if (!userSnap.exists) {
        console.warn(`[FirebaseUserRepository] User with UID ${uid} not found for update.`);
        return null;
      }

      const updateData: any = { ...data, updatedAt: new Date().toISOString() };
      
      const currentData = userSnap.data() as UserProperties;
      const newNombre = data.nombre !== undefined ? data.nombre : currentData.nombre;
      const newApellido = data.apellido !== undefined ? data.apellido : currentData.apellido;

      if (data.nombre !== undefined || data.apellido !== undefined) {
          updateData.displayName = `${newNombre} ${newApellido}`.trim();
      }
      
      if (data.photoURL !== undefined) {
        updateData.photoURL = data.photoURL;
      } else if (data.hasOwnProperty('photoURL') && data.photoURL === null) {
         updateData.photoURL = null; 
      }

      // Ensure cursosInscritos remains an array during update if present
      if (data.cursosInscritos !== undefined && !Array.isArray(data.cursosInscritos)) {
        console.warn(`[FirebaseUserRepository] cursosInscritos for UID ${uid} was not an array during update, initializing as empty array.`);
        updateData.cursosInscritos = [];
      }


      await userRef.update(updateData);
      const updatedDocSnap = await userRef.get();
      if (!updatedDocSnap.exists) {
        console.error(`[FirebaseUserRepository] User document disappeared after update for UID: ${uid}`);
        return null;
      }
      console.log(`[FirebaseUserRepository] User updated successfully in Firestore for UID: ${uid} with data:`, JSON.stringify(updateData));
      
      const finalData = updatedDocSnap.data() as UserProperties;
      if (!Array.isArray(finalData.cursosInscritos)) {
        finalData.cursosInscritos = [];
      }
      return new UserEntity(finalData);
    } catch (error: any) {
      const firebaseError = error as FirebaseError;
      console.error(`[FirebaseUserRepository] Error updating user (UID: ${uid}):`, firebaseError.message, firebaseError.code, firebaseError.stack);
      throw new Error(`Firestore update operation failed: ${firebaseError.message}`);
    }
  }

  async delete(uid: string): Promise<void> {
    try {
      await this.usersCollection.doc(uid).delete();
      console.log(`[FirebaseUserRepository] Firestore profile for UID ${uid} deleted.`);
    } catch (error: any) {
      const firebaseError = error as FirebaseError;
      console.error(`[FirebaseUserRepository] Error deleting user (UID: ${uid}):`, firebaseError.message, firebaseError.code, firebaseError.stack);
      throw new Error(`Firestore delete operation failed: ${firebaseError.message}`);
    }
  }

  async addCourseToEnrolled(userId: string, courseId: string): Promise<void> {
    console.log(`[FirebaseUserRepository] Attempting to add Course ID: '${courseId}' to User ID: '${userId}' enrolled courses (cursosInscritos).`);
    try {
        const userRef = this.usersCollection.doc(userId);
        await userRef.update({
            cursosInscritos: FieldValue.arrayUnion(courseId),
            updatedAt: new Date().toISOString()
        });
        console.log(`[FirebaseUserRepository] Firestore update called for user '${userId}' to add course '${courseId}'.`);

        // Verification step
        const updatedUserSnap = await userRef.get();
        const updatedUserData = updatedUserSnap.data() as UserProperties | undefined;

        if (updatedUserData && Array.isArray(updatedUserData.cursosInscritos) && updatedUserData.cursosInscritos.includes(courseId)) {
            console.log(`[FirebaseUserRepository] SUCCESS: Course ID '${courseId}' confirmed in user '${userId}' enrolled courses after update.`);
        } else {
            console.error(`[FirebaseUserRepository] CRITICAL: Firestore update for cursosInscritos DID NOT PERSIST or was not found for user ${userId}, course ${courseId}. Current cursosInscritos: ${JSON.stringify(updatedUserData?.cursosInscritos)}`);
            throw new Error(`[FirebaseUserRepository] CRITICAL: Firestore update for cursosInscritos DID NOT PERSIST for user ${userId}, course ${courseId}. Array is: ${JSON.stringify(updatedUserData?.cursosInscritos)}`);
        }

    } catch (error: any) {
        const firebaseError = error as FirebaseError;
        console.error(`[FirebaseUserRepository] ERROR adding course '${courseId}' to user '${userId}':`, firebaseError.message, firebaseError.stack);
        throw new Error(`Firestore addCourseToEnrolled operation failed: ${firebaseError.message}`);
    }
  }

  async findUserWithEnrolledCoursesAndProgress(uid: string): Promise<UserWithEnrolledCourses | null> {
    if (!adminDb) {
      throw new Error('Firebase Admin SDK (adminDb) not initialized.');
    }
    try {
      const userDocRef = this.usersCollection.doc(uid);
      const userDocSnap = await userDocRef.get();

      if (!userDocSnap.exists) {
        console.log(`[FirebaseUserRepository] User not found for UID: ${uid}`);
        return null;
      }

      const userData = userDocSnap.data() as UserProperties;
      if (!Array.isArray(userData.cursosInscritos)) {
        userData.cursosInscritos = []; // Ensure it's an array before creating entity
      }
      const userEntity = new UserEntity(userData);
      
      const enrolledCourseIds: string[] = userEntity.cursosInscritos || [];
      const enrolledCoursesDetails: EnrolledCourseWithProgress[] = [];

      if (enrolledCourseIds.length > 0) {
        const coursePromises = enrolledCourseIds.map(courseId =>
          adminDb.collection(COURSES_COLLECTION).doc(courseId).get()
        );
        const courseSnapshots = await Promise.all(coursePromises);

        const progressPromises = enrolledCourseIds.map(courseId =>
          userDocRef.collection(PROGRESS_SUBCOLLECTION).doc(courseId).get()
        );
        const progressSnapshots = await Promise.all(progressPromises);

        courseSnapshots.forEach((courseSnap, index) => {
          if (courseSnap.exists) {
            const courseData = courseSnap.data() as CourseProperties;
            const progressSnap = progressSnapshots[index];
            let courseDetail: EnrolledCourseWithProgress = { ...courseData };
            if (progressSnap.exists) {
              courseDetail.progress = progressSnap.data() as UserCourseProgressProperties;
            } else {
              courseDetail.progress = { 
                userId: uid, 
                courseId: courseData.id, 
                lessonIdsCompletadas: [], 
                porcentajeCompletado: 0, 
                fechaUltimaActualizacion: new Date().toISOString()
              };
            }
            enrolledCoursesDetails.push(courseDetail);
          } else {
            console.warn(`[FirebaseUserRepository] Course with ID ${enrolledCourseIds[index]} not found, but user ${uid} is enrolled.`);
          }
        });
      }
      
      const userEntityPlain = userEntity.toPlainObject();
      if (!Array.isArray(userEntityPlain.cursosInscritos)) {
          userEntityPlain.cursosInscritos = [];
      }
      return { ...userEntityPlain, enrolledCoursesDetails } as UserWithEnrolledCourses;

    } catch (error: any) {
      const firebaseError = error as FirebaseError;
      console.error(`[FirebaseUserRepository] Error in findUserWithEnrolledCoursesAndProgress for UID (${uid}):`, firebaseError.message);
      throw new Error(`Firestore findUserWithEnrolledCoursesAndProgress operation failed: ${firebaseError.message}`);
    }
  }
}
