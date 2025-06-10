
// src/features/user/infrastructure/repositories/firebase-user.repository.ts
import type { IUserRepository } from '@/features/user/domain/repositories/user.repository';
import type { UserEntity, UserProperties } from '@/features/user/domain/entities/user.entity';
import { adminDb } from '@/lib/firebase/admin';

const USERS_COLLECTION = 'usuarios';

export class FirebaseUserRepository implements IUserRepository {
  private get usersCollection() {
    if (!adminDb) {
      throw new Error('Firebase Admin SDK (adminDb) not initialized.');
    }
    return adminDb.collection(USERS_COLLECTION);
  }

  async save(user: UserEntity): Promise<void> {
    const userData: UserProperties = {
      uid: user.uid,
      email: user.email,
      nombre: user.nombre,
      apellido: user.apellido,
      displayName: user.displayName,
      role: user.role,
      photoURL: user.photoURL,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt?.toISOString(),
      referralCodeGenerated: user.referralCodeGenerated,
      referredBy: user.referredBy,
      cursosComprados: user.cursosComprados,
      referidosExitosos: user.referidosExitosos,
      balanceCredito: user.balanceCredito,
    };
    await this.usersCollection.doc(user.uid).set(userData, { merge: true });
  }

  async findByUid(uid: string): Promise<UserEntity | null> {
    const docSnap = await this.usersCollection.doc(uid).get();
    if (!docSnap.exists) {
      return null;
    }
    return new UserEntity(docSnap.data() as UserProperties);
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const snapshot = await this.usersCollection.where('email', '==', email).limit(1).get();
    if (snapshot.empty) {
      return null;
    }
    return new UserEntity(snapshot.docs[0].data() as UserProperties);
  }

  async update(uid: string, data: Partial<Omit<UserProperties, 'uid' | 'email' | 'createdAt'>>): Promise<UserEntity | null> {
    const userRef = this.usersCollection.doc(uid);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      console.warn(\`[FirebaseUserRepository] User with UID \${uid} not found for update.\`);
      return null;
    }

    const updateData = { ...data, updatedAt: new Date().toISOString() };
    if (data.nombre || data.apellido) {
        const currentData = userSnap.data() as UserProperties;
        const nombre = data.nombre || currentData.nombre;
        const apellido = data.apellido || currentData.apellido;
        updateData.displayName = \`\${nombre} \${apellido}\`;
    }

    await userRef.update(updateData);
    const updatedDoc = await userRef.get();
    return new UserEntity(updatedDoc.data() as UserProperties);
  }

  async delete(uid: string): Promise<void> {
    // Note: Firebase Auth user deletion must be handled separately (typically via Admin SDK Auth)
    // This only deletes the Firestore profile document.
    // Consider a flag 'deletedAt' for soft deletes instead of hard deletes.
    await this.usersCollection.doc(uid).delete();
    console.log(\`[FirebaseUserRepository] Firestore profile for UID \${uid} deleted.\`);
  }
}
