'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  createModule,
  updateModule,
  deleteModule,
  CreateModuleDTO,
  Module as ModuleType,
} from '@/lib/moduleApi';

import styles from '../styles/ModuleManager.module.scss'

interface ModuleManagerProps {
  courseId: string;
  modules: ModuleType[];
  onAddModule: (module: ModuleType) => void;
  onBack: () => void;
  onNext: () => void;
}

export default function ModuleManager({
  courseId,
  modules,
  onAddModule,
  onBack,
  onNext,
}: ModuleManagerProps) {
  const { token } = useAuth();

  // New module form state
  const [title, setTitle] = useState('');
  const [order, setOrder] = useState(modules.length);
  const [description, setDescription] = useState('');

  // Existing modules and editing state
  const [items, setItems] = useState<ModuleType[]>(modules);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editOrder, setEditOrder] = useState(0);
  const [editDescription, setEditDescription] = useState('');

  // Errors and loading
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Sync when modules prop changes
  useEffect(() => setItems(modules), [modules]);

  // Validation
  const validate = (t: string, o: number): boolean => {
    const errs: Record<string, string> = {};
    if (!t.trim()) errs.title = 'Título obligatorio';
    if (o < 0) errs.order = 'Orden ≥ 0';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Add new module
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!validate(title, order)) return;
    setLoading(true);
    const dto: CreateModuleDTO = {
      courseId,
      title: title.trim(),
      order,
      description: description.trim() || undefined,
    };
    try {
      const { id } = await createModule(dto, token!);
      const newItem: ModuleType = {
        id,
        ...dto,
        isPublished: false,
        createdAt: new Date().toISOString(),
      };
      onAddModule(newItem);
      setTitle('');
      setOrder(prev => prev + 1);
      setDescription('');
    } catch (err: any) {
      setSubmitError(err.message || 'Error al crear módulo');
    } finally {
      setLoading(false);
    }
  };

  // Start editing
  const startEdit = (mod: ModuleType) => {
    setEditingId(mod.id);
    setEditTitle(mod.title);
    setEditOrder(mod.order);
    setEditDescription(mod.description || '');
    setErrors({});
    setSubmitError(null);
  };

  // Save edit
  const handleSave = async () => {
    if (!editingId) return;
    if (!validate(editTitle, editOrder)) return;
    setLoading(true);
    setSubmitError(null);
    try {
      // updateModule expects update object to include id property
      const updateDto: Partial<CreateModuleDTO> & { id: string } = {
        id: editingId,
        title: editTitle.trim(),
        order: editOrder,
        description: editDescription.trim() || undefined,
      };
      await updateModule(editingId, updateDto, token!);
      setItems(prev => prev.map(m =>
        m.id === editingId
          ? { ...m, title: updateDto.title!, order: updateDto.order!, description: updateDto.description }
          : m
      ));
      setEditingId(null);
    } catch (err: any) {
      setSubmitError(err.message || 'Error al actualizar módulo');
    } finally {
      setLoading(false);
    }
  };


  // Delete module
  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar módulo?')) return;
    setLoading(true);
    setSubmitError(null);
    try {
      await deleteModule(id, token!);
      setItems(prev => prev.filter(m => m.id !== id));
    } catch (err: any) {
      setSubmitError(err.message || 'Error al eliminar módulo');
    } finally {
      setLoading(false);
    }
  };

  const sortedItems = [...items].sort((a, b) => a.order - b.order);

  return (
    <div className={styles.managerContainer}>
      <h2 className={styles.sectionTitle}>Gestión de Módulos</h2>

      <form onSubmit={handleAdd} noValidate className={styles.addModuleForm}>
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="newModuleTitle" className={styles.label}>Título del Nuevo Módulo</label>
            <input
              id="newModuleTitle"
              type="text"
              className={`${styles.input} ${errors.title ? styles.invalid : ''}`}
              value={title}
              onChange={e => setTitle(e.target.value)}
              disabled={loading}
              placeholder="Ej: Introducción a..."
            />
            {errors.title && <span className={styles.errorMessage}>{errors.title}</span>}
          </div>
          <div className={`${styles.formGroup} ${styles.orderField}`}>
            <label htmlFor="newModuleOrder" className={styles.label}>Orden</label>
            <input
              id="newModuleOrder"
              type="number"
              className={`${styles.input} ${errors.order ? styles.invalid : ''}`}
              value={order}
              onChange={e => setOrder(Number(e.target.value))}
              disabled={loading}
            />
            {errors.order && <span className={styles.errorMessage}>{errors.order}</span>}
          </div>
        </div>
        <div className={styles.formGroup} style={{ marginBottom: 'var(--spacing-lg)' }}> {/* Usando variable CSS o string */}
          <label htmlFor="newModuleDescription" className={styles.label}>Descripción (Opcional)</label>
          <textarea
            id="newModuleDescription"
            rows={3}
            className={styles.textarea}
            value={description}
            onChange={e => setDescription(e.target.value)}
            disabled={loading}
            placeholder="Breve descripción del contenido del módulo..."
          />
        </div>
        <div className={`${styles.buttonGroup} ${styles.end}`}>
          <button type="submit" className={styles.button} disabled={loading}>
            {/* <FaPlus className={styles.icon} />  */}
            {loading ? 'Añadiendo...' : 'Añadir Módulo'}
          </button>
        </div>
      </form>

      {submitError && <div className={styles.globalError}>{submitError}</div>}

      <div className={styles.moduleList}>
        {sortedItems.length === 0 && !loading ? (
          <p className={styles.noModulesMessage}>Aún no has añadido ningún módulo. ¡Empieza creando el primero!</p>
        ) : (
          sortedItems.map(mod => (
            <div key={mod.id} className={styles.moduleItem}>
              {editingId === mod.id ? (
                <div className={styles.editForm}>
                  <div className={styles.formGroup} style={{ marginBottom: 'var(--spacing-md)' }}>
                    <label htmlFor={`editTitle-${mod.id}`} className={styles.label}>Título</label>
                    <input
                      id={`editTitle-${mod.id}`}
                      className={`${styles.input} ${errors.editTitle ? styles.invalid : ''}`}
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      disabled={loading}
                    />
                    {errors.editTitle && <span className={styles.errorMessage}>{errors.editTitle}</span>}
                  </div>
                  <div className={styles.formGroup} style={{ marginBottom: 'var(--spacing-md)' }}>
                    <label htmlFor={`editOrder-${mod.id}`} className={styles.label}>Orden</label>
                    <input
                      id={`editOrder-${mod.id}`}
                      type="number"
                      className={`${styles.input} ${errors.editOrder ? styles.invalid : ''}`}
                      value={editOrder}
                      onChange={e => setEditOrder(Number(e.target.value))}
                      disabled={loading}
                    />
                    {errors.editOrder && <span className={styles.errorMessage}>{errors.editOrder}</span>}
                  </div>
                  <div className={styles.formGroup} style={{ marginBottom: 'var(--spacing-md)' }}>
                    <label htmlFor={`editDesc-${mod.id}`} className={styles.label}>Descripción</label>
                    <textarea
                      id={`editDesc-${mod.id}`}
                      rows={3}
                      className={styles.textarea}
                      value={editDescription}
                      onChange={e => setEditDescription(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  <div className={`${styles.buttonGroup} ${styles.end}`}>
                    <button onClick={() => setEditingId(null)} disabled={loading} className={styles.buttonSecondary}>
                      {/* <FaTimes className={styles.icon} /> */}
                       Cancelar
                    </button>
                    <button onClick={handleSave} disabled={loading} className={styles.buttonSuccess}>
                      {/* <FaSave className={styles.icon} /> */}
                       Guardar Cambios
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className={styles.moduleHeader}>
                    <h4 className={styles.moduleTitle}>{mod.title}</h4>
                    <div className={`${styles.actions} ${styles.buttonGroup}`}>
                      <button onClick={() => startEdit(mod)} disabled={loading} className={`${styles.buttonSecondary} ${styles.buttonSmall}`}>
                        {/* <FaEdit className={styles.icon} /> */}
                         Editar
                      </button>
                      <button onClick={() => handleDelete(mod.id)} disabled={loading} className={`${styles.buttonDanger} ${styles.buttonSmall}`}>
                        {/* <FaTrash className={styles.icon} /> */}
                         Eliminar
                      </button>
                    </div>
                  </div>
                  <p className={styles.moduleOrder}>Orden: {mod.order}</p>
                  {mod.description && <p className={styles.moduleDescription}>{mod.description}</p>}
                </>
              )}
            </div>
          ))
        )}
      </div>

      <div className={styles.buttonGroup} style={{ marginTop: 'var(--spacing-xl)'}}>
        <button type="button" className={styles.buttonSecondary} onClick={onBack} disabled={loading}>
          {/* <FaArrowLeft className={styles.icon} /> */}
           Atrás
        </button>
        <button type="button" className={styles.button} onClick={onNext} disabled={items.length === 0 || loading}>
           Siguiente
           {/* <FaArrowRight className={styles.icon} style={{marginRight: 0, marginLeft: 'var(--spacing-sm)'}}/> */}
        </button>
      </div>
    </div>
  );
}