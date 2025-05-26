'use client';

import React from 'react';
import type { Course } from '@/lib/courseApi';
import type { Module } from '@/lib/moduleApi';
import type { LessonRecord as Lesson } from '@/lib/lessonApi';
import type { MaterialPersistence as Material } from '@/lib/materialApi';

interface ReviewStepProps {
  course: Course;
  modules: Module[];
  lessons: Lesson[];
  materials: Material[];
  onBack: () => void;
  onPublish: () => void;
}

export default function ReviewStep({
  course,
  modules,
  lessons,
  materials,
  onBack,
  onPublish,
}: ReviewStepProps) {
  const handlePublish = () => {
    // Limpiar el wizard guardado
    localStorage.removeItem('wizard');
    onPublish();
  };

  return (
    <div className="container py-4">
      <h2 className="mb-4">Revisión del Curso</h2>

      {/* Datos del Curso */}
      <div className="card mb-4">
        <div className="card-header">
          <h3 className="h5 mb-0">Datos del Curso</h3>
        </div>
        <div className="card-body">
          <p><strong>Título:</strong> {course.title}</p>
          <p><strong>Descripción:</strong> {course.description}</p>
          {course.coverImageUrl && (
            <img
              src={course.coverImageUrl}
              alt="Portada"
              className="img-fluid mb-3"
              style={{ maxHeight: '200px' }}
            />
          )}
          <p><strong>Precio:</strong> ${course.price.toFixed(2)}</p>
          <p><strong>Idioma:</strong> {course.language}</p>
          <p><strong>Nivel:</strong> {course.level}</p>
          { (course.tags ?? []).length > 0 && (
              <p>
                <strong>Etiquetas:</strong> {(course.tags ?? []).join(', ')}
              </p>
            )
          }
        </div>
      </div>

      {/* Estructura de Contenido */}
      <div className="card mb-4">
        <div className="card-header">
          <h3 className="h5 mb-0">Estructura de Contenido</h3>
        </div>
        <div className="card-body">
          {modules.map(mod => (
            <div key={mod.id} className="mb-3">
              <h5 className="mb-2">
                {mod.title} <small className="text-muted">(Orden {mod.order})</small>
              </h5>
              <ul className="list-group">
                {lessons
                  .filter(l => l.moduleId === mod.id)
                  .sort((a, b) => a.order - b.order)
                  .map(l => (
                    <li key={l.id} className="list-group-item">
                      {l.title}
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Materiales Adjuntos */}
      <div className="card mb-4">
        <div className="card-header">
          <h3 className="h5 mb-0">Materiales Adjuntos</h3>
        </div>
        <div className="card-body">
          {materials.length === 0 ? (
            <p className="text-muted">No hay materiales añadidos.</p>
          ) : (
            <ul className="list-group">
              {materials.map(mat => {
                const lesson = lessons.find(l => l.id === mat.lessonId);
                return (
                  <li key={mat.id} className="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                      <strong>{lesson?.title ?? 'Lección'}:</strong>{' '}
                      <span className="badge bg-secondary me-2">{mat.type.toUpperCase()}</span>
                      <a href={mat.url} target="_blank" rel="noopener noreferrer">
                        Ver
                      </a>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Acciones */}
      <div className="d-flex justify-content-between">
        <button className="btn btn-outline-secondary" onClick={onBack}>
          Atrás
        </button>
        <button className="btn btn-success" onClick={handlePublish}>
          Publicar Curso
        </button>
      </div>
    </div>
  );
}
