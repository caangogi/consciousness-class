
// src/features/user/infrastructure/repositories/firebase-user.repository.ts
import type { IUserRepository } from '@/features/user/domain/repositories/user.repository';
import { UserEntity, type UserProperties } from '@/features/user/domain/entities/user.entity';
import { adminDb } from '@/lib/firebase/admin';
import type { FirebaseError } from 'firebase-admin';

const USERS_COLLECTION = 'usuarios';

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
      return new UserEntity(docSnap.data() as UserProperties);
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
      return new UserEntity(snapshot.docs[0].data() as UserProperties);
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

      // Ensure `updatedAt` is always set
      const updateData: any = { ...data, updatedAt: new Date().toISOString() };
      
      // If nombre or apellido are part of 'data', or if they already exist and one is changing, recalculate displayName
      const currentData = userSnap.data() as UserProperties;
      const newNombre = data.nombre !== undefined ? data.nombre : currentData.nombre;
      const newApellido = data.apellido !== undefined ? data.apellido : currentData.apellido;

      if (data.nombre !== undefined || data.apellido !== undefined) {
          updateData.displayName = `${newNombre} ${newApellido}`.trim();
      }
      
      // Explicitly handle photoURL to allow setting it to null
      if (data.photoURL !== undefined) {
        updateData.photoURL = data.photoURL;
      } else if (data.hasOwnProperty('photoURL') && data.photoURL === null) {
         updateData.photoURL = null; // Ensure null is passed if explicitly provided
      }


      await userRef.update(updateData);
      const updatedDocSnap = await userRef.get();
      if (!updatedDocSnap.exists) {
        // Should not happen if update was successful
        console.error(`[FirebaseUserRepository] User document disappeared after update for UID: ${uid}`);
        return null;
      }
      console.log(`[FirebaseUserRepository] User updated successfully in Firestore for UID: ${uid} with data:`, JSON.stringify(updateData));
      return new UserEntity(updatedDocSnap.data() as UserProperties);
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
}

