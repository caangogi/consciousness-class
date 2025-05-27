'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import CourseForm from './CourseForm'; // Asumiendo que está en la misma carpeta o subcarpeta
import ModuleManager from './ModuleManager';
import LessonManager from './LessonManager';
import MaterialManager from './MaterialManager';
import ReviewStep from './ReviewStep';
import type { CreateCourseDTO, Course } from '@/lib/courseApi';
import type { Module } from '@/lib/moduleApi';
import type { LessonRecord as Lesson } from '@/lib/lessonApi';
import type { MaterialPersistence as Material } from '@/lib/materialApi';

import styles from '../styles/CourseWizard.module.scss'; // Importar el módulo SCSS

const steps = ['Curso', 'Módulos', 'Lecciones', 'Materiales', 'Revisión'];

interface WizardState {
  course: CreateCourseDTO & { id?: string; moduleIds: string[] } & Pick<Course, 'createdAt' | 'updatedAt' | 'isPublished'>;
  modules: Module[];
  lessons: Lesson[];
  materials: Material[];
}

export default function CourseWizard() {
  const { token } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isClient, setIsClient] = useState(false); // Para evitar hydration mismatch con localStorage
  const [state, setState] = useState<WizardState>({
    course: {
      id: undefined,
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPublished: false,
      type: 'course'
    },
    modules: [],
    lessons: [],
    materials: [],
  });

  useEffect(() => {
    setIsClient(true); // Marcar que estamos en el cliente para leer localStorage
  }, []);
  
  // Persistencia en localStorage con debounce
  useEffect(() => {
    if (!isClient) return; // No operar en el servidor
    const timer = setTimeout(() => {
      localStorage.setItem('wizard', JSON.stringify(state));
    }, 500);
    return () => clearTimeout(timer);
  }, [state, isClient]);

  // Hidratación inicial
  useEffect(() => {
    if (!isClient) return; // No operar en el servidor
    const saved = localStorage.getItem('wizard');
    if (saved) {
      try {
        const parsed: Partial<WizardState> = JSON.parse(saved);
        setState(prev => ({
          ...prev,
          ...parsed,
          course: { ...prev.course, ...(parsed.course || {}) },
          modules: parsed.modules ?? prev.modules,
          lessons: parsed.lessons ?? prev.lessons,
          materials: parsed.materials ?? prev.materials,
        }));
      } catch {
        localStorage.removeItem('wizard');
      }
    }
  }, [isClient]);

  const saveCourse = (dto: CreateCourseDTO, id: string) => {
    setState(prev => ({
      ...prev,
      course: {
        ...dto,
        id,
        moduleIds: prev.course.moduleIds || [], // Mantener moduleIds si ya existen
        createdAt: prev.course.createdAt,
        updatedAt: new Date().toISOString(), // Actualizar updatedAt
        isPublished: prev.course.isPublished,
      },
    }));
  };

  const addModule = (module: Module) => {
    setState(prev => ({
      ...prev,
      modules: [...prev.modules, module],
      course: {
        ...prev.course,
        moduleIds: [...prev.course.moduleIds, module.id],
      },
    }));
  };

  const addLesson = (lesson: Lesson) => {
    setState(prev => ({
      ...prev,
      lessons: [...prev.lessons, lesson],
    }));
  };

  const addMaterial = (material: Material) => {
    setState(prev => ({
      ...prev,
      materials: [...prev.materials, material],
    }));
  };

  const canNavigateToStep = (targetStep: number): boolean => {
    if (targetStep < step) return true; // Siempre se puede ir a pasos anteriores
    if (targetStep === step) return true;
    // Para ir al paso siguiente, el curso (paso 0) debe estar guardado (tener ID)
    if (targetStep > 0 && !state.course.id) return false;
    // Lógica adicional si se requiere que pasos intermedios estén "completos"
    // Por ahora, permitimos avanzar si el curso base está creado.
    return true;
  };

  if (!token && isClient) { // Asegurarse que se renderiza solo en cliente si no hay token
    return (
        <div className={styles.wizardContainer}>
            <div className={styles.accessDeniedContainer}>
                {/* <span className={styles.icon}>⚠️</span>  Puedes usar un SVG o un icono de librería aquí */}
                <h3 className={styles.title}>Acceso Denegado</h3>
                <p className={styles.message}>Por favor, inicia sesión para crear o editar un curso.</p>
                <button onClick={() => router.push('/login')} className={styles.actionButton}>
                    Iniciar Sesión
                </button>
            </div>
        </div>
    );
  }
  if (!isClient) { // Evitar renderizar el wizard en SSR si depende de localStorage o token
      return <div className={styles.wizardContainer}><p>Cargando asistente...</p></div>; // O un spinner
  }


  return (
    <div className={styles.wizardContainer}>
      <div className={styles.wizardCard}>
        <div className={styles.wizardHeader}>
          <h1 className={styles.title}>Creación de Curso</h1>
          <div className={styles.progressBarContainer}>
            <div
              className={styles.progressBar}
              style={{ width: `${(step / (steps.length - 1)) * 100}%` }}
              aria-valuenow={(step / (steps.length - 1)) * 100}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>

        <ul className={styles.stepTabs}>
          {steps.map((label, index) => {
            const isCompleted = index < step && (index === 0 ? !!state.course.id : true); // El paso 0 se considera completado si hay course.id
            const isActive = index === step;
            const isDisabled = !canNavigateToStep(index) || (index > step && !isCompleted && index !== step+1 && !state.course.id) ; // Más restrictivo para saltar pasos

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
          {step === 0 && (
            <CourseForm
              initialData={state.course}
              onNext={() => { if (state.course.id) setStep(1);}}
              saveCourse={saveCourse}
            />
          )}
          {step === 1 && state.course.id && (
            <ModuleManager
              courseId={state.course.id!}
              modules={state.modules}
              onAddModule={addModule}
              onBack={() => setStep(0)}
              onNext={() => setStep(2)}
            />
          )}
          {step === 2 && state.course.id && (
            <LessonManager
              courseId={state.course.id!}
              modules={state.modules}
              lessons={state.lessons}
              onAddLesson={addLesson}
              onBack={() => setStep(1)}
              onNext={() => setStep(3)}
            />
          )}
          {step === 3 && state.course.id && (
            <MaterialManager
              courseId={state.course.id!}
              modules={state.modules}
              lessons={state.lessons}
              onAddMaterial={addMaterial}
              onBack={() => setStep(2)}
              onNext={() => setStep(4)}
            />
          )}
          {step === 4 && state.course.id && (
            <ReviewStep
              course={state.course as Course}
              modules={state.modules}
              lessons={state.lessons}
              materials={state.materials}
              onBack={() => setStep(3)}
              onPublish={() => router.push(`/course/${state.course.id}`)}
            />
          )}
        </div>
      </div>
    </div>
  );
}