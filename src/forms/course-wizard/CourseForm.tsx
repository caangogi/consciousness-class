'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { createCourse } from '@/lib/courseApi';
import type { CreateCourseDTO } from '@/lib/courseApi';
import { toast, Toaster } from 'react-hot-toast';

// Importamos los tipos de MembershipDetails del dominio o los definimos aquí si el frontend no accede directamente al dominio
import { MembershipDetails, MembershipPlanType, CustomDurationDetails } from '../../back/course/domain/Course'; // Ajusta la ruta si es necesario

import styles from '../styles/CourseForm.module.scss';

interface CourseFormProps {
  initialData: Partial<CreateCourseDTO>; // Usamos Partial si los datos iniciales pueden estar incompletos
  onNext: () => void;
  saveCourse: (dto: CreateCourseDTO, courseId: string) => void;
}

// Tipo para el estado del formulario, que reflejará la UI
interface FormState {
  title: string;
  description: string;
  coverImageUrl: string;
  price: number | '';
  language: string;
  level: string;
  tags: string;
  whatYouWillLearn: string;
  whyChooseThisCourseBenefits: string[];
  idealFor: string;
  type: 'course' | 'membership' | '';
  // AÑADIDO: Estado para membershipDetails
  membershipPlanType: MembershipPlanType | ''; // Plan type como campo separado en el formulario
  customDurationValue: number | ''; // Valor para duración personalizada
  customDurationUnit: 'days' | 'weeks' | 'months' | 'years' | ''; // Unidad para duración personalizada
}

export default function CourseForm({ initialData, onNext, saveCourse }: CourseFormProps) {
  const { token } = useAuth();

  const [formData, setFormData] = useState<FormState>(() => {
    // Inicializar membership details si existen en initialData
    const initialMembershipDetails = initialData.membershipDetails;
    return {
      title: initialData.title || '',
      description: initialData.description || '',
      coverImageUrl: initialData.coverImageUrl || '',
      price: initialData.price ?? '',
      language: initialData.language || '',
      level: initialData.level || '',
      tags: initialData.tags?.join(', ') || '',
      whatYouWillLearn: initialData.whatYouWillLearn?.join('\n') || '',
      whyChooseThisCourseBenefits: initialData.whyChooseThisCourse || [],
      idealFor: initialData.idealFor?.join('\n') || '',
      type: initialData.type || '',
      // Inicializar campos de membresía
      membershipPlanType: initialMembershipDetails?.planType || '',
      customDurationValue: initialMembershipDetails?.customDuration?.value ?? '',
      customDurationUnit: initialMembershipDetails?.customDuration?.unit || '',
    };
  });

  const [currentBenefitInput, setCurrentBenefitInput] = useState<string>('');
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof CreateCourseDTO | 'type' | 'membershipPlanType' | 'customDurationValue' | 'customDurationUnit', string>>>({}); // Actualizado para incluir nuevos campos de error
  const [loading, setLoading] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);

  useEffect(() => {
    if (formData.coverImageUrl && String(formData.coverImageUrl).startsWith('http')) {
      setShowImagePreview(true);
    } else {
      setShowImagePreview(false);
    }
  }, [formData.coverImageUrl]);

  const validateField = useCallback((
    name: keyof FormState | 'type' | 'membershipPlanType' | 'customDurationValue' | 'customDurationUnit', // Actualizado
    value: string | number | string[] | undefined
  ): string | undefined => {
    let error: string | undefined = undefined;

    switch (name) {
      case 'title':
        if (!value || String(value).trim().length < 5) error = 'El título debe tener al menos 5 caracteres.';
        break;
      case 'description':
        if (!value || String(value).trim().length < 10) error = 'La descripción debe tener al menos 10 caracteres.';
        break;
      case 'type':
        if (value !== 'course' && value !== 'membership') error = 'Selecciona un tipo válido (Curso o Membresía).';
        break;
      case 'price':
        if (value === '' || typeof value !== 'number' || Number(value) < 0) error = 'El precio debe ser un número positivo.';
        break;
      case 'language':
        if (!value || String(value).trim().length < 2) error = 'El idioma es requerido.';
        break;
      case 'level':
        if (!value || String(value).trim().length < 1) error = 'El nivel es requerido.';
        break;
      case 'whatYouWillLearn':
        if (!value || String(value).trim().length < 5) error = 'La sección "¿Qué aprenderás?" debe tener al menos 5 caracteres.';
        break;
      case 'whyChooseThisCourseBenefits':
        if (!value || !Array.isArray(value) || value.length === 0) {
          error = 'Debes añadir al menos un beneficio para este curso/membresía.';
        } else {
          const hasShortBenefit = value.some(benefit => String(benefit).trim().length < 5);
          if (hasShortBenefit) {
            error = 'Cada beneficio individual debe tener al menos 5 caracteres.';
          }
        }
        break;
      case 'idealFor':
        if (!value || String(value).trim().length < 5) error = 'La sección "Ideal para" debe tener al menos 5 caracteres.';
        break;
      case 'coverImageUrl':
        if (value && !String(value).startsWith('http')) error = 'La URL de la imagen debe comenzar con http(s).';
        break;
      // AÑADIDO: Validación para campos de membresía
      case 'membershipPlanType':
        if (formData.type === 'membership' && (!value || value === '')) error = 'El tipo de plan de membresía es requerido.';
        break;
      case 'customDurationValue':
        if (formData.type === 'membership' && formData.membershipPlanType === 'custom-duration') {
          if (value === '' || typeof value !== 'number' || Number(value) <= 0) {
            error = 'El valor de duración personalizada debe ser un número positivo.';
          }
        }
        break;
      case 'customDurationUnit':
        if (formData.type === 'membership' && formData.membershipPlanType === 'custom-duration') {
          const validUnits = ['days', 'weeks', 'months', 'years'];
          if (!value || value === '' || !validUnits.includes(String(value))) {
            error = 'La unidad de duración personalizada es requerida.';
          }
        }
        break;
    }
    return error;
  }, [formData]); // formData es dependencia para las validaciones condicionales de membresía


  const validateAll = useCallback(() => {
    let isValid = true;
    // Actualizado: Las claves deben ser uniones de los posibles nombres de campo
    const currentErrors: Partial<Record<keyof CreateCourseDTO | 'type' | 'membershipPlanType' | 'customDurationValue' | 'customDurationUnit', string>> = {};

    const fieldsToValidate: (keyof FormState)[] = [
      'type', 'title', 'description', 'coverImageUrl', 'price', 'language', 'level',
      'whatYouWillLearn', 'whyChooseThisCourseBenefits', 'idealFor'
    ];

    // Si es membresía, añadir los campos de membresía a validar
    if (formData.type === 'membership') {
      fieldsToValidate.push('membershipPlanType');
      if (formData.membershipPlanType === 'custom-duration') {
        fieldsToValidate.push('customDurationValue', 'customDurationUnit');
      }
    }

    fieldsToValidate.forEach(fieldName => {
      const value = formData[fieldName];

      let validatedValue: any = value;
      if (fieldName === 'price' && typeof value === 'string') {
        validatedValue = parseFloat(value) || '';
      }
      if (fieldName === 'customDurationValue' && typeof value === 'string') {
        validatedValue = parseFloat(value) || '';
      }

      const error = validateField(fieldName, validatedValue);

      if (error) {
        isValid = false;
        // Mapear el nombre del campo del estado al DTO si son diferentes
        const dtoFieldName: keyof CreateCourseDTO | 'type' | 'membershipPlanType' | 'customDurationValue' | 'customDurationUnit' =
          fieldName === 'whyChooseThisCourseBenefits' ? 'whyChooseThisCourse' :
          fieldName === 'membershipPlanType' || fieldName === 'customDurationValue' || fieldName === 'customDurationUnit' ? fieldName :
          fieldName as keyof CreateCourseDTO | 'type';
        currentErrors[dtoFieldName] = error;
      }
    });

    setFieldErrors(currentErrors);
    return isValid;
  }, [formData, validateField]);


  const handleInputChange = useCallback(<K extends keyof FormState>(
    fieldName: K,
    value: FormState[K]
  ) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value,
    }));

    // Disparar la validación.
    const dtoFieldName: keyof CreateCourseDTO | 'type' | 'membershipPlanType' | 'customDurationValue' | 'customDurationUnit' =
      fieldName === 'whyChooseThisCourseBenefits' ? 'whyChooseThisCourse' :
      fieldName === 'membershipPlanType' || fieldName === 'customDurationValue' || fieldName === 'customDurationUnit' ? fieldName :
      fieldName as keyof CreateCourseDTO | 'type';

    setFieldErrors(prev => ({
      ...prev,
      [dtoFieldName]: validateField(fieldName, value),
    }));
  }, [validateField]);


  const handleAddBenefit = useCallback((e: React.KeyboardEvent<HTMLInputElement> | React.MouseEvent<HTMLButtonElement>) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();

    const trimmedInput = currentBenefitInput.trim();

    if (trimmedInput.length < 5) {
      setFieldErrors(prev => ({
          ...prev,
          whyChooseThisCourse: 'Cada beneficio debe tener al menos 5 caracteres.',
      }));
      return;
    }

    if (trimmedInput && !formData.whyChooseThisCourseBenefits.includes(trimmedInput)) {
      const updatedBenefits = [...formData.whyChooseThisCourseBenefits, trimmedInput];
      setFormData(prev => ({
        ...prev,
        whyChooseThisCourseBenefits: updatedBenefits,
      }));
      setCurrentBenefitInput('');

      setFieldErrors(prev => ({
        ...prev,
        whyChooseThisCourse: validateField('whyChooseThisCourseBenefits', updatedBenefits),
      }));

    } else if (formData.whyChooseThisCourseBenefits.includes(trimmedInput)) {
      setFieldErrors(prev => ({
          ...prev,
          whyChooseThisCourse: undefined,
      }));
    }
  }, [currentBenefitInput, formData.whyChooseThisCourseBenefits, validateField]);


  const handleRemoveBenefit = useCallback((benefitToRemove: string) => {
    const updatedBenefits = formData.whyChooseThisCourseBenefits.filter(benefit => benefit !== benefitToRemove);
    setFormData(prev => ({
      ...prev,
      whyChooseThisCourseBenefits: updatedBenefits,
    }));

    setFieldErrors(prev => ({
      ...prev,
      whyChooseThisCourse: validateField('whyChooseThisCourseBenefits', updatedBenefits),
    }));
  }, [formData.whyChooseThisCourseBenefits, validateField]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateAll()) {
      toast.error('Por favor, corrige los errores en el formulario.');
      return;
    }

    setLoading(true);

    try {
      // Construir membershipDetails si el tipo es 'membership'
      let membershipDetails: MembershipDetails | undefined;
      if (formData.type === 'membership') {
        membershipDetails = {
          planType: formData.membershipPlanType as MembershipPlanType,
        };
        if (formData.membershipPlanType === 'custom-duration') {
          membershipDetails.customDuration = {
            value: typeof formData.customDurationValue === 'number' ? formData.customDurationValue : parseFloat(String(formData.customDurationValue)) || 0,
            unit: formData.customDurationUnit as CustomDurationDetails['unit'],
          };
        }
      }

      // Preparar el DTO para el backend
      const dto: CreateCourseDTO = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        coverImageUrl: formData.coverImageUrl.trim(),
        price: typeof formData.price === 'number' ? formData.price : parseFloat(String(formData.price)) || 0,
        language: formData.language.trim(),
        level: formData.level, // El nivel sigue siendo un campo libre de texto en este formulario
        tags: formData.tags?.split(',').map(t => t.trim()).filter(Boolean) || [],
        whatYouWillLearn: formData.whatYouWillLearn.split('\n').map(l => l.trim()).filter(Boolean),
        whyChooseThisCourse: formData.whyChooseThisCourseBenefits,
        idealFor: formData.idealFor.split('\n').map(l => l.trim()).filter(Boolean),
        moduleIds: initialData.moduleIds || [],
        type: formData.type as 'course' | 'membership',
        membershipDetails: membershipDetails, // AÑADIDO: Incluir membershipDetails en el DTO
      };

      const { id } = await createCourse(dto, token!);
      saveCourse(dto, id);
      toast.success('Curso guardado correctamente.');
      onNext();
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.error) { // Si el backend devuelve { error: "mensaje" }
        toast.error(err.response.data.error);
      } else if (err.response && err.response.data && err.response.data.errors) { // Si el backend devuelve errores de validación { errors: {campo: "mensaje"} }
        const serverErrors: Partial<Record<keyof CreateCourseDTO | 'type' | 'membershipPlanType' | 'customDurationValue' | 'customDurationUnit', string>> = {};
        for (const key in err.response.data.errors) {
          if (Object.prototype.hasOwnProperty.call(err.response.data.errors, key)) {
             // Mapeo inverso de los nombres de campo del DTO a los nombres del estado del formulario si son diferentes
            let formFieldName: keyof FormState | 'membershipPlanType' | 'customDurationValue' | 'customDurationUnit' = key as any; // Cast inicial
            if (key === 'whyChooseThisCourse') formFieldName = 'whyChooseThisCourseBenefits';
            // Para membershipDetails, si el backend devuelve un error general o específico
            if (key === 'membershipDetails.planType') formFieldName = 'membershipPlanType';
            if (key === 'membershipDetails.customDuration.value') formFieldName = 'customDurationValue';
            if (key === 'membershipDetails.customDuration.unit') formFieldName = 'customDurationUnit';

            serverErrors[formFieldName] = err.response.data.errors[key];
          }
        }
        setFieldErrors(serverErrors);
        toast.error('Error de validación del servidor. Revisa los campos.');
      } else {
        toast.error(err.message || 'Error al crear el curso.');
      }
    } finally {
      setLoading(false);
    }
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
                value={formData.type}
                onChange={e => handleInputChange('type', e.target.value as 'course' | 'membership' | '')}
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
              value={formData.coverImageUrl}
              onChange={e => handleInputChange('coverImageUrl', e.target.value)}
              placeholder="https://ejemplo.com/imagen.jpg"
              disabled={loading}
            />
            {fieldErrors.coverImageUrl && <span className={styles.errorMessage}>{fieldErrors.coverImageUrl}</span>}
            {showImagePreview && formData.coverImageUrl && (
                <img src={formData.coverImageUrl} alt="Previsualización" className={styles.imagePreview} />
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
            value={formData.title}
            onChange={e => handleInputChange('title', e.target.value)}
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
            value={formData.description}
            onChange={e => handleInputChange('description', e.target.value)}
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
              value={formData.price}
              onChange={e => handleInputChange('price', e.target.value === '' ? '' : parseFloat(e.target.value))}
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
              value={formData.language}
              onChange={e => handleInputChange('language', e.target.value)}
              placeholder="Ej: Español"
              disabled={loading}
            />
            {fieldErrors.language && <span className={styles.errorMessage}>{fieldErrors.language}</span>}
          </div>

          <div className={styles.formGroup}>
            {/* El campo 'level' ya no es "Nivel / Tipo Membresía" directamente,
                ya que el tipo de membresía se maneja por separado.
                Aquí debería ser solo "Nivel" (e.g., Principiante, Intermedio, Avanzado)
                o un campo relevante para los cursos si el tipo es 'course'.
                Para membresías, el 'level' podría usarse para "Standard", "Premium", etc.
                Lo mantengo por ahora, pero la etiqueta puede ajustarse.
            */}
            <label htmlFor="level" className={styles.label}>Nivel</label>
              <div className={styles.selectWrapper}>
                <select
                  id="level"
                  name="level"
                  className={`${styles.select} ${fieldErrors.level ? styles.invalid : ''}`}
                  value={formData.level}
                  onChange={e => handleInputChange('level', e.target.value)}
                  disabled={loading}
                >
                  <option value="">-- Selecciona un nivel --</option>
                  <option value="Principiante">Principiante</option>
                  <option value="Intermedio">Intermedio</option>
                  <option value="Avanzado">Avanzado</option>
                  {/* Puedes añadir más opciones o dejarlo como input de texto si es muy variado */}
                </select>
            </div>
            {fieldErrors.level && <span className={styles.errorMessage}>{fieldErrors.level}</span>}
          </div>
        </div>

        {/* AÑADIDO: Campos de membresía solo si el tipo es 'membership' */}
        {formData.type === 'membership' && (
          <>
            <h3 className={styles.sectionTitle}>Detalles de la Membresía</h3>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="membershipPlanType" className={styles.label}>Tipo de Plan</label>
                <div className={styles.selectWrapper}>
                  <select
                    id="membershipPlanType"
                    name="membershipPlanType"
                    className={`${styles.select} ${fieldErrors.membershipPlanType ? styles.invalid : ''}`}
                    value={formData.membershipPlanType}
                    onChange={e => handleInputChange('membershipPlanType', e.target.value as MembershipPlanType | '')}
                    disabled={loading}
                  >
                    <option value="">-- Selecciona un plan --</option>
                    <option value="one-time">Pago Único</option>
                    <option value="monthly">Mensual</option>
                    <option value="yearly">Anual</option>
                    <option value="six-months">Seis Meses</option>
                    <option value="custom-duration">Duración Personalizada</option>
                  </select>
                </div>
                {fieldErrors.membershipPlanType && <span className={styles.errorMessage}>{fieldErrors.membershipPlanType}</span>}
              </div>

              {formData.membershipPlanType === 'custom-duration' && (
                <>
                  <div className={styles.formGroup}>
                    <label htmlFor="customDurationValue" className={styles.label}>Duración Personalizada</label>
                    <input
                      id="customDurationValue"
                      name="customDurationValue"
                      type="number"
                      min="1"
                      className={`${styles.input} ${fieldErrors.customDurationValue ? styles.invalid : ''}`}
                      value={formData.customDurationValue}
                      onChange={e => handleInputChange('customDurationValue', e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                      placeholder="Ej: 30"
                      disabled={loading}
                    />
                    {fieldErrors.customDurationValue && <span className={styles.errorMessage}>{fieldErrors.customDurationValue}</span>}
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="customDurationUnit" className={styles.label}>Unidad de Duración</label>
                    <div className={styles.selectWrapper}>
                      <select
                        id="customDurationUnit"
                        name="customDurationUnit"
                        className={`${styles.select} ${fieldErrors.customDurationUnit ? styles.invalid : ''}`}
                        value={formData.customDurationUnit}
                        onChange={e => handleInputChange('customDurationUnit', e.target.value as CustomDurationDetails['unit'] | '')}
                        disabled={loading}
                      >
                        <option value="">-- Selecciona unidad --</option>
                        <option value="days">Días</option>
                        <option value="weeks">Semanas</option>
                        <option value="months">Meses</option>
                        <option value="years">Años</option>
                      </select>
                    </div>
                    {fieldErrors.customDurationUnit && <span className={styles.errorMessage}>{fieldErrors.customDurationUnit}</span>}
                  </div>
                </>
              )}
            </div>
          </>
        )}

        <div className={`${styles.formGroup} ${styles.fullWidth}`}>
          <label htmlFor="tags" className={styles.label}>Etiquetas (Opcional)</label>
          <input
            id="tags"
            name="tags"
            type="text"
            className={styles.input}
            value={formData.tags}
            onChange={e => handleInputChange('tags', e.target.value)}
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
            value={formData.whatYouWillLearn}
            onChange={e => handleInputChange('whatYouWillLearn', e.target.value)}
            placeholder="Escribe cada punto en una nueva línea..."
            disabled={loading}
          />
          {fieldErrors.whatYouWillLearn && <span className={styles.errorMessage}>{fieldErrors.whatYouWillLearn}</span>}
        </div>

        <div className={`${styles.formGroup} ${styles.fullWidth}`}>
            <label htmlFor="whyChooseThisCourseInput" className={styles.label}>
                ¿Por qué elegir este curso/membresía?
            </label>

            <div className={styles.benefitsInputContainer}>
                <input
                    id="whyChooseThisCourseInput"
                    type="text"
                    className={`${styles.input} ${fieldErrors.whyChooseThisCourse ? styles.invalid : ''}`}
                    value={currentBenefitInput}
                    onChange={e => {
                        setCurrentBenefitInput(e.target.value);
                        setFieldErrors(prev => ({ ...prev, whyChooseThisCourse: undefined }));
                    }}
                    onKeyDown={handleAddBenefit}
                    placeholder="Añade un beneficio y pulsa Enter"
                    disabled={loading}
                />
                <button
                    type="button"
                    className={styles.addBenefitButton}
                    onClick={handleAddBenefit}
                    disabled={loading || currentBenefitInput.trim().length < 5}
                >
                    Añadir
                </button>
            </div>

            {formData.whyChooseThisCourseBenefits.length > 0 && (
                <div className={styles.benefitsChipContainer}>
                    {formData.whyChooseThisCourseBenefits.map((benefit, index) => (
                        <span key={index} className={styles.benefitChip}>
                            {benefit}
                            <button
                                type="button"
                                className={styles.removeBenefitButton}
                                onClick={() => handleRemoveBenefit(benefit)}
                                disabled={loading}
                            >
                                &times;
                            </button>
                        </span>
                    ))}
                </div>
            )}

            {fieldErrors.whyChooseThisCourse && (
                <span className={styles.errorMessage}>{fieldErrors.whyChooseThisCourse}</span>
            )}
        </div>

        <div className={`${styles.formGroup} ${styles.fullWidth}`}>
          <label htmlFor="idealFor" className={styles.label}>Ideal para</label>
          <textarea
            id="idealFor"
            name="idealFor"
            rows={5}
            className={`${styles.textarea} ${fieldErrors.idealFor ? styles.invalid : ''}`}
            value={formData.idealFor}
            onChange={e => handleInputChange('idealFor', e.target.value)}
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