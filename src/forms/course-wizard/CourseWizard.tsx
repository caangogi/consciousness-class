'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import CourseForm from './CourseForm';
import ModuleManager from './ModuleManager';
import LessonManager from './LessonManager';
import MaterialManager from './MaterialManager';
import ReviewStep from './ReviewStep';
// Importamos el CreateCourseDTO actualizado que ahora incluye membershipDetails
import type { CreateCourseDTO, Course } from '@/lib/courseApi';
import type { Module } from '@/lib/moduleApi';
import type { LessonRecord as Lesson } from '@/lib/lessonApi';
import type { MaterialPersistence as Material } from '@/lib/materialApi';

import styles from '../styles/CourseWizard.module.scss';

const STEPS = ['Curso', 'Módulos', 'Lecciones', 'Materiales', 'Revisión'];

// Importamos los tipos de MembershipDetails del dominio para usarlos en DEFAULT_COURSE_STATE
import { MembershipDetails, MembershipPlanType, CustomDurationDetails } from '../../back/course/domain/Course'; // Ajusta la ruta si es necesario

// AHORA DEFAULT_COURSE_STATE DEBE INCLUIR membershipDetails SI CORRESPONDE
// Y asegurar que los tipos sean consistentes con CreateCourseDTO actualizado.
// Es importante que sea un tipo que se pueda extender o que ya incluya todas las propiedades posibles del Course.
const DEFAULT_COURSE_STATE: CreateCourseDTO & {
  id?: string;
  moduleIds: string[];
  createdAt?: string; // Hacemos opcional para la inicialización y se llena al guardar
  updatedAt?: string; // Hacemos opcional para la inicialización y se llena al guardar
  isPublished?: boolean; // Hacemos opcional para la inicialización y se llena al guardar
} = {
  title: '',
  description: '',
  coverImageUrl: '',
  price: 0,
  language: '',
  level: '',
  tags: [],
  whatYouWillLearn: [],
  whyChooseThisCourse: [],
  idealFor: [],
  moduleIds: [],
  type: 'course', // Default a 'course'
  membershipDetails: undefined, // Default a undefined
  // createdAt y updatedAt serán manejados por el backend o al guardar por primera vez.
  // isPublished también se manejará en el backend.
  // No los incluimos aquí para no tener que definirlos con valores dummy
  // si el backend los gestiona. Si la API exige que estén siempre presentes,
  // entonces sí los añadirías con valores por defecto.
};

interface WizardState {
  course: typeof DEFAULT_COURSE_STATE; // El tipo de course ahora incluye membershipDetails
  modules: Module[];
  lessons: Lesson[];
  materials: Material[];
}

export default function CourseWizard() {
  const { token } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isClient, setIsClient] = useState(false);

  const [state, setState] = useState<WizardState>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('wizard');
      if (saved) {
        try {
          const parsed: Partial<WizardState> = JSON.parse(saved);
          return {
            // Aseguramos que los valores por defecto se fusionen correctamente,
            // incluyendo membershipDetails si existen en parsed.course
            course: { ...DEFAULT_COURSE_STATE, ...(parsed.course || {}) },
            modules: parsed.modules || [],
            lessons: parsed.lessons || [],
            materials: parsed.materials || [],
          };
        } catch (error) {
          console.error('Error parsing wizard state from localStorage:', error);
          localStorage.removeItem('wizard');
        }
      }
    }
    return {
      course: DEFAULT_COURSE_STATE,
      modules: [],
      lessons: [],
      materials: [],
    };
  });

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Persistencia en localStorage con debounce
  useEffect(() => {
    if (!isClient) return;
    const timer = setTimeout(() => {
      // Limpiar datos temporales antes de guardar si no hay un ID de curso
      // Y si estamos en el paso 0 con todo lo demás vacío
      if (!state.course.id && step === 0 && state.modules.length === 0 && state.lessons.length === 0 && state.materials.length === 0) {
        localStorage.removeItem('wizard');
      } else {
        localStorage.setItem('wizard', JSON.stringify(state));
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [state, isClient, step]);

  const saveCourse = useCallback((dto: CreateCourseDTO, id: string) => {
    setState(prev => ({
      ...prev,
      course: {
        ...dto, // Aquí 'dto' ya incluye membershipDetails
        id,
        // Mantenemos createdAt, updatedAt, isPublished si ya existen o los inicializamos si no
        createdAt: prev.course.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isPublished: prev.course.isPublished || false,
        // moduleIds se deben mantener si el DTO no los incluye o si queremos fusionar
        // dado que CreateCourseDTO del frontend ya incluye moduleIds, esto debería estar bien
        moduleIds: dto.moduleIds || prev.course.moduleIds || [],
      },
    }));
  }, []);

  const addModule = useCallback((module: Module) => {
    setState(prev => ({
      ...prev,
      modules: [...prev.modules, module],
      course: {
        ...prev.course,
        moduleIds: [...prev.course.moduleIds, module.id],
      },
    }));
  }, []);

  const addLesson = useCallback((lesson: Lesson) => {
    setState(prev => ({
      ...prev,
      lessons: [...prev.lessons, lesson],
    }));
  }, []);

  const addMaterial = useCallback((material: Material) => {
    setState(prev => ({
      ...prev,
      materials: [...prev.materials, material],
    }));
  }, []);

  const canNavigateToStep = useCallback((targetStep: number): boolean => {
    if (targetStep < step) return true;

    if (targetStep === step) return true;

    switch (step) {
      case 0:
        // Solo puede avanzar si el curso tiene un ID (ya fue guardado)
        return targetStep === 1 && !!state.course.id;
      case 1:
        // Puede avanzar del paso de módulos al de lecciones (sin validación estricta de módulos creados aquí,
        // la validación real la haría ModuleManager)
        return targetStep === 2;
      case 2:
        return targetStep === 3;
      case 3:
        return targetStep === 4;
      case 4:
        return false;
      default:
        return false;
    }
  }, [step, state.course.id]);

  const renderStepContent = useMemo(() => {
    // Si no hay ID de curso y no estamos en el primer paso, obligamos a volver al primer paso.
    // Esto asegura que CourseForm se use para crear/guardar el curso inicialmente.
    if (!state.course.id && step !== 0) {
      return (
        <div className={styles.missingCourseInfo}>
          <p>Para continuar, primero debes guardar la información del curso.</p>
          <button onClick={() => setStep(0)} className={styles.actionButton}>
            Volver a Información del Curso
          </button>
        </div>
      );
    }

    switch (step) {
      case 0:
        return (
          <CourseForm
            initialData={state.course} // state.course ahora incluye membershipDetails
            onNext={() => { if (state.course.id) setStep(1); }} // Solo avanza si hay ID
            saveCourse={saveCourse}
          />
        );
      case 1:
        return (
          <ModuleManager
            courseId={state.course.id!}
            modules={state.modules}
            onAddModule={addModule}
            onBack={() => setStep(0)}
            onNext={() => setStep(2)}
          />
        );
      case 2:
        return (
          <LessonManager
            courseId={state.course.id!}
            modules={state.modules}
            lessons={state.lessons}
            onAddLesson={addLesson}
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
          />
        );
      case 3:
        return (
          <MaterialManager
            courseId={state.course.id!}
            modules={state.modules}
            lessons={state.lessons}
            onAddMaterial={addMaterial}
            onBack={() => setStep(2)}
            onNext={() => setStep(4)}
          />
        );
      case 4:
        return (
          <ReviewStep
            course={state.course as Course}
            modules={state.modules}
            lessons={state.lessons}
            materials={state.materials}
            onBack={() => setStep(3)}
            onPublish={() => router.push(`/course/${state.course.id}`)}
          />
        );
      default:
        return null;
    }
  }, [step, state, saveCourse, addModule, addLesson, addMaterial, router]);


  if (!isClient) {
    return <div className={styles.wizardContainer}><p>Cargando asistente...</p></div>;
  }

  if (!token) {
    return (
      <div className={styles.wizardContainer}>
        <div className={styles.accessDeniedContainer}>
          <h3 className={styles.title}>Acceso Denegado</h3>
          <p className={styles.message}>Por favor, inicia sesión para crear o editar un curso.</p>
          <button onClick={() => router.push('/login')} className={styles.actionButton}>
            Iniciar Sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wizardContainer}>
      <div className={styles.wizardCard}>
        <div className={styles.wizardHeader}>
          <h1 className={styles.title}>Creación de Curso</h1>
          <div className={styles.progressBarContainer}>
            <div
              className={styles.progressBar}
              style={{ width: `${(step / (STEPS.length - 1)) * 100}%` }}
              role="progressbar"
              aria-valuenow={(step / (STEPS.length - 1)) * 100}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>

        <ul className={styles.stepTabs}>
          {STEPS.map((label, index) => {
            const isActive = index === step;
            const isDisabled = !canNavigateToStep(index);
            const isCompleted = index < step && (index === 0 ? !!state.course.id : true);

            return (
              <li className={styles.stepTabItem} key={label}>
                <button
                  className={`
                    ${styles.stepTabButton}
                    ${isActive ? styles.active : ''}
                    ${isDisabled ? styles.disabled : ''}
                    ${isCompleted && !isActive ? styles.completed : ''}
                  `}
                  onClick={() => {
                    if (canNavigateToStep(index)) {
                        setStep(index);
                    }
                  }}
                  disabled={isDisabled}
                >
                  <span className={styles.stepNumber}>{index + 1}</span>
                  {label}
                </button>
              </li>
            );
          })}
        </ul>

        <div className={styles.stepContent}>
          {renderStepContent}
        </div>
      </div>
    </div>
  );
}