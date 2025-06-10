
// src/features/course/domain/entities/module.entity.ts
export interface ModuleProperties {
  id: string;
  courseId: string;
  nombre: string;
  descripcion?: string;
  orden: number;
  fechaCreacion: string; // ISO Date string
  fechaActualizacion: string; // ISO Date string
  ordenLecciones?: string[]; // Array of lesson IDs
}

export class ModuleEntity {
  readonly id: string;
  readonly courseId: string;
  nombre: string;
  descripcion: string;
  orden: number;
  readonly fechaCreacion: Date;
  fechaActualizacion: Date;
  ordenLecciones: string[];

  constructor(props: ModuleProperties) {
    this.id = props.id;
    this.courseId = props.courseId;
    this.nombre = props.nombre;
    this.descripcion = props.descripcion || '';
    this.orden = props.orden;
    this.fechaCreacion = new Date(props.fechaCreacion);
    this.fechaActualizacion = new Date(props.fechaActualizacion);
    this.ordenLecciones = props.ordenLecciones || [];
  }

  static create(
    input: Omit<ModuleProperties, 'id' | 'fechaCreacion' | 'fechaActualizacion' | 'ordenLecciones'> & { id?: string }
  ): ModuleEntity {
    const now = new Date();
    const id = input.id || crypto.randomUUID();
    const props: ModuleProperties = {
      ...input,
      id,
      fechaCreacion: now.toISOString(),
      fechaActualizacion: now.toISOString(),
      ordenLecciones: [],
    };
    return new ModuleEntity(props);
  }

  update(data: Partial<Omit<ModuleProperties, 'id' | 'courseId' | 'fechaCreacion'>>) {
    Object.assign(this, data);
    this.fechaActualizacion = new Date();
  }

  toPlainObject(): ModuleProperties {
    return {
      id: this.id,
      courseId: this.courseId,
      nombre: this.nombre,
      descripcion: this.descripcion,
      orden: this.orden,
      fechaCreacion: this.fechaCreacion.toISOString(),
      fechaActualizacion: this.fechaActualizacion.toISOString(),
      ordenLecciones: this.ordenLecciones,
    };
  }
}
