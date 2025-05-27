'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { createCourse } from '@/lib/courseApi';
import type { CreateCourseDTO } from '@/lib/courseApi';
import { toast, Toaster } from 'react-hot-toast';

import styles from '../styles/CourseForm.module.scss'; // Importar el módulo SCSS

interface CourseFormProps {
  initialData: CreateCourseDTO & { moduleIds: string[] };
  onNext: () => void;
  saveCourse: (dto: CreateCourseDTO, courseId: string) => void;
}

export default function CourseForm({ initialData, onNext, saveCourse }: CourseFormProps) {
  const { token } = useAuth();

  const [title, setTitle] = useState(initialData.title);
  const [description, setDescription] = useState(initialData.description);
  const [coverImageUrl, setCoverImageUrl] = useState(initialData.coverImageUrl);
  const [price, setPrice] = useState<number | ''>(initialData.price ?? '');
  const [language, setLanguage] = useState(initialData.language);
  const [level, setLevel] = useState(initialData.level);
  const [tags, setTags] = useState(initialData.tags?.join(', ') || '');
  const [whatYouWillLearn, setWhatYouWillLearn] = useState(initialData.whatYouWillLearn?.join('\n') || ''); // Usar \n para textareas
  const [whyChooseThis, setWhyChooseThis] = useState(initialData.whyChooseThisCourse?.join('\n') || ''); // Usar \n
  const [idealFor, setIdealFor] = useState(initialData.idealFor?.join('\n') || ''); // Usar \n
  const [type, setType] = useState<'course' | 'membership' | ''>(initialData.type || '');

  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof CreateCourseDTO, string>>>({});
  const [loading, setLoading] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(!!initialData.coverImageUrl);


  // Actualizar preview de imagen si la URL cambia y es válida
  useEffect(() => {
    if (coverImageUrl && String(coverImageUrl).startsWith('http')) {
      setShowImagePreview(true);
    } else {
      setShowImagePreview(false);
    }
  }, [coverImageUrl]);


  const validateField = (name: keyof CreateCourseDTO | 'type', value: string | number | string[] | undefined) => {
    let error = '';
    // (Tu lógica de validación existente aquí... sin cambios)
    // ...
        switch (name) {
            case 'title':
                if (!value || String(value).trim().length < 5) error = 'Título debe tener al menos 5 caracteres.';
                break;
            case 'description':
                if (!value || String(value).trim().length < 10) error = 'Descripción debe tener al menos 10 caracteres.';
                break;
            case 'type':
                if (value !== 'course' && value !== 'membership') error = 'Selecciona un tipo válido (Curso o Membresía).';
                break;
            case 'price':
                if (price === '' || typeof value !== 'number' || Number(value) < 0) error = 'Precio debe ser un número positivo.';
                break;
            case 'language':
                if (!value || String(value).trim().length < 2) error = 'Idioma requerido.';
                break;
            case 'level':
                if (!value || String(value).trim().length < 1) error = 'Nivel/Tipo de membresía requerido.';
                break;
            case 'whatYouWillLearn':
                if (!value || String(value).trim().length < 5) error = '¿Qué aprenderás? debe tener al menos 5 caracteres.';
                break;
            case 'whyChooseThisCourse':
                if (!value || String(value).trim().length < 5) error = '¿Por qué elegir este curso? debe tener al menos 5 caracteres.';
                break;
            case 'idealFor':
                if (!value || String(value).trim().length < 5) error = 'Ideal para debe tener al menos 5 caracteres.';
                break;
            case 'coverImageUrl':
                if (value && !String(value).startsWith('http')) error = 'La URL de la imagen debe comenzar con http(s).';
                // La imagen de portada puede ser opcional, ajustar si es requerida
                // if (!value || !String(value).startsWith('http')) error = 'La URL de la imagen es requerida y debe comenzar con http(s).';
                break;
        }
    // ...

    setFieldErrors(prev => ({ ...prev, [name]: error }));
    return error;
  };

  const validateAll = () => {
    let isValid = true;
    const currentErrors: Partial<Record<keyof CreateCourseDTO | 'type', string>> = {};
    
    const fieldsToValidate: (keyof CreateCourseDTO | 'type')[] = [
        'type', 'title', 'description', 'coverImageUrl', 'price', 'language', 'level', 
        'whatYouWillLearn', 'whyChooseThisCourse', 'idealFor'
        // 'tags' es opcional así que no lo incluyo para validación obligatoria
    ];

    const tempState = { title, description, coverImageUrl, price, language, level, tags, whatYouWillLearn, whyChooseThis, idealFor, type };

    fieldsToValidate.forEach(fieldName => {
        const value = tempState[fieldName as keyof typeof tempState];
        const error = validateField(fieldName as keyof CreateCourseDTO, value as any); // 'type' necesita ser manejado con cuidado
        if (error) {
            isValid = false;
            currentErrors[fieldName as keyof CreateCourseDTO] = error;
        }
    });
    
    setFieldErrors(currentErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAll()) {
      toast.error('Por favor, corrige los errores en el formulario.');
      return;
    }

    setLoading(true);

    try {
      const dto: CreateCourseDTO = {
        title: title.trim(),
        description: description.trim(),
        coverImageUrl: coverImageUrl.trim(),
        price: typeof price === 'number' ? price : parseFloat(String(price)) || 0,
        language: language.trim(),
        level,
        tags: tags?.split(',').map(t => t.trim()).filter(Boolean) || [],
        whatYouWillLearn: whatYouWillLearn.split('\n').map(l => l.trim()).filter(Boolean), // CORREGIDO
        whyChooseThisCourse: whyChooseThis.split('\n').map(l => l.trim()).filter(Boolean), // CORREGIDO
        idealFor: idealFor.split('\n').map(l => l.trim()).filter(Boolean), // CORREGIDO
        moduleIds: initialData.moduleIds || [],
        type: type as 'course' | 'membership',
      };

      const { id } = await createCourse(dto, token!);
      saveCourse(dto, id);
      toast.success('Curso guardado correctamente.');
      onNext();
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.errors) {
        setFieldErrors(err.response.data.errors);
        toast.error('Error de validación del servidor. Revisa los campos.');
      } else {
        toast.error(err.message || 'Error al crear el curso.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = <K extends keyof CreateCourseDTO | 'type'>(
    setter: React.Dispatch<React.SetStateAction<any>>,
    fieldName: K,
    value: string | number
  ) => {
    setter(value);
    validateField(fieldName, value);
  };


  return (
    <div className={styles.formContainer}>
      <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
      <form onSubmit={handleSubmit} noValidate>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="type" className={styles.label}>Tipo</label>
            <div className={styles.selectWrapper}>
              <select
                id="type"
                name="type"
                className={`${styles.select} ${fieldErrors.type ? styles.invalid : ''}`}
                value={type}
                onChange={e => handleInputChange(setType, 'type', e.target.value)}
                disabled={loading}
              >
                <option value="">-- Selecciona un tipo --</option>
                <option value="course">Curso</option>
                <option value="membership">Membresía</option>
              </select>
            </div>
            {fieldErrors.type && <span className={styles.errorMessage}>{fieldErrors.type}</span>}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="coverImageUrl" className={styles.label}>URL Imagen Portada (Opcional)</label>
            <input
              id="coverImageUrl"
              name="coverImageUrl"
              type="url"
              className={`${styles.input} ${fieldErrors.coverImageUrl ? styles.invalid : ''}`}
              value={coverImageUrl}
              onChange={e => handleInputChange(setCoverImageUrl, 'coverImageUrl', e.target.value)}
              placeholder="https://ejemplo.com/imagen.jpg"
              disabled={loading}
            />
            {fieldErrors.coverImageUrl && <span className={styles.errorMessage}>{fieldErrors.coverImageUrl}</span>}
            {showImagePreview && coverImageUrl && (
                <img src={coverImageUrl} alt="Previsualización" className={styles.imagePreview} />
            )}
          </div>
        </div>

        <div className={`${styles.formGroup} ${styles.fullWidth}`}>
          <label htmlFor="title" className={styles.label}>Título</label>
          <input
            id="title"
            name="title"
            type="text"
            className={`${styles.input} ${fieldErrors.title ? styles.invalid : ''}`}
            value={title}
            onChange={e => handleInputChange(setTitle, 'title', e.target.value)}
            placeholder="Ej: Curso completo de React desde cero"
            disabled={loading}
          />
          {fieldErrors.title && <span className={styles.errorMessage}>{fieldErrors.title}</span>}
        </div>

        <div className={`${styles.formGroup} ${styles.fullWidth}`}>
          <label htmlFor="description" className={styles.label}>Descripción</label>
          <textarea
            id="description"
            name="description"
            rows={5}
            className={`${styles.textarea} ${fieldErrors.description ? styles.invalid : ''}`}
            value={description}
            onChange={e => handleInputChange(setDescription, 'description', e.target.value)}
            placeholder="Describe de qué trata tu curso o membresía..."
            disabled={loading}
          />
          {fieldErrors.description && <span className={styles.errorMessage}>{fieldErrors.description}</span>}
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="price" className={styles.label}>Precio (€)</label>
            <input
              id="price"
              name="price"
              type="number"
              step="0.01"
              min="0"
              className={`${styles.input} ${fieldErrors.price ? styles.invalid : ''}`}
              value={price}
              onChange={e => handleInputChange(setPrice, 'price', e.target.value === '' ? '' : parseFloat(e.target.value))}
              placeholder="Ej: 49.99"
              disabled={loading}
            />
            {fieldErrors.price && <span className={styles.errorMessage}>{fieldErrors.price}</span>}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="language" className={styles.label}>Idioma</label>
            <input
              id="language"
              name="language"
              type="text"
              className={`${styles.input} ${fieldErrors.language ? styles.invalid : ''}`}
              value={language}
              onChange={e => handleInputChange(setLanguage, 'language', e.target.value)}
              placeholder="Ej: Español"
              disabled={loading}
            />
            {fieldErrors.language && <span className={styles.errorMessage}>{fieldErrors.language}</span>}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="level" className={styles.label}>Nivel / Tipo Membresía</label>
             <div className={styles.selectWrapper}>
                <select
                    id="level"
                    name="level"
                    className={`${styles.select} ${fieldErrors.level ? styles.invalid : ''}`}
                    value={level}
                    onChange={e => handleInputChange(setLevel, 'level', e.target.value)}
                    disabled={loading}
                >
                    <option value="">-- Selecciona un nivel --</option>
                    <option value="Beginner">Básico</option>
                    <option value="Intermediate">Intermedio</option>
                    <option value="Advanced">Avanzado</option>
                    {/* Podrías añadir opciones específicas para 'membership' dinámicamente si type === 'membership' */}
                </select>
            </div>
            {fieldErrors.level && <span className={styles.errorMessage}>{fieldErrors.level}</span>}
          </div>
        </div>

        <div className={`${styles.formGroup} ${styles.fullWidth}`}>
          <label htmlFor="tags" className={styles.label}>Etiquetas (Opcional)</label>
          <input
            id="tags"
            name="tags"
            type="text"
            className={styles.input} // No necesita validación de error visual si es opcional
            value={tags}
            onChange={e => setTags(e.target.value)} // No necesita validación individual inmediata si es opcional
            placeholder="react, javascript, desarrollo web"
            disabled={loading}
          />
          <span className={styles.helpText}>Separa las etiquetas con comas.</span>
        </div>

        <div className={`${styles.formGroup} ${styles.fullWidth}`}>
          <label htmlFor="whatYouWillLearn" className={styles.label}>¿Qué aprenderás?</label>
          <textarea
            id="whatYouWillLearn"
            name="whatYouWillLearn"
            rows={5}
            className={`${styles.textarea} ${fieldErrors.whatYouWillLearn ? styles.invalid : ''}`}
            value={whatYouWillLearn}
            onChange={e => handleInputChange(setWhatYouWillLearn, 'whatYouWillLearn', e.target.value)}
            placeholder="Escribe cada punto en una nueva línea..."
            disabled={loading}
          />
          {fieldErrors.whatYouWillLearn && <span className={styles.errorMessage}>{fieldErrors.whatYouWillLearn}</span>}
        </div>

        <div className={`${styles.formGroup} ${styles.fullWidth}`}>
          <label htmlFor="whyChooseThisCourse" className={styles.label}>¿Por qué elegir este curso/membresía?</label>
          <textarea
            id="whyChooseThisCourse"
            name="whyChooseThisCourse"
            rows={5}
            className={`${styles.textarea} ${fieldErrors.whyChooseThisCourse ? styles.invalid : ''}`}
            value={whyChooseThis}
            onChange={e => handleInputChange(setWhyChooseThis, 'whyChooseThisCourse', e.target.value)}
            placeholder="Destaca los beneficios únicos, uno por línea..."
            disabled={loading}
          />
          {fieldErrors.whyChooseThisCourse && <span className={styles.errorMessage}>{fieldErrors.whyChooseThisCourse}</span>}
        </div>

        <div className={`${styles.formGroup} ${styles.fullWidth}`}>
          <label htmlFor="idealFor" className={styles.label}>Ideal para</label>
          <textarea
            id="idealFor"
            name="idealFor"
            rows={5}
            className={`${styles.textarea} ${fieldErrors.idealFor ? styles.invalid : ''}`}
            value={idealFor}
            onChange={e => handleInputChange(setIdealFor, 'idealFor', e.target.value)}
            placeholder="Describe el perfil del estudiante/miembro ideal, uno por línea..."
            disabled={loading}
          />
          {fieldErrors.idealFor && <span className={styles.errorMessage}>{fieldErrors.idealFor}</span>}
        </div>

        <button
          type="submit"
          className={styles.submitButton}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className={styles.spinner}></span>
              Guardando...
            </>
          ) : (
            'Guardar y Siguiente'
          )}
        </button>
      </form>
    </div>
  );
}