import admin from '@back/share/firebase/FirebaseClient';
import { IUserRepository } from '../domain/IUserRepository';
import { User, UserPersistence } from '../domain/User';
import { UniqueEntityID } from '@back/share/utils/UniqueEntityID';
import { CreateUserDTO } from '../application/dto/CreateUserDTO';

export class FirebaseUserRepository implements IUserRepository {
    private auth = admin.auth();
    private db = admin.firestore();
  
    async create(dto: CreateUserDTO): Promise<User> {
      // 1. Crear en Firebase Auth
      const userRecord = await this.auth.createUser({
        email: dto.email,
        password: dto.password,
        displayName: dto.displayName,
      });
  
      // 2. Construir entidad
      const result = User.create(
        { email: userRecord.email!, displayName: userRecord.displayName || '', role: dto.role },
        new UniqueEntityID(userRecord.uid)
      );
      if (result.isFailure) {
        throw result.error;
      }
      const user = result.getValue();
      const persistence = user.toPersistence();
  
      // 3. Guardar perfil en Firestore
      await this.db.collection('users').doc(persistence.id).set(persistence as FirebaseFirestore.DocumentData);
      return user;
    }
  
    async findById(id: UniqueEntityID): Promise<User | null> {
      const snap = await this.db.collection('users').doc(id.toString()).get();
      if (!snap.exists) return null;
      const data = snap.data() as UserPersistence;
      return User.fromPersistence(data);
    }
  
    async findByEmail(email: string): Promise<User | null> {
      const query = await this.db.collection('users').where('email', '==', email).limit(1).get();
      if (query.empty) return null;
      const data = query.docs[0].data() as UserPersistence;
      return User.fromPersistence(data);
    }
  
    async update(user: User): Promise<void> {
      const persistence = user.toPersistence();
      await this.db.collection('users').doc(persistence.id).update(persistence as FirebaseFirestore.DocumentData);
    }
  
    async delete(id: UniqueEntityID): Promise<void> {
      await this.auth.deleteUser(id.toString());
      await this.db.collection('users').doc(id.toString()).delete();
    }
  }