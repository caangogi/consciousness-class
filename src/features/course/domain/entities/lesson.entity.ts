
// src/features/course/domain/entities/lesson.entity.ts
export type LessonContentType = 'video' | 'audio' | 'documento_pdf' | 'texto_rico' | 'quiz';
export type MaterialAdicionalType = 'pdf' | 'zip' | 'enlace_externo' | 'codigo_fuente' | 'imagen';

export interface ContenidoPrincipal {
  tipo: LessonContentType;
  url?: string | null; // For video, audio, pdf
  texto?: string | null; // For texto_rico, quiz (JSON structure for quiz questions)
  duracionVideo?: number; // Duration in seconds for video/audio
}

export interface MaterialAdicional {
  id: string;
  nombre: string;
  url: string;
  tipo: MaterialAdicionalType;
  tamano?: string; // e.g., "2.5 MB"
}

export interface LessonProperties {
  id: string;
  moduleId: string;
  courseId: string; // Denormalized
  nombre: string;
  descripcionBreve?: string;
  contenidoPrincipal: ContenidoPrincipal;
  duracionEstimada: string; // e.g., "10 min", "5 páginas"
  esVistaPrevia: boolean;
  orden: number;
  materialesAdicionales?: MaterialAdicional[];
  fechaCreacion: string; // ISO Date string
  fechaActualizacion: string; // ISO Date string
}

export class LessonEntity {
  readonly id: string;
  readonly moduleId: string;
  readonly courseId: string;
  nombre: string;
  descripcionBreve: string;
  contenidoPrincipal: ContenidoPrincipal;
  duracionEstimada: string;
  esVistaPrevia: boolean;
  orden: number;
  materialesAdicionales: MaterialAdicional[];
  readonly fechaCreacion: Date;
  fechaActualizacion: Date;

  constructor(props: LessonProperties) {
    this.id = props.id;
    this.moduleId = props.moduleId;
    this.courseId = props.courseId;
    this.nombre = props.nombre;
    this.descripcionBreve = props.descripcionBreve || '';
    this.contenidoPrincipal = props.contenidoPrincipal;
    this.duracionEstimada = props.duracionEstimada;
    this.esVistaPrevia = props.esVistaPrevia;
    this.orden = props.orden;
    this.materialesAdicionales = props.materialesAdicionales || [];
    this.fechaCreacion = new Date(props.fechaCreacion);
    this.fechaActualizacion = new Date(props.fechaActualizacion);
  }

  static create(
    input: Omit<LessonProperties, 'id' | 'fechaCreacion' | 'fechaActualizacion' | 'materialesAdicionales'> & { id?: string }
  ): LessonEntity {
    const now = new Date();
    const id = input.id || crypto.randomUUID();
    const props: LessonProperties = {
      ...input,
      id,
      fechaCreacion: now.toISOString(),
      fechaActualizacion: now.toISOString(),
      materialesAdicionales: [],
    };
    return new LessonEntity(props);
  }

  update(data: Partial<Omit<LessonProperties, 'id' | 'moduleId' | 'courseId' | 'fechaCreacion'>>) {
    // If contenidoPrincipal is partially updated, merge it
    if (data.contenidoPrincipal) {
      this.contenidoPrincipal = { ...this.contenidoPrincipal, ...data.contenidoPrincipal };
      delete data.contenidoPrincipal; // Remove it from direct assignment
    }
    Object.assign(this, data);
    this.fechaActualizacion = new Date();
  }

  toPlainObject(): LessonProperties {
    return {
      id: this.id,
      moduleId: this.moduleId,
      courseId: this.courseId,
      nombre: this.nombre,
      descripcionBreve: this.descripcionBreve,
      contenidoPrincipal: this.contenidoPrincipal,
      duracionEstimada: this.duracionEstimada,
      esVistaPrevia: this.esVistaPrevia,
      orden: this.orden,
      materialesAdicionales: this.materialesAdicionales,
      fechaCreacion: this.fechaCreacion.toISOString(),
      fechaActualizacion: this.fechaActualizacion.toISOString(),
    };
  }
}
