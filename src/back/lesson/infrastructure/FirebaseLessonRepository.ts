// src/back/lesson/infrastructure/FirebaseLessonRepository.ts

import admin from '@back/share/firebase/FirebaseClient';
import { ILessonRepository } from '../domain/ILessonRepository';
import { Lesson, LessonPersistence } from '../domain/Lesson';
import {
  CreateLessonDTO,
  GetLessonByIdDTO,
  ListLessonsByModuleDTO,
  DeleteLessonDTO
} from '../application/dto';
import { UniqueEntityID } from '../../share/utils/UniqueEntityID';

export class FirebaseLessonRepository implements ILessonRepository {
  private db = admin.firestore();

  /**
   * Guarda (crea o actualiza) la lección en su ruta:
   * courses/{courseId}/modules/{moduleId}/lessons/{lessonId}
   */
  public async save(lesson: Lesson): Promise<void> {
    const persistence = lesson.toPersistence();
    const { courseId, moduleId } = lesson; // getters expuestos

    const moduleRef = this.db
      .collection('courses')
      .doc(courseId)
      .collection('modules')
      .doc(moduleId);

    await moduleRef
      .collection('lessons')
      .doc(persistence.id)
      .set(persistence as FirebaseFirestore.DocumentData);
  }

  /**
   * Recupera una lección por IDs, sin usar collectionGroup.
   */
  public async findById(dto: GetLessonByIdDTO): Promise<Lesson | null> {
    const { courseId, moduleId, lessonId } = dto;
    const doc = await this.db
      .collection('courses')
      .doc(courseId)
      .collection('modules')
      .doc(moduleId)
      .collection('lessons')
      .doc(lessonId)
      .get();

    if (!doc.exists) return null;
    const data = doc.data() as LessonPersistence;
    return Lesson.fromPersistence(data);
  }

  /**
   * Lista todas las lecciones de un módulo ordenadas por 'order'.
   */
  public async findAllByModule(dto: ListLessonsByModuleDTO): Promise<Lesson[]> {
    const { courseId, moduleId } = dto;
    const snap = await this.db
      .collection('courses')
      .doc(courseId)
      .collection('modules')
      .doc(moduleId)
      .collection('lessons')
      .orderBy('order')
      .get();

    return snap.docs
      .map(d => d.data() as LessonPersistence)
      .map(Lesson.fromPersistence);
  }

  /**
   * Elimina una lección por su ruta completa.
   */
  public async delete(dto: DeleteLessonDTO): Promise<void> {
    const { courseId, moduleId, lessonId } = dto;
    await this.db
      .collection('courses')
      .doc(courseId)
      .collection('modules')
      .doc(moduleId)
      .collection('lessons')
      .doc(lessonId)
      .delete();
  }
}
