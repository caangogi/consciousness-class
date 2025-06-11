
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
  dataAiHintImagenPortada?: string | null; 
  videoTrailerUrl?: string | null;
  categoria: string; 
  creadorUid: string; 
  estado: CourseStatus;
  fechaCreacion: string; // ISO Date string
  fechaActualizacion: string; // ISO Date string
  fechaPublicacion?: string | null; // ISO Date string
  ratingPromedio?: number; 
  totalEstudiantes?: number; // Calculated or aggregated
  totalResenas?: number; 
  requisitos?: string[];
  objetivosAprendizaje?: string[];
  publicoObjetivo?: string;
  ordenModulos?: string[]; 
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
  dataAiHintImagenPortada: string | null;
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
    this.dataAiHintImagenPortada = props.dataAiHintImagenPortada ?? null;
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
    const id = input.id || crypto.randomUUID(); 

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
      dataAiHintImagenPortada: input.dataAiHintImagenPortada ?? null,
    };
    return new CourseEntity(props);
  }

  update(data: Partial<Omit<CourseProperties, 'id' | 'creadorUid' | 'fechaCreacion'>>) {
    const oldStatus = this.estado;

    if (data.nombre !== undefined) this.nombre = data.nombre;
    if (data.descripcionCorta !== undefined) this.descripcionCorta = data.descripcionCorta;
    if (data.descripcionLarga !== undefined) this.descripcionLarga = data.descripcionLarga;
    if (data.precio !== undefined) this.precio = data.precio;
    if (data.tipoAcceso !== undefined) this.tipoAcceso = data.tipoAcceso;
    if (data.duracionEstimada !== undefined) this.duracionEstimada = data.duracionEstimada;
    if (data.imagenPortadaUrl !== undefined) this.imagenPortadaUrl = data.imagenPortadaUrl;
    if (data.dataAiHintImagenPortada !== undefined) this.dataAiHintImagenPortada = data.dataAiHintImagenPortada;
    if (data.videoTrailerUrl !== undefined) this.videoTrailerUrl = data.videoTrailerUrl;
    if (data.categoria !== undefined) this.categoria = data.categoria;
    if (data.estado !== undefined) this.estado = data.estado;
    if (data.ratingPromedio !== undefined) this.ratingPromedio = data.ratingPromedio;
    if (data.totalEstudiantes !== undefined) this.totalEstudiantes = data.totalEstudiantes;
    if (data.totalResenas !== undefined) this.totalResenas = data.totalResenas;
    if (data.requisitos !== undefined) this.requisitos = data.requisitos;
    if (data.objetivosAprendizaje !== undefined) this.objetivosAprendizaje = data.objetivosAprendizaje;
    if (data.publicoObjetivo !== undefined) this.publicoObjetivo = data.publicoObjetivo;
    if (data.ordenModulos !== undefined) this.ordenModulos = data.ordenModulos;
    
    this.fechaActualizacion = new Date();

    if (this.estado === 'publicado' && oldStatus !== 'publicado') {
      this.fechaPublicacion = new Date();
    } else if (data.fechaPublicacion === null) { 
        this.fechaPublicacion = null;
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
      dataAiHintImagenPortada: this.dataAiHintImagenPortada,
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
