// src/back/material/domain/IMaterialRepository.ts

import { Material } from './Material';
import { GetUploadUrlDTO, CreateMaterialDTO,
         GetMaterialByIdDTO, ListMaterialsByLessonDTO,
         UpdateMaterialDTO, DeleteMaterialDTO }
  from '../application/dto';

export interface IMaterialRepository {
  /**
   * Solicita un par de URLs firmadas para subir/descargar.
   */
  getUploadUrl(
    dto: GetUploadUrlDTO
  ): Promise<{ uploadUrl: string; downloadUrl: string; path: string }>;

  /**
   * Persiste (create/update) un material en Firestore.
   */
  save(material: Material): Promise<void>;

  /**
   * Recupera un material por su ruta completa.
   */
  findById(dto: GetMaterialByIdDTO): Promise<Material | null>;

  /**
   * Lista todos los materiales de una lección.
   */
  findAllByLesson(dto: ListMaterialsByLessonDTO): Promise<Material[]>;

  /**
   * Elimina un material (solo en Firestore).
   */
  delete(dto: DeleteMaterialDTO): Promise<void>;
}
