import admin from '@back/share/firebase/FirebaseClient';
import { IModuleRepository } from '../domain/IModuleRepository';
import { Module, ModulePersistence } from '../domain/Module';
import { UniqueEntityID } from '../../share/utils/UniqueEntityID';

export class FirebaseModuleRepository implements IModuleRepository {
  private db = admin.firestore();

  private modulesCollection(courseId: string) {
    return this.db.collection('courses').doc(courseId).collection('modules');
  }

  public async save(module: Module): Promise<void> {
    const persistence = module.toPersistence();
    await this.modulesCollection(module.courseId)
      .doc(persistence.id)
      .set(persistence as FirebaseFirestore.DocumentData);
  }

  public async findById(id: UniqueEntityID): Promise<Module | null> {
    // Como no sabemos el courseId, hacemos un scan global (no ideal para producción)
    const snapshot = await this.db.collectionGroup('modules')
      .where('id', '==', id.toString())
      .limit(1)
      .get();
    if (snapshot.empty) return null;
    const data = snapshot.docs[0].data() as ModulePersistence;
    return Module.fromPersistence(data);
  }

  public async findAllByCourse(courseId: string): Promise<Module[]> {
    const snap = await this.modulesCollection(courseId)
      .orderBy('order')
      .get();
    return snap.docs
      .map((d) => d.data() as ModulePersistence)
      .map(Module.fromPersistence);
  }

  public async delete(id: UniqueEntityID): Promise<void> {
    // Mismo caso que findById: ubicación desconocida, asumimos courseId en la estructura
    // Si tu use-case siempre proporciona courseId, refactoriza para pasar courseId aquí
    const snapshot = await this.db.collectionGroup('modules')
      .where('id', '==', id.toString())
      .limit(1)
      .get();
    if (snapshot.empty) return;
    await snapshot.docs[0].ref.delete();
  }
}
