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

  return (
    <div className="container mt-4">
      <div className="card">
        <div className="card-header">Gestión de Módulos</div>
        <div className="card-body">
          <form onSubmit={handleAdd} noValidate>
            <div className="mb-3">
              <label className="form-label">Título</label>
              <input
                type="text"
                className={`form-control ${errors.title ? 'is-invalid' : ''}`}
                value={title}
                onChange={e => setTitle(e.target.value)}
                disabled={loading}
              />
              {errors.title && <div className="invalid-feedback">{errors.title}</div>}
            </div>
            <div className="mb-3">
              <label className="form-label">Orden</label>
              <input
                type="number"
                className={`form-control ${errors.order ? 'is-invalid' : ''}`}
                value={order}
                onChange={e => setOrder(Number(e.target.value))}
                disabled={loading}
              />
              {errors.order && <div className="invalid-feedback">{errors.order}</div>}
            </div>
            <div className="mb-3">
              <label className="form-label">Descripción (opcional)</label>
              <textarea
                rows={2}
                className="form-control"
                value={description}
                onChange={e => setDescription(e.target.value)}
                disabled={loading}
              />
            </div>
            {submitError && <div className="alert alert-danger">{submitError}</div>}
            <div className="d-flex justify-content-between mb-4">
              <button type="button" className="btn btn-secondary" onClick={onBack} disabled={loading}>Atrás</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>Añadir</button>
              <button type="button" className="btn btn-primary" onClick={onNext} disabled={!items.length}>Siguiente</button>
            </div>
          </form>

          {items.length === 0 ? (
            <p className="text-muted">No hay módulos aún.</p>
          ) : (
            items.sort((a, b) => a.order - b.order).map(mod => (
              <div key={mod.id} className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  {editingId === mod.id ? (
                    <>
                      <input
                        className={`form-control mb-2 ${errors.title ? 'is-invalid' : ''}`}
                        value={editTitle}
                        onChange={e => setEditTitle(e.target.value)}
                        disabled={loading}
                      />
                      {errors.title && <div className="invalid-feedback">{errors.title}</div>}
                      <input
                        type="number"
                        className={`form-control mb-2 ${errors.order ? 'is-invalid' : ''}`}
                        value={editOrder}
                        onChange={e => setEditOrder(Number(e.target.value))}
                        disabled={loading}
                      />
                      {errors.order && <div className="invalid-feedback">{errors.order}</div>}
                      <textarea
                        rows={2}
                        className="form-control mb-2"
                        value={editDescription}
                        onChange={e => setEditDescription(e.target.value)}
                        disabled={loading}
                      />
                    </>
                  ) : (
                    <>
                      <h5>{mod.title}</h5>
                      <p className="mb-1 text-muted">Orden: {mod.order}</p>
                      {mod.description && <p className="mb-0">{mod.description}</p>}
                    </>
                  )}
                </div>
                <div className="btn-group btn-group-sm">
                  {editingId === mod.id ? (
                    <> 
                      <button onClick={handleSave} disabled={loading} className="btn btn-success">Guardar</button>
                      <button onClick={() => setEditingId(null)} disabled={loading} className="btn btn-secondary">Cancelar</button>
                    </>
                  ) : (
                    <> 
                      <button onClick={() => startEdit(mod)} disabled={loading} className="btn btn-secondary">Editar</button>
                      <button onClick={() => handleDelete(mod.id)} disabled={loading} className="btn btn-danger">Eliminar</button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}