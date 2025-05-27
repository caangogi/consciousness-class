'use client';

import React from 'react';
import type { Course } from '@/lib/courseApi';
import type { Module } from '@/lib/moduleApi';
import type { LessonRecord as Lesson } from '@/lib/lessonApi';
import type { MaterialPersistence as Material } from '@/lib/materialApi';

import styles from '../styles/ReviewStep.module.scss'; // Importar el módulo SCSS

interface ReviewStepProps {
  course: Course;
  modules: Module[];
  lessons: Lesson[];
  materials: Material[];
  onBack: () => void;
  onPublish: () => void;
}

export default function ReviewStep({
  course,
  modules,
  lessons,
  materials,
  onBack,
  onPublish,
}: ReviewStepProps) {
  const handlePublish = () => {
    // Limpiar el wizard guardado
    localStorage.removeItem('wizard');
    onPublish();
  };

  // Función auxiliar para extraer el nombre del archivo de la URL
  const getFileNameFromUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      const decodedPath = decodeURIComponent(urlObj.pathname);
      const parts = decodedPath.split('/');
      return parts[parts.length - 1] || 'Archivo sin nombre';
    } catch (e) {
      return url;
    }
  };

  // Función auxiliar para obtener el icono/miniatura según el tipo de material
  const getMaterialThumbnail = (material: Material) => {
    switch (material.type) {
      case 'video':
        return <span className={styles.materialIcon}>🎬</span>; // O un SVG de video
      case 'audio':
        return <span className={styles.materialIcon}>🎵</span>; // O un SVG de audio
      case 'pdf':
        return <span className={styles.materialIcon}>📄</span>; // O un SVG de PDF
      case 'image':
        // Si hay una URL de miniatura real en el futuro, usarla aquí.
        // Por ahora, si es una imagen, podemos mostrar una miniatura si la URL lo permite
        // o un icono genérico. Para esta revisión, usaremos la URL completa de la imagen.
        return (
            <img
                src={material.url}
                alt={getFileNameFromUrl(material.url)}
                className={styles.materialImageThumbnail}
                onError={(e) => { // Fallback en caso de que la imagen no cargue
                    e.currentTarget.src = 'https://via.placeholder.com/60?text=IMG'; // Placeholder
                    e.currentTarget.className = styles.materialIconPlaceholder; // Aplicar clase de icono si falla
                }}
            />
        );
      default:
        return <span className={styles.materialIcon}>📦</span>; // Icono genérico
    }
  };


  return (
    <div className={styles.reviewStep}>
      <h2 className={styles.sectionTitle}>Revisa los Detalles de tu Curso</h2>

      {/* Datos del Curso */}
      <div className={styles.reviewCard}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>Información General del Curso</h3>
        </div>
        <div className={styles.cardBody}>
          <p className={styles.detailItem}>
            <strong className={styles.detailLabel}>Título:</strong> <span className={styles.detailValue}>{course.title}</span>
          </p>
          <p className={styles.detailItem}>
            <strong className={styles.detailLabel}>Descripción:</strong> <span className={styles.detailValue}>{course.description}</span>
          </p>
          {course.coverImageUrl && (
            <div className={styles.coverImageContainer}>
              <strong className={styles.detailLabel}>Imagen de Portada:</strong>
              <img
                src={course.coverImageUrl}
                alt="Portada del curso"
                className={styles.coverImage}
              />
            </div>
          )}
          <p className={styles.detailItem}>
            <strong className={styles.detailLabel}>Precio:</strong> <span className={styles.detailValue}>${course.price.toFixed(2)}</span>
          </p>
          <p className={styles.detailItem}>
            <strong className={styles.detailLabel}>Idioma:</strong> <span className={styles.detailValue}>{course.language}</span>
          </p>
          <p className={styles.detailItem}>
            <strong className={styles.detailLabel}>Nivel:</strong> <span className={styles.detailValue}>{course.level}</span>
          </p>
          { (course.tags && course.tags.length > 0) && (
              <p className={styles.detailItem}>
                <strong className={styles.detailLabel}>Etiquetas:</strong>{' '}
                <span className={styles.detailValue}>
                  {course.tags.map(tag => (
                    <span key={tag} className={styles.tagBadge}>{tag}</span>
                  ))}
                </span>
              </p>
            )
          }
        </div>
      </div>

      {/* Estructura de Contenido */}
      <div className={styles.reviewCard}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>Estructura del Contenido</h3>
        </div>
        <div className={styles.cardBody}>
          {modules.length === 0 ? (
            <p className={styles.emptyState}>No hay módulos creados para este curso.</p>
          ) : (
            modules
              .sort((a, b) => a.order - b.order)
              .map(mod => (
                <div key={mod.id} className={styles.moduleSection}>
                  <h4 className={styles.moduleTitle}>
                    {mod.title} <span className={styles.moduleOrder}>(Orden {mod.order})</span>
                  </h4>
                  <ul className={styles.lessonList}>
                    {lessons
                      .filter(l => l.moduleId === mod.id)
                      .sort((a, b) => a.order - b.order)
                      .map(l => (
                        <li key={l.id} className={styles.lessonItem}>
                          {l.title}
                        </li>
                      ))}
                    {lessons.filter(l => l.moduleId === mod.id).length === 0 && (
                      <li className={styles.emptyLessonItem}>No hay lecciones en este módulo.</li>
                    )}
                  </ul>
                </div>
              ))
          )}
        </div>
      </div>

      {/* Materiales Adjuntos - ¡Aquí es donde cambiaremos! */}
      <div className={styles.reviewCard}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>Materiales Adjuntos por Lección</h3>
        </div>
        <div className={styles.cardBody}>
          {materials.length === 0 ? (
            <p className={styles.emptyState}>No hay materiales adjuntos a ninguna lección.</p>
          ) : (
            // Agrupar materiales por lección para una mejor visualización
            lessons.sort((a, b) => a.order - b.order).map(lesson => {
                const materialsForLesson = materials.filter(m => m.lessonId === lesson.id);
                if (materialsForLesson.length === 0) {
                    return null; // No mostrar la lección si no tiene materiales
                }
                return (
                    <div key={lesson.id} className={styles.lessonMaterialsGroup}>
                        <h5 className={styles.lessonMaterialsTitle}>
                            <span className={styles.lessonMaterialsTitleIcon}>📚</span>
                            {lesson.title}
                        </h5>
                        <div className={styles.materialsGrid}>
                            {materialsForLesson.map(mat => (
                                <div key={mat.id} className={styles.materialThumbnailCard}>
                                    <div className={styles.thumbnailContent}>
                                        {getMaterialThumbnail(mat)}
                                        <span className={styles.thumbnailFileName}>{getFileNameFromUrl(mat.url)}</span>
                                    </div>
                                    <a
                                        href={mat.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={styles.thumbnailViewButton}
                                    >
                                        Ver
                                    </a>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })
          )}
        </div>
      </div>

      {/* Acciones */}
      <div className={styles.formActions}>
        <button className={styles.buttonSecondary} onClick={onBack}>
          Atrás
        </button>
        <button className={styles.buttonPrimary} onClick={handlePublish}>
          Publicar Curso
        </button>
      </div>
    </div>
  );
}