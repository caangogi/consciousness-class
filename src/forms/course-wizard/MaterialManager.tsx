// src/components/MaterialManager.tsx
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

  // Cuando cambia la lección, obtenemos moduleId y fetch de materiales
  useEffect(() => {
    if (!selectedLesson) return;
    const lesson = lessons.find(l => l.id === selectedLesson);
    if (!lesson) return;
    const dto: ListMaterialsByLessonDTO = {
      courseId,
      moduleId: lesson.moduleId,
      lessonId: selectedLesson,
    };
    listMaterials(dto, token!)
      .then(fetched => setItems(fetched))
      .catch(err => setError(err.message));
  }, [selectedLesson, lessons, courseId, token]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const f = e.target.files?.[0] ?? null;
    setFile(f);
  };

  const handleUpload = async () => {
    if (!selectedLesson || !file) {
      setError('Selecciona lección y fichero');
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
      const { uploadUrl, downloadUrl, path } = await getUploadUrl(dtoUrl, token!);

      await uploadFileToStorage(uploadUrl, file);

      const dtoCreate: CreateMaterialDTO = {
        courseId,
        moduleId: lesson.moduleId,
        lessonId: selectedLesson,
        type,
        url: downloadUrl,
        metadata: { size: file.size, mimeType: file.type },
      };
      const { id } = await createMaterialRecord(dtoCreate, token!);

      const newMat: MaterialType = {
        id,
        ...dtoCreate,
        createdAt: new Date().toISOString(),
      };
      setItems(prev => [...prev, newMat]);
      onAddMaterial(newMat);
      setFile(null);
    } catch (err: any) {
      setError(err.message || 'Error al subir material');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este material?')) return;
    try {
      const lesson = lessons.find(l => l.id === selectedLesson)!;
      const dto: DeleteMaterialDTO = {
        courseId,
        moduleId: lesson.moduleId,
        lessonId: selectedLesson,
        materialId: id,
      };
      await deleteMaterial(dto, token!);
      setItems(prev => prev.filter(m => m.id !== id));
    } catch (err: any) {
      setError(err.message || 'Error al eliminar material');
    }
  };

  return (
    <div className="container py-4">
      <h3 className="mb-4">Gestión de Materiales</h3>
        
      {/* Selector de Lección */}
      <div className="mb-3">
        <label htmlFor="lessonSelect" className="form-label">Lección</label>
        <select
          id="lessonSelect"
          className="form-select" 
          value={selectedLesson}
          onChange={e => setSelectedLesson(e.target.value)}
        >
              <option value="">-- Selecciona lección --</option>
              {lessons.map(l => {
                // Buscamos el módulo de esta lección
                const mod = modules.find(m => m.id === l.moduleId);
                const modTitle = mod ? mod.title : '—';
                return (
                  <option key={l.id} value={l.id}>
                    {l.title} (Módulo: {modTitle})
                  </option>
                );
              })}
          </select>
      </div>

      {/* Subida de Material */}
      {selectedLesson && (
        <div className="card mb-4 p-3">
          <div className="row g-3">  
            <div className="col-md-4">
              <label className="form-label">Tipo</label>
              <select
                className="form-select"
                value={type}
                onChange={e => setType(e.target.value as any)}
              >
                <option value="video">Video</option>
                <option value="audio">Audio</option>
                <option value="pdf">PDF</option>
                <option value="image">Imagen</option>
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label">Archivo</label>
              <input
                type="file"
                className="form-control"
                onChange={handleFileChange}
              />
            </div>
            <div className="col-md-2 d-flex align-items-end">
              <button
                className="btn btn-primary w-100"
                onClick={handleUpload}
                disabled={uploading || !file}
              >
                {uploading
                  ? <span className="spinner-border spinner-border-sm" />
                  : 'Subir'}
              </button>
            </div>
          </div>
          {error && <div className="alert alert-danger mt-3">{error}</div>}
        </div>
      )}

      {/* Lista de Materiales */}
      <div className="mb-4">
        {items.length === 0
          ? <p className="text-muted">No hay materiales.</p>
          : (
            <ul className="list-group">
              {items.map(m => (
                <li
                  key={m.id}
                  className="list-group-item d-flex justify-content-between align-items-center"
                >
                  <a href={m.url} target="_blank" className="link-primary">
                    [{m.type.toUpperCase()}] {m.url.split('/').pop()}
                  </a>
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => handleDelete(m.id)}
                  >
                    Eliminar
                  </button>
                </li>
              ))}
            </ul>
          )}
      </div>

      {/* Navegación */}
      <div className="d-flex justify-content-between">
        <button className="btn btn-secondary" onClick={onBack}>Atrás</button>
        <button
          className="btn btn-success"
          onClick={onNext}
          disabled={items.length === 0}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
