'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { createCourse } from '@/lib/courseApi';
import type { CreateCourseDTO } from '@/lib/courseApi';
import { toast, Toaster } from 'react-hot-toast';

interface CourseFormProps {
  initialData: CreateCourseDTO & { moduleIds: string[] };
  onNext: () => void;
  saveCourse: (dto: CreateCourseDTO, courseId: string) => void;
}

export default function CourseForm({ initialData, onNext, saveCourse }: CourseFormProps) {
  const { token } = useAuth();

  // Estados de formulario con valores por defecto
  const [title, setTitle] = useState(initialData.title);
  const [description, setDescription] = useState(initialData.description);
  const [coverImageUrl, setCoverImageUrl] = useState(initialData.coverImageUrl);
  const [price, setPrice] = useState<number | ''>(initialData.price ?? '');
  const [language, setLanguage] = useState(initialData.language);
  const [level, setLevel] = useState(initialData.level);
  const [tags, setTags] = useState(initialData.tags?.join(', '));
  const [whatYouWillLearn, setWhatYouWillLearn] = useState(initialData.whatYouWillLearn.join('\n'));
  const [whyChooseThis, setWhyChooseThis] = useState(initialData.whyChooseThisCourse.join('\n'));
  const [idealFor, setIdealFor] = useState(initialData.idealFor.join('\n'));
  const [enrollCTA, setEnrollCTA] = useState(initialData.enrollCallToAction);

  // Errores y estado
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Validaciones
  const validateField = (name: string, value: string | number) => {
    let error = '';
    switch (name) {
      case 'title':
        if (!value || String(value).trim().length < 5) error = 'Al menos 5 caracteres';
        break;
      case 'description':
        if (!value || String(value).trim().length < 10) error = 'Al menos 10 caracteres';
        break;
      // ... otros casos similares ...
    }
    setFieldErrors(prev => ({ ...prev, [name]: error }));
    return error;
  };

  const validateAll = () => {
    // Ejecuta validateField para campos necesarios
    return [
      validateField('title', title),
      validateField('description', description),
      validateField('level', level),
      validateField('enrollCTA', enrollCTA),
    ].every(e => !e);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAll()) {
      toast.error('Corrige los campos en rojo');
      return;
    }
    setLoading(true);

    const dto: CreateCourseDTO = {
      title: title.trim(),
      description: description.trim(),
      coverImageUrl: coverImageUrl.trim(),
      price: typeof price === 'number' ? price : parseFloat(String(price)) || 0,
      language: language.trim(),
      level,
      tags: tags?.split(',').map(t => t.trim()).filter(Boolean),
      whatYouWillLearn: whatYouWillLearn.split('\n').map(l => l.trim()).filter(Boolean),
      whyChooseThisCourse: whyChooseThis.split('\n').map(l => l.trim()).filter(Boolean),
      idealFor: idealFor.split('\n').map(l => l.trim()).filter(Boolean),
      enrollCallToAction: enrollCTA.trim(),
      moduleIds: initialData.moduleIds,
    };

    try {
      const { id } = await createCourse(dto, token!);
      saveCourse(dto, id);
      toast.success('Curso creado');
      onNext();
    } catch (err: any) {
      toast.error(err.message || 'Error al crear curso');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-4">
      <div className="card">
        <div className="card-body">
          <Toaster position="top-right" />
          <form onSubmit={handleSubmit} noValidate>
            {/* Título */}
            <div className="mb-3">
              <label htmlFor="title" className="form-label">Título</label>
              <input
                id="title"
                name="title"
                type="text"
                className={`form-control ${fieldErrors.title ? 'is-invalid' : ''}`}
                value={title}
                onChange={e => { setTitle(e.target.value); validateField('title', e.target.value); }}
                disabled={loading}
              />
              {fieldErrors.title && <div className="invalid-feedback">{fieldErrors.title}</div>}
            </div>

            {/* Descripción */}
            <div className="mb-3">
              <label htmlFor="description" className="form-label">Descripción</label>
              <textarea
                id="description"
                name="description"
                rows={3}
                className={`form-control ${fieldErrors.description ? 'is-invalid' : ''}`}
                value={description}
                onChange={e => { setDescription(e.target.value); validateField('description', e.target.value); }}
                disabled={loading}
              />
              {fieldErrors.description && <div className="invalid-feedback">{fieldErrors.description}</div>}
            </div>

            {/* Precio e Idioma en row */}
            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <label htmlFor="price" className="form-label">Precio €</label>
                <input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  className={`form-control ${fieldErrors.price ? 'is-invalid' : ''}`}
                  value={price}
                  onChange={e => { const v = e.target.value === '' ? '' : Number(e.target.value); setPrice(v); validateField('price', v); }}
                  disabled={loading}
                />
                {fieldErrors.price && <div className="invalid-feedback">{fieldErrors.price}</div>}
              </div>
              <div className="col-md-6">
                <label htmlFor="language" className="form-label">Idioma</label>
                <input
                  id="language"
                  name="language"
                  type="text"
                  className={`form-control ${fieldErrors.language ? 'is-invalid' : ''}`}
                  value={language}
                  onChange={e => { setLanguage(e.target.value); validateField('language', e.target.value); }}
                  disabled={loading}
                />
                {fieldErrors.language && <div className="invalid-feedback">{fieldErrors.language}</div>}
              </div>
            </div>

            {/* Nivel */}
            <div className="mb-3">
              <label htmlFor="level" className="form-label">Tipo de membresia</label>
              <select
                id="level"
                name="level"
                className={`form-select ${fieldErrors.level ? 'is-invalid' : ''}`}
                value={level}
                onChange={e => { setLevel(e.target.value); validateField('level', e.target.value); }}
                disabled={loading}
              >
                <option value="">--Selecciona--</option>
                <option value="Beginner">Sin fin de permanencia</option>
                <option value="Intermediate">3 Meses</option>
                <option value="Advanced">6 Meses</option>
                <option value="Advanced">Único Pago</option>
              </select>
              {fieldErrors.level && <div className="invalid-feedback">{fieldErrors.level}</div>}
            </div>

            {/* Tags */}
            <div className="mb-3">
              <label htmlFor="tags" className="form-label">Etiquetas</label>
              <input
                id="tags"
                name="tags"
                type="text"
                className="form-control"
                placeholder="ej: react, javascript"
                value={tags}
                onChange={e => setTags(e.target.value)}
                disabled={loading}
              />
            </div>

            {/* ¿Qué aprenderás? */}
            <div className="mb-3">
              <label htmlFor="whatYouWillLearn" className="form-label">¿Qué aprenderás?</label>
              <textarea
                id="whatYouWillLearn"
                name="whatYouWillLearn"
                rows={4}
                className={`form-control ${fieldErrors.whatYouWillLearn ? 'is-invalid' : ''}`}
                value={whatYouWillLearn}
                onChange={e => { setWhatYouWillLearn(e.target.value); validateField('whatYouWillLearn', e.target.value); }}
                disabled={loading}
              />
              {fieldErrors.whatYouWillLearn && <div className="invalid-feedback">{fieldErrors.whatYouWillLearn}</div>}
            </div>

            {/* Llamada a la acción */}
            <div className="mb-3">
              <label htmlFor="enrollCTA" className="form-label">Llamada a la acción</label>
              <input
                id="enrollCTA"
                name="enrollCTA"
                type="text"
                className={`form-control ${fieldErrors.enrollCTA ? 'is-invalid' : ''}`}
                value={enrollCTA}
                onChange={e => { setEnrollCTA(e.target.value); validateField('enrollCTA', e.target.value); }}
                disabled={loading}
              />
              {fieldErrors.enrollCTA && <div className="invalid-feedback">{fieldErrors.enrollCTA}</div>}
            </div>

            {/* Botón submit */}
            <button
              type="submit"
              className="btn btn-primary w-100"
              disabled={loading}
            >
              {loading ? 'Creando...' : 'Crear curso y siguiente'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
