'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  getUploadUrl,
  uploadFileToStorage,
  createMaterialRecord,
  listMaterials,
  deleteMaterial,
  MaterialPersistence as MaterialType,
  GetUploadUrlDTO,
  CreateMaterialDTO,
  ListMaterialsByLessonDTO,
  DeleteMaterialDTO
} from '@/lib/materialApi';
import type { LessonRecord as LessonType } from '@/lib/lessonApi';
import type { Module } from '@/lib/moduleApi';

import styles from '../styles/MaterialManager.module.scss';

interface MaterialManagerProps {
  courseId: string;
  lessons: LessonType[];
  modules: Module[];
  onAddMaterial: (material: MaterialType) => void;
  onBack: () => void;
  onNext: () => void;
}

export default function MaterialManager({
  courseId,
  lessons,
  modules,
  onAddMaterial,
  onBack,
  onNext,
}: MaterialManagerProps) {
  const { token } = useAuth();
  const [selectedLesson, setSelectedLesson] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [type, setType] = useState<'video'|'audio'|'pdf'|'image'>('video');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<MaterialType[]>([]);

  useEffect(() => {
    if (!selectedLesson) {
      setItems([]);
      return;
    }
    const lesson = lessons.find(l => l.id === selectedLesson);
    if (!lesson) {
      setItems([]);
      return;
    }
    // Asegúrate de que el token esté disponible antes de hacer la llamada
    if (!token) {
        setError("Autenticación requerida para listar materiales.");
        return;
    }
    const dto: ListMaterialsByLessonDTO = {
      courseId,
      moduleId: lesson.moduleId,
      lessonId: selectedLesson,
    };
    listMaterials(dto, token)
      .then(fetched => setItems(fetched))
      .catch(err => {
        console.error("Error al listar materiales:", err);
        setError(err.message || "Error al cargar los materiales.");
      });
  }, [selectedLesson, lessons, courseId, token]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const f = e.target.files?.[0] ?? null;
    setFile(f);
  };

  const handleUpload = async () => {
    if (!selectedLesson || !file) {
      setError('Por favor, selecciona una lección y un archivo para subir.');
      return;
    }
    if (!token) {
        setError("Autenticación requerida para subir material.");
        return;
    }

    const lesson = lessons.find(l => l.id === selectedLesson)!;
    setUploading(true);
    setError(null);

    try {
      const dtoUrl: GetUploadUrlDTO = {
        lessonId: selectedLesson,
        fileName: file.name,
        contentType: file.type,
      };
      const { uploadUrl, downloadUrl } = await getUploadUrl(dtoUrl, token);

      await uploadFileToStorage(uploadUrl, file);

      const dtoCreate: CreateMaterialDTO = {
        courseId,
        moduleId: lesson.moduleId,
        lessonId: selectedLesson,
        type,
        url: downloadUrl,
        metadata: { size: file.size, mimeType: file.type },
      };
      const { id } = await createMaterialRecord(dtoCreate, token);

      const newMat: MaterialType = {
        id,
        ...dtoCreate,
        createdAt: new Date().toISOString(),
      };
      setItems(prev => [...prev, newMat]);
      onAddMaterial(newMat);
      setFile(null); // Limpiar el input de archivo
      // Opcional: Mostrar un mensaje de éxito
    } catch (err: any) {
      console.error('Error al subir material:', err);
      setError(err.message || 'Error al subir material. Inténtalo de nuevo.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este material? Esta acción no se puede deshacer.')) return;
    if (!token) {
        setError("Autenticación requerida para eliminar material.");
        return;
    }

    setUploading(true); // Usar 'uploading' para indicar cualquier operación de red
    setError(null);
    try {
      const lesson = lessons.find(l => l.id === selectedLesson)!;
      const dto: DeleteMaterialDTO = {
        courseId,
        moduleId: lesson.moduleId,
        lessonId: selectedLesson,
        materialId: id,
      };
      await deleteMaterial(dto, token);
      setItems(prev => prev.filter(m => m.id !== id));
      // Opcional: Mostrar un mensaje de éxito
    } catch (err: any) {
      console.error('Error al eliminar material:', err);
      setError(err.message || 'Error al eliminar material. Por favor, inténtalo de nuevo.');
    } finally {
      setUploading(false);
    }
  };

  // Función auxiliar para extraer el nombre del archivo de la URL
  const getFileNameFromUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      // Decodificar el componente del path para manejar espacios y caracteres especiales
      const decodedPath = decodeURIComponent(urlObj.pathname);
      const parts = decodedPath.split('/');
      return parts[parts.length - 1] || 'Archivo sin nombre';
    } catch (e) {
      return url; // Fallback si la URL no es válida
    }
  };


  return (
    <div className={styles.materialManager}>
      <h3 className={styles.sectionTitle}>Gestión de Materiales del Curso</h3>
        
      {/* Selector de Lección */}
      <div className={styles.formGroup}>
        <label htmlFor="lessonSelect" className={styles.formLabel}>Lección asociada</label>
        <select
          id="lessonSelect"
          className={styles.formSelect} 
          value={selectedLesson}
          onChange={e => setSelectedLesson(e.target.value)}
          disabled={uploading}
        >
          <option value="">-- Selecciona una lección --</option>
          {lessons.map(l => {
            const mod = modules.find(m => m.id === l.moduleId);
            const modTitle = mod ? mod.title : 'Módulo Desconocido';
            return (
              <option key={l.id} value={l.id}>
                {l.title} (Módulo: {modTitle})
              </option>
            );
          })}
        </select>
        {lessons.length === 0 && (
            <p className={styles.hintMessage}>
                No hay lecciones creadas para este curso. Por favor, ve al paso anterior para añadir lecciones.
            </p>
        )}
      </div>

      {/* Subida de Material */}
      {selectedLesson && (
        <div className={styles.formCard}>
            <h4 className={styles.subsectionTitle}>Subir Nuevo Material</h4>
            <div className={styles.formGrid}> 
                <div className={styles.formGroup}>
                    <label htmlFor="materialType" className={styles.formLabel}>Tipo de Material</label>
                    <select
                        id="materialType"
                        className={styles.formSelect}
                        value={type}
                        onChange={e => setType(e.target.value as any)}
                        disabled={uploading}
                    >
                        <option value="video">Video</option>
                        <option value="audio">Audio</option>
                        <option value="pdf">PDF</option>
                        <option value="image">Imagen</option>
                    </select>
                </div>
                <div className={`${styles.formGroup} ${styles.colSpan2}`}>
                    <label htmlFor="materialFile" className={styles.formLabel}>Seleccionar Archivo</label>
                    <input
                        id="materialFile"
                        type="file"
                        className={styles.formControl}
                        onChange={handleFileChange}
                        disabled={uploading}
                    />
                    {file && <p className={styles.fileNamePreview}>Archivo seleccionado: <strong>{file.name}</strong></p>}
                </div>
                <div className={styles.uploadButtonContainer}>
                    <button
                        className={styles.buttonPrimary}
                        onClick={handleUpload}
                        disabled={uploading || !file}
                    >
                        {uploading ? (
                            <>
                                <span className={styles.spinner} /> Subiendo...
                            </>
                        ) : (
                            <>
                                Subir Material
                            </>
                        )}
                    </button>
                </div>
            </div>
            {error && <div className={styles.errorMessage}>{error}</div>}
        </div>
      )}

      {/* Lista de Materiales */}
      <div className={styles.materialsListContainer}>
        <h4 className={styles.subsectionTitle}>Materiales de la Lección Seleccionada</h4>
        {selectedLesson ? (
            items.length === 0 ? (
                <p className={styles.emptyState}>No hay materiales subidos para esta lección.</p>
            ) : (
                <ul className={styles.materialsList}>
                    {items.map(m => (
                        <li
                            key={m.id}
                            className={styles.materialItem}
                        >
                            <a href={m.url} target="_blank" rel="noopener noreferrer" className={styles.materialLink}>
                                <span className={styles.materialTypeBadge}>{m.type}</span> 
                                <span className={styles.materialFileName}>{getFileNameFromUrl(m.url)}</span>
                            </a>
                            <button
                                className={styles.actionButtonDelete}
                                onClick={() => handleDelete(m.id)}
                                disabled={uploading}
                            >
                                Eliminar
                            </button>
                        </li>
                    ))}
                </ul>
            )
        ) : (
            <p className={styles.emptyState}>Por favor, selecciona una lección para ver o añadir sus materiales.</p>
        )}
      </div>

      {/* Navegación */}
      <div className={styles.formActions}>
        <button className={styles.buttonSecondary} onClick={onBack} disabled={uploading}>
            Atrás
        </button>
        <button
          className={`${styles.buttonPrimary} ${styles.buttonNext}`}
          onClick={onNext}
          /* disabled={uploading || (selectedLesson && items.length === 0)} */
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}