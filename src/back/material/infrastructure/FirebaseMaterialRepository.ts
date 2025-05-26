// src/back/material/infrastructure/FirebaseMaterialRepository.ts

import admin from '@back/share/firebase/FirebaseClient';
import { IMaterialRepository } from '../domain/IMaterialRepository';
import { Material, MaterialPersistence } from '../domain/Material';
import {
  GetUploadUrlDTO,
  CreateMaterialDTO,
  GetMaterialByIdDTO,
  ListMaterialsByLessonDTO,
  DeleteMaterialDTO
} from '../application/dto';
import { Storage } from '@google-cloud/storage';

export class FirebaseMaterialRepository implements IMaterialRepository {
  private db = admin.firestore();
  private bucket = admin.storage().bucket();

  /** Genera signed URLs para subir y descargar un fichero en Storage */
  public async getUploadUrl(
    dto: GetUploadUrlDTO
  ): Promise<{ uploadUrl: string; downloadUrl: string; path: string }> {
    const { lessonId, fileName, contentType } = dto;
    const path = `materials/${lessonId}/${Date.now()}_${fileName}`;
    const file = this.bucket.file(path);

    // URL para escritura (PUT)
    const [uploadUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + 15 * 60 * 1000,
      contentType,
    });

    // URL para lectura (GET)
    const [downloadUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 24 * 60 * 60 * 1000,
    });

    return { uploadUrl, downloadUrl, path };
  }

  /** Persiste un nuevo material (referencia + metadatos) */
  public async save(material: Material): Promise<void> {
    const p = material.toPersistence();
    const { courseId, moduleId, lessonId } = material;

    const materialsRef = this.db
      .collection('courses').doc(courseId)
      .collection('modules').doc(moduleId)
      .collection('lessons').doc(lessonId)
      .collection('materials');

    await materialsRef
      .doc(p.id)
      .set(p as FirebaseFirestore.DocumentData);
  }

  /** Recupera un material por su ruta completa */
  public async findById(
    dto: GetMaterialByIdDTO
  ): Promise<Material | null> {
    const { courseId, moduleId, lessonId, materialId } = dto;
    const docSnap = await this.db
      .collection('courses').doc(courseId)
      .collection('modules').doc(moduleId)
      .collection('lessons').doc(lessonId)
      .collection('materials').doc(materialId)
      .get();

    if (!docSnap.exists) return null;
    const data = docSnap.data() as MaterialPersistence;
    return Material.fromPersistence(data);
  }

  /** Lista todos los materiales de una lección, ordenados por creación */
  public async findAllByLesson(
    dto: ListMaterialsByLessonDTO
  ): Promise<Material[]> {
    const { courseId, moduleId, lessonId } = dto;
    const snap = await this.db
      .collection('courses').doc(courseId)
      .collection('modules').doc(moduleId)
      .collection('lessons').doc(lessonId)
      .collection('materials')
      .orderBy('createdAt')
      .get();

    return snap.docs
      .map(d => d.data() as MaterialPersistence)
      .map(Material.fromPersistence);
  }

  /** Elimina un material (solo Firestore) por su ruta completa */
  public async delete(dto: DeleteMaterialDTO): Promise<void> {
    const { courseId, moduleId, lessonId, materialId } = dto;
    await this.db
      .collection('courses').doc(courseId)
      .collection('modules').doc(moduleId)
      .collection('lessons').doc(lessonId)
      .collection('materials').doc(materialId)
      .delete();
  }
}
