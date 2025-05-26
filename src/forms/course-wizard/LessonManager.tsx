'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  createLesson,
  updateLesson,
  deleteLesson,
  listLessons,
  CreateLessonDTO,
  UpdateLessonDTO,
  LessonRecord as LessonType,
} from '@/lib/lessonApi';
import type { Module } from '@/lib/moduleApi';

interface LessonManagerProps {
  courseId: string;
  modules: Module[];
  lessons: LessonType[];
  onAddLesson: (lesson: LessonType) => void;
  onBack: () => void;
  onNext: () => void;
}

export default function LessonManager({
  courseId,
  modules,
  lessons,
  onAddLesson,
  onBack,
  onNext,
}: LessonManagerProps) {
  const { token } = useAuth();

  // Form state for new lesson
  const [selectedModule, setSelectedModule] = useState('');
  const [title, setTitle] = useState('');
  const [order, setOrder] = useState(0);
  const [overview, setOverview] = useState('');
  const [content, setContent] = useState('');

  // Existing lessons and editing state
  const [items, setItems] = useState<LessonType[]>(lessons);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editOrder, setEditOrder] = useState(0);
  const [editOverview, setEditOverview] = useState('');
  const [editContent, setEditContent] = useState('');

  // Errors and loading
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch lessons for selected module
  useEffect(() => {
    if (!selectedModule) return;
    (async () => {
      setLoading(true);
      try {
        const fetched = await listLessons(selectedModule, token!);
        setItems(fetched);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedModule]);

  // Add new lesson
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!selectedModule) {
      setError('Selecciona un módulo');
      return;
    }
    setLoading(true);
    const dto: CreateLessonDTO = {
      courseId: courseId,
      moduleId: selectedModule,
      title: title.trim(),
      order,
      overview: overview.trim() || undefined,
      content: content.trim(),
      faqs: [],
    };

    console.log('CouserId::: >', courseId )
    console.log('DTO CouserId::: >', dto.courseId )

    try {
      const { id } = await createLesson(dto, token!);
      const newLesson: LessonType = { id, ...dto, createdAt: new Date().toISOString(), updatedAt: undefined };
      setItems(prev => [...prev, newLesson]);
      onAddLesson(newLesson);
      // Reset form
      setTitle(''); setOrder(0); setOverview(''); setContent('');
    } catch (err: any) {
      setError(err.message || 'Error al crear lección');
    } finally {
      setLoading(false);
    }
  };

  // Initialize edit form
  const startEdit = (lesson: LessonType) => {
    setEditingId(lesson.id);
    setEditTitle(lesson.title);
    setEditOrder(lesson.order);
    setEditOverview(lesson.overview || '');
    setEditContent(lesson.content);
    setError(null);
  };

  // Save edit
  const handleSave = async () => {
    if (!editingId) return;
    setError(null);
    setLoading(true);
    const dto: UpdateLessonDTO = {
      lessonId: editingId,
      title: editTitle.trim(),
      content: editContent.trim(),
      overview: editOverview.trim() || undefined,
      faqs: [],
    };
    try {
      await updateLesson(dto, token!);
      setItems(prev => prev.map(l => l.id === editingId ? { ...l, title: dto.title, order: editOrder, overview: dto.overview, content: dto.content } : l));
      setEditingId(null);
    } catch (err: any) {
      setError(err.message || 'Error al actualizar lección');
    } finally {
      setLoading(false);
    }
  };

  // Delete lesson
  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta lección?')) return;
    setLoading(true);
    setError(null);
    try {
      await deleteLesson(id, token!);
      setItems(prev => prev.filter(l => l.id !== id));
    } catch (err: any) {
      setError(err.message || 'Error al eliminar lección');
    } finally {
      setLoading(false);
    }
  };

return (
    <div className="container py-4">
      {/* Título */}
      <h3 className="mb-4">Gestión de Lecciones</h3>

      {/* Selector de Módulo */}
      <div className="mb-3">
        <label htmlFor="moduleSelect" className="form-label">
          Módulo
        </label>
        <select
          id="moduleSelect"
          className="form-select"
          value={selectedModule}
          onChange={e => setSelectedModule(e.target.value)}
          disabled={loading}
        >
          <option value="">-- Selecciona módulo --</option>
          {modules.map(m => (
            <option key={m.id} value={m.id}>
              {m.title}
            </option>
          ))}
        </select>
      </div>

      {/* Formulario de Añadir / Editar */}
      {selectedModule && (
        <form
          onSubmit={
            editingId
              ? e => {
                  e.preventDefault();
                  handleSave();
                }
              : handleAdd
          }
          className="card card-body mb-4"
          noValidate
        >
          <div className="row g-3">
            {/* Título */}
            <div className="col-md-6">
              <label htmlFor="lessonTitle" className="form-label">
                Título
              </label>
              <input
                id="lessonTitle"
                type="text"
                className="form-control"
                value={editingId ? editTitle : title}
                onChange={e =>
                  editingId
                    ? setEditTitle(e.target.value)
                    : setTitle(e.target.value)
                }
                disabled={loading}
                required
              />
            </div>

            {/* Orden */}
            <div className="col-md-2">
              <label htmlFor="lessonOrder" className="form-label">
                Orden
              </label>
              <input
                id="lessonOrder"
                type="number"
                className="form-control"
                value={editingId ? editOrder : order}
                onChange={e =>
                  editingId
                    ? setEditOrder(Number(e.target.value))
                    : setOrder(Number(e.target.value))
                }
                disabled={loading}
                min={0}
                required
              />
            </div>

            {/* Resumen */}
            <div className="col-12">
              <label htmlFor="lessonOverview" className="form-label">
                Resumen
              </label>
              <textarea
                id="lessonOverview"
                rows={2}
                className="form-control"
                value={editingId ? editOverview : overview}
                onChange={e =>
                  editingId
                    ? setEditOverview(e.target.value)
                    : setOverview(e.target.value)
                }
                disabled={loading}
              />
            </div>

            {/* Contenido */}
            <div className="col-12">
              <label htmlFor="lessonContent" className="form-label">
                Contenido
              </label>
              <textarea
                id="lessonContent"
                rows={6}
                className="form-control"
                value={editingId ? editContent : content}
                onChange={e =>
                  editingId
                    ? setEditContent(e.target.value)
                    : setContent(e.target.value)
                }
                disabled={loading}
                required
              />
            </div>
          </div>

          {error && (
            <div className="alert alert-danger mt-3">{error}</div>
          )}

          {/* Botones */}
          <div className="d-flex gap-2 mt-4">
            <button
              type="button"
              onClick={onBack}
              disabled={loading}
              className="btn btn-secondary"
            >
              Atrás
            </button>

            {editingId ? (
              <>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={loading}
                  className="btn btn-success"
                >
                  Guardar
                </button>
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  disabled={loading}
                  className="btn btn-outline-secondary"
                >
                  Cancelar
                </button>
              </>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
              >
                Añadir
              </button>
            )}

            <button
              type="button"
              onClick={onNext}
              disabled={!items.length}
              className="btn btn-primary ms-auto"
            >
              Siguiente
            </button>
          </div>
        </form>
      )}

      {/* Listado de Lecciones por Módulo */}
      {items.length === 0 ? (
        <p className="text-muted">No hay lecciones.</p>
      ) : (
        modules.map(mod => {
          const moduleLessons = items.filter(l => l.moduleId === mod.id);
          if (!moduleLessons.length) return null;
          return (
            <div key={mod.id} className="mb-4">
              <h5 className="mb-2">{mod.title}</h5>
              <ul className="list-group">
                {moduleLessons
                  .sort((a, b) => a.order - b.order)
                  .map(l => (
                    <li
                      key={l.id}
                      className="list-group-item d-flex justify-content-between align-items-center"
                    >
                      <div>
                        {l.title} <small className="text-muted">(Orden {l.order})</small>
                      </div>
                      <div className="btn-group btn-group-sm" role="group" aria-label="Acciones">
                        <button
                          onClick={() => startEdit(l)}
                          disabled={loading}
                          className="btn btn-sm btn-primary"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(l.id)}
                          disabled={loading}
                          className="btn btn-sm btn-danger"
                        >
                          Eliminar
                        </button>
                      </div>
                    </li>
                  ))}
              </ul>
            </div>
          );
        })
      )}
    </div>
  );

}
