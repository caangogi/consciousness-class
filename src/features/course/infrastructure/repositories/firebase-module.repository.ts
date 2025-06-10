// src/features/course/infrastructure/repositories/firebase-module.repository.ts
import type { IModuleRepository } from '@/features/course/domain/repositories/module.repository';
import { ModuleEntity, type ModuleProperties } from '@/features/course/domain/entities/module.entity';
import { adminDb } from '@/lib/firebase/admin';
import type { FirebaseError } from 'firebase-admin';

const COURSES_COLLECTION = 'cursos';
const MODULES_SUBCOLLECTION = 'modulos';

export class FirebaseModuleRepository implements IModuleRepository {
  private getModulesCollection(courseId: string) {
    if (!adminDb) {
      throw new Error('Firebase Admin SDK (adminDb) not initialized.');
    }
    return adminDb.collection(COURSES_COLLECTION).doc(courseId).collection(MODULES_SUBCOLLECTION);
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
      await this.getModulesCollection(courseId).doc(moduleId).delete();
      console.log(`[FirebaseModuleRepository] Module deleted successfully. Course ID: ${courseId}, Module ID: ${moduleId}`);
    } catch (error: any) {
      const firebaseError = error as FirebaseError;
      console.error(`[FirebaseModuleRepository] Error deleting module (Course ID: ${courseId}, Module ID: ${moduleId}):`, firebaseError.message);
      throw new Error(`Firestore delete operation for module failed: ${firebaseError.message}`);
    }
  }
}
