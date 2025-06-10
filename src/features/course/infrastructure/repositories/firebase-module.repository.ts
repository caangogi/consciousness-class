// src/features/course/infrastructure/repositories/firebase-module.repository.ts
import type { IModuleRepository } from '@/features/course/domain/repositories/module.repository';
import { ModuleEntity, type ModuleProperties } from '@/features/course/domain/entities/module.entity';
import { adminDb } from '@/lib/firebase/admin';
import type { FirebaseError } from 'firebase-admin';

const COURSES_COLLECTION = 'cursos';
const MODULES_SUBCOLLECTION = 'modulos';
const LESSONS_SUBCOLLECTION = 'lecciones';

export class FirebaseModuleRepository implements IModuleRepository {
  private getModulesCollection(courseId: string) {
    if (!adminDb) {
      throw new Error('Firebase Admin SDK (adminDb) not initialized.');
    }
    return adminDb.collection(COURSES_COLLECTION).doc(courseId).collection(MODULES_SUBCOLLECTION);
  }

  private getLessonsCollection(courseId: string, moduleId: string) {
    if (!adminDb) {
      throw new Error('Firebase Admin SDK (adminDb) not initialized.');
    }
    return this.getModulesCollection(courseId).doc(moduleId).collection(LESSONS_SUBCOLLECTION);
  }

  async save(module: ModuleEntity): Promise<void> {
    try {
      const moduleData = module.toPlainObject();
      await this.getModulesCollection(module.courseId).doc(module.id).set(moduleData, { merge: true });
      console.log(`[FirebaseModuleRepository] Module saved/updated successfully for Course ID: ${module.courseId}, Module ID: ${module.id}`);
    } catch (error: any) {
      const firebaseError = error as FirebaseError;
      console.error(`[FirebaseModuleRepository] Error saving module (Course ID: ${module.courseId}, Module ID: ${module.id}):`, firebaseError.message);
      throw new Error(`Firestore save operation for module failed: ${firebaseError.message}`);
    }
  }

  async findById(courseId: string, moduleId: string): Promise<ModuleEntity | null> {
    try {
      const docSnap = await this.getModulesCollection(courseId).doc(moduleId).get();
      if (!docSnap.exists) {
        console.log(`[FirebaseModuleRepository] Module not found for Course ID: ${courseId}, Module ID: ${moduleId}`);
        return null;
      }
      return new ModuleEntity(docSnap.data() as ModuleProperties);
    } catch (error: any) {
      const firebaseError = error as FirebaseError;
      console.error(`[FirebaseModuleRepository] Error finding module by ID (Course ID: ${courseId}, Module ID: ${moduleId}):`, firebaseError.message);
      throw new Error(`Firestore findById operation for module failed: ${firebaseError.message}`);
    }
  }

  async findAllByCourseId(courseId: string): Promise<ModuleEntity[]> {
    try {
      const snapshot = await this.getModulesCollection(courseId).orderBy('orden', 'asc').get();
      if (snapshot.empty) {
        return [];
      }
      return snapshot.docs.map(doc => new ModuleEntity(doc.data() as ModuleProperties));
    } catch (error: any) {
      const firebaseError = error as FirebaseError;
      console.error(`[FirebaseModuleRepository] Error finding modules by Course ID (${courseId}):`, firebaseError.message);
      throw new Error(`Firestore findAllByCourseId operation for module failed: ${firebaseError.message}`);
    }
  }

  async delete(courseId: string, moduleId: string): Promise<void> {
    try {
      const lessonsCollectionRef = this.getLessonsCollection(courseId, moduleId);
      const lessonsSnapshot = await lessonsCollectionRef.get();
      
      const batch = adminDb!.batch(); // adminDb is checked in getModulesCollection
      lessonsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      console.log(`[FirebaseModuleRepository] All lessons in module ${moduleId} of course ${courseId} deleted.`);

      await this.getModulesCollection(courseId).doc(moduleId).delete();
      console.log(`[FirebaseModuleRepository] Module deleted successfully. Course ID: ${courseId}, Module ID: ${moduleId}`);
    } catch (error: any) {
      const firebaseError = error as FirebaseError;
      console.error(`[FirebaseModuleRepository] Error deleting module (Course ID: ${courseId}, Module ID: ${moduleId}):`, firebaseError.message);
      throw new Error(`Firestore delete operation for module failed: ${firebaseError.message}`);
    }
  }

  async update(courseId: string, moduleId: string, data: Partial<Omit<ModuleProperties, 'id' | 'courseId' | 'fechaCreacion' | 'ordenLecciones'>>): Promise<ModuleEntity | null> {
    try {
      const moduleRef = this.getModulesCollection(courseId).doc(moduleId);
      const moduleSnap = await moduleRef.get();
      if (!moduleSnap.exists) {
        console.warn(`[FirebaseModuleRepository] Module with ID ${moduleId} not found in course ${courseId} for update.`);
        return null;
      }
      const updateData = { ...data, fechaActualizacion: new Date().toISOString() };
      await moduleRef.update(updateData);
      const updatedDocSnap = await moduleRef.get();
      if (!updatedDocSnap.exists) {
        return null;
      }
      console.log(`[FirebaseModuleRepository] Module ${moduleId} updated successfully in course ${courseId}.`);
      return new ModuleEntity(updatedDocSnap.data() as ModuleProperties);
    } catch (error: any) {
      const firebaseError = error as FirebaseError;
      console.error(`[FirebaseModuleRepository] Error updating module (ID: ${moduleId}):`, firebaseError.message);
      throw new Error(`Firestore update operation for module failed: ${firebaseError.message}`);
    }
  }
}
