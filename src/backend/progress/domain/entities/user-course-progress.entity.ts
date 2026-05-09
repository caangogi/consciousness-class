
// src/features/progress/domain/entities/user-course-progress.entity.ts
export interface UserCourseProgressProperties {
  userId: string;
  courseId: string;
  lessonIdsCompletadas: string[];
  porcentajeCompletado: number;
  fechaUltimaActualizacion: string; // ISO Date string
}

export class UserCourseProgressEntity {
  readonly userId: string;
  readonly courseId: string;
  lessonIdsCompletadas: string[];
  porcentajeCompletado: number;
  fechaUltimaActualizacion: Date;

  constructor(props: UserCourseProgressProperties) {
    this.userId = props.userId;
    this.courseId = props.courseId;
    this.lessonIdsCompletadas = props.lessonIdsCompletadas || [];
    this.porcentajeCompletado = props.porcentajeCompletado || 0;
    this.fechaUltimaActualizacion = new Date(props.fechaUltimaActualizacion);
  }

  static create(
    userId: string,
    courseId: string,
    initialLessonsCompleted: string[] = [],
    totalLessonsInCourse: number = 0
  ): UserCourseProgressEntity {
    const now = new Date();
    let percentage = 0;
    if (totalLessonsInCourse > 0) {
      percentage = Math.round((initialLessonsCompleted.length / totalLessonsInCourse) * 100);
    }

    const props: UserCourseProgressProperties = {
      userId,
      courseId,
      lessonIdsCompletadas: initialLessonsCompleted,
      porcentajeCompletado: percentage,
      fechaUltimaActualizacion: now.toISOString(),
    };
    return new UserCourseProgressEntity(props);
  }

  toggleLessonCompletion(lessonId: string, totalLessonsInCourse: number): void {
    const lessonIndex = this.lessonIdsCompletadas.indexOf(lessonId);
    if (lessonIndex > -1) {
      this.lessonIdsCompletadas.splice(lessonIndex, 1); // Marcar como no completada
    } else {
      this.lessonIdsCompletadas.push(lessonId); // Marcar como completada
    }
    this.recalculateProgress(totalLessonsInCourse);
    this.fechaUltimaActualizacion = new Date();
  }

  private recalculateProgress(totalLessonsInCourse: number): void {
    if (totalLessonsInCourse > 0) {
      this.porcentajeCompletado = Math.round(
        (this.lessonIdsCompletadas.length / totalLessonsInCourse) * 100
      );
    } else {
      this.porcentajeCompletado = 0;
    }
  }

  toPlainObject(): UserCourseProgressProperties {
    return {
      userId: this.userId,
      courseId: this.courseId,
      lessonIdsCompletadas: this.lessonIdsCompletadas,
      porcentajeCompletado: this.porcentajeCompletado,
      fechaUltimaActualizacion: this.fechaUltimaActualizacion.toISOString(),
    };
  }
}
