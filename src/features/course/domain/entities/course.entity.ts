
// src/features/course/domain/entities/course.entity.ts
export type CourseAccessType = 'unico' | 'suscripcion';
export type CourseStatus = 'borrador' | 'en_revision' | 'publicado' | 'rechazado' | 'archivado';
export type CourseDifficulty = 'principiante' | 'intermedio' | 'avanzado' | 'todos_los_niveles';

export interface CourseProperties {
  id: string;
  nombre: string;
  descripcionCorta: string;
  descripcionLarga: string; // HTML content
  precio: number;
  tipoAcceso: CourseAccessType;
  duracionEstimada: string; // e.g., "25 horas de video", "10 semanas"
  imagenPortadaUrl: string | null;
  dataAiHintImagenPortada?: string | null; // Allow null
  videoTrailerUrl?: string | null;
  categoria: string; // Could be an ID to a categories collection later
  creadorUid: string; // UID of the UserEntity (creator)
  estado: CourseStatus;
  fechaCreacion: string; // ISO Date string
  fechaActualizacion: string; // ISO Date string
  fechaPublicacion?: string | null; // ISO Date string
  ratingPromedio?: number; // Calculated or aggregated
  totalEstudiantes?: number; // Calculated or aggregated
  totalResenas?: number; // Calculated or aggregated
  requisitos?: string[];
  objetivosAprendizaje?: string[];
  publicoObjetivo?: string;
  ordenModulos?: string[]; // Array of module IDs to maintain order
}

export class CourseEntity {
  readonly id: string;
  nombre: string;
  descripcionCorta: string;
  descripcionLarga: string;
  precio: number;
  tipoAcceso: CourseAccessType;
  duracionEstimada: string;
  imagenPortadaUrl: string | null;
  dataAiHintImagenPortada: string | null; // Changed from optional string to string | null
  videoTrailerUrl: string | null;
  categoria: string;
  readonly creadorUid: string;
  estado: CourseStatus;
  readonly fechaCreacion: Date;
  fechaActualizacion: Date;
  fechaPublicacion: Date | null;
  ratingPromedio: number;
  totalEstudiantes: number;
  totalResenas: number;
  requisitos: string[];
  objetivosAprendizaje: string[];
  publicoObjetivo: string;
  ordenModulos: string[];

  constructor(props: CourseProperties) {
    this.id = props.id;
    this.nombre = props.nombre;
    this.descripcionCorta = props.descripcionCorta;
    this.descripcionLarga = props.descripcionLarga;
    this.precio = props.precio;
    this.tipoAcceso = props.tipoAcceso;
    this.duracionEstimada = props.duracionEstimada;
    this.imagenPortadaUrl = props.imagenPortadaUrl || null;
    this.dataAiHintImagenPortada = props.dataAiHintImagenPortada ?? null; // Ensure it's null if undefined/null
    this.videoTrailerUrl = props.videoTrailerUrl || null;
    this.categoria = props.categoria;
    this.creadorUid = props.creadorUid;
    this.estado = props.estado;
    this.fechaCreacion = new Date(props.fechaCreacion);
    this.fechaActualizacion = new Date(props.fechaActualizacion);
    this.fechaPublicacion = props.fechaPublicacion ? new Date(props.fechaPublicacion) : null;
    this.ratingPromedio = props.ratingPromedio || 0;
    this.totalEstudiantes = props.totalEstudiantes || 0;
    this.totalResenas = props.totalResenas || 0;
    this.requisitos = props.requisitos || [];
    this.objetivosAprendizaje = props.objetivosAprendizaje || [];
    this.publicoObjetivo = props.publicoObjetivo || '';
    this.ordenModulos = props.ordenModulos || [];
  }

  static create(
    input: Omit<CourseProperties, 'id' | 'fechaCreacion' | 'fechaActualizacion' | 'estado' | 'ratingPromedio' | 'totalEstudiantes' | 'totalResenas' | 'ordenModulos'> & { id?: string }
  ): CourseEntity {
    const now = new Date();
    const id = input.id || crypto.randomUUID(); // Generate UUID if not provided

    const props: CourseProperties = {
      ...input,
      id,
      estado: 'borrador',
      fechaCreacion: now.toISOString(),
      fechaActualizacion: now.toISOString(),
      fechaPublicacion: null,
      ratingPromedio: 0,
      totalEstudiantes: 0,
      totalResenas: 0,
      ordenModulos: [],
      imagenPortadaUrl: input.imagenPortadaUrl || null,
      // dataAiHintImagenPortada will be handled by the constructor if input.dataAiHintImagenPortada is undefined
    };
    return new CourseEntity(props);
  }

  update(data: Partial<Omit<CourseProperties, 'id' | 'creadorUid' | 'fechaCreacion'>>) {
    Object.assign(this, data);
    if (data.dataAiHintImagenPortada === undefined && this.dataAiHintImagenPortada !== null) {
      // If explicitly set to undefined in update, make it null (or handle as per logic)
      // For now, let's assume direct assignment is fine, or it gets filtered if truly undefined.
      // However, if data can contain 'undefined', it's better to handle it.
      // For this specific field, it's more likely to be string or null.
    }

    this.fechaActualizacion = new Date();
    if (data.estado === 'publicado' && this.estado !== 'publicado') {
      this.fechaPublicacion = new Date();
    }
  }

  toPlainObject(): CourseProperties {
    return {
      id: this.id,
      nombre: this.nombre,
      descripcionCorta: this.descripcionCorta,
      descripcionLarga: this.descripcionLarga,
      precio: this.precio,
      tipoAcceso: this.tipoAcceso,
      duracionEstimada: this.duracionEstimada,
      imagenPortadaUrl: this.imagenPortadaUrl,
      dataAiHintImagenPortada: this.dataAiHintImagenPortada, // Will now be string or null
      videoTrailerUrl: this.videoTrailerUrl,
      categoria: this.categoria,
      creadorUid: this.creadorUid,
      estado: this.estado,
      fechaCreacion: this.fechaCreacion.toISOString(),
      fechaActualizacion: this.fechaActualizacion.toISOString(),
      fechaPublicacion: this.fechaPublicacion ? this.fechaPublicacion.toISOString() : null,
      ratingPromedio: this.ratingPromedio,
      totalEstudiantes: this.totalEstudiantes,
      totalResenas: this.totalResenas,
      requisitos: this.requisitos,
      objetivosAprendizaje: this.objetivosAprendizaje,
      publicoObjetivo: this.publicoObjetivo,
      ordenModulos: this.ordenModulos,
    };
  }
}
