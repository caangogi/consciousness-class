'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import CourseForm from './CourseForm';
import ModuleManager from './ModuleManager';
import LessonManager from './LessonManager';
import MaterialManager from './MaterialManager';
import ReviewStep from './ReviewStep';
import type { CreateCourseDTO, Course } from '@/lib/courseApi';
import type { Module } from '@/lib/moduleApi';
import type { LessonRecord as Lesson } from '@/lib/lessonApi';
import type { MaterialPersistence as Material } from '@/lib/materialApi';

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
      enrollCallToAction: '',
      moduleIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPublished: false,
    },
    modules: [],
    lessons: [],
    materials: [],
  });

  // Persistencia en localStorage con debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('wizard', JSON.stringify(state));
    }, 500);
    return () => clearTimeout(timer);
  }, [state]);

  // Hidratación inicial
  useEffect(() => {
    const saved = localStorage.getItem('wizard');
    if (saved) {
      try {
        const parsed: Partial<WizardState> = JSON.parse(saved);
        // Merge saved state with defaults
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
  }, []);

  /** Guarda en el estado del wizard el DTO completo + el id devuelto por el API */
  const saveCourse = (dto: CreateCourseDTO, id: string) => {
    setState(prev => ({
      ...prev,
      course: {
        ...dto,
        id,
        moduleIds: [],
        createdAt: prev.course.createdAt,
        updatedAt: prev.course.updatedAt,
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

  if (!token) return <p>Acceso denegado</p>;

  return (
    <div className="container mt-4">
      <div className="card-header">
        <h4 className="mb-2">Creación de Curso</h4>
        {/* Progress Bar */}
        <div className="progress" style={{ height: '6px' }}>
          <div
            className="progress-bar bg-primary"
            role="progressbar"
            style={{ width: `${(step / (steps.length - 1)) * 100}%` }}
            aria-valuenow={(step / (steps.length - 1)) * 100}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>

        {/* Step Tabs */}
        <ul className="nav nav-tabs mt-4">
          {steps.map((label, index) => (
            <li className="nav-item" key={label}>
              <button
                className={`nav-link ${index === step ? 'active' : ''}`}
                onClick={() => setStep(index)}
                disabled={index > step + 1} 
              >
                {label}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div >
        {step === 0 && (
          <CourseForm
            initialData={state.course}
            onNext={() => setStep(1)}
            saveCourse={saveCourse}
          />
        )}

        {step === 1 && (
          <ModuleManager
            courseId={state.course.id!}
            modules={state.modules}
            onAddModule={addModule}
            onBack={() => setStep(0)}
            onNext={() => setStep(2)}
          />
        )}

        {step === 2 && (
          <LessonManager
            courseId={state.course.id!}
            modules={state.modules}
            lessons={state.lessons}
            onAddLesson={addLesson}
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
          />
        )}

        {step === 3 && (
          <MaterialManager
            courseId={state.course.id!}
            modules={state.modules}
            lessons={state.lessons}
            onAddMaterial={addMaterial}
            onBack={() => setStep(2)}
            onNext={() => setStep(4)}
          />
        )}

        {step === 4 && (
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
  );
}
