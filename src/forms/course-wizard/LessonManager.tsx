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

import styles from '../styles/LessonManager.module.scss'; // Importar el módulo SCSS

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
  }, [selectedModule, token]); // Añadir token a las dependencias

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
      faqs: [], // Asumo que FAQs se manejarían en otro paso o componente
    };

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
      // faqs: [], // Mantener faqs como un array vacío o manejar su actualización
    };
    try {
      await updateLesson(dto, token!);
      setItems(prev => prev.map(l => l.id === editingId ? { ...l, title: dto.title!, order: editOrder, overview: dto.overview, content: dto.content! } : l));
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
    <div className={styles.lessonManager}>
      <h3 className={styles.sectionTitle}>Gestión de Lecciones</h3>

      {/* Selector de Módulo */}
      <div className={styles.formGroup}>
        <label htmlFor="moduleSelect" className={styles.formLabel}>
          Módulo
        </label>
        <select
          id="moduleSelect"
          className={styles.formSelect}
          value={selectedModule}
          onChange={e => setSelectedModule(e.target.value)}
          disabled={loading}
        >
          <option value="">-- Selecciona un módulo --</option>
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
          onSubmit={editingId ? e => { e.preventDefault(); handleSave(); } : handleAdd}
          className={styles.formCard}
          noValidate
        >
          <div className={styles.formGrid}>
            {/* Título */}
            <div className={styles.formGroup}>
              <label htmlFor="lessonTitle" className={styles.formLabel}>
                Título
              </label>
              <input
                id="lessonTitle"
                type="text"
                className={styles.formControl}
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
            <div className={styles.formGroup}>
              <label htmlFor="lessonOrder" className={styles.formLabel}>
                Orden
              </label>
              <input
                id="lessonOrder"
                type="number"
                className={styles.formControl}
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
            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label htmlFor="lessonOverview" className={styles.formLabel}>
                Resumen
              </label>
              <textarea
                id="lessonOverview"
                rows={2}
                className={styles.formControl}
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
            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label htmlFor="lessonContent" className={styles.formLabel}>
                Contenido
              </label>
              <textarea
                id="lessonContent"
                rows={6}
                className={styles.formControl}
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
            <div className={styles.errorMessage}>{error}</div>
          )}

          {/* Botones del formulario */}
          <div className={styles.formActions}>
            <button
              type="button"
              onClick={onBack}
              disabled={loading}
              className={styles.buttonSecondary}
            >
              {/* <span className={styles.icon}>&larr;</span> */} Atrás
            </button>

            {editingId ? (
              <>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={loading}
                  className={styles.buttonSuccess}
                >
                  {/* <span className={styles.icon}>&#10003;</span> */} Guardar
                </button>
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  disabled={loading}
                  className={styles.buttonOutline}
                >
                  Cancelar
                </button>
              </>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className={styles.buttonPrimary}
              >
                {/* <span className={styles.icon}>+</span> */} Añadir Lección
              </button>
            )}

            <button
              type="button"
              onClick={onNext}
              disabled={!items.length || loading}
              className={`${styles.buttonPrimary} ${styles.buttonNext}`}
            >
              Siguiente {/* <span className={styles.icon}>&rarr;</span> */}
            </button>
          </div>
        </form>
      )}

      {/* Listado de Lecciones por Módulo */}
      {selectedModule && items.filter(l => l.moduleId === selectedModule).length === 0 && (
        <p className={styles.emptyState}>No hay lecciones en este módulo.</p>
      )}

      {selectedModule && (
        <div className={styles.lessonsListContainer}>
          {modules.map(mod => {
            const moduleLessons = items.filter(l => l.moduleId === mod.id);
            if (!moduleLessons.length) return null;
            return (
              <div key={mod.id} className={styles.moduleSection}>
                <h5 className={styles.moduleTitle}>{mod.title}</h5>
                <ul className={styles.lessonsList}>
                  {moduleLessons
                    .sort((a, b) => a.order - b.order)
                    .map(l => (
                      <li
                        key={l.id}
                        className={styles.lessonItem}
                      >
                        <div>
                          <span className={styles.lessonItemTitle}>{l.title}</span>{' '}
                          <span className={styles.lessonItemOrder}>(Orden {l.order})</span>
                        </div>
                        <div className={styles.lessonActions}>
                          <button
                            onClick={() => startEdit(l)}
                            disabled={loading}
                            className={styles.actionButtonEdit}
                          >
                             {/* <span className={styles.icon}>📝</span> */} Editar
                          </button>
                          <button
                            onClick={() => handleDelete(l.id)}
                            disabled={loading}
                            className={styles.actionButtonDelete}
                          >
                             {/* <span className={styles.icon}>🗑️</span> */} Eliminar
                          </button>
                        </div>
                      </li>
                    ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}