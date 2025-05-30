// src/back/material/domain/Material.ts

import { UniqueEntityID } from '../../share/utils/UniqueEntityID';
import { Result } from '../../share/utils/Result';

export type MaterialType = 'video' | 'audio' | 'pdf' | 'image' | 'text'; // Agregado 'text' si aplica

export interface MaterialMetadata {
  size?: number;    // bytes
  duration?: number; // segundos (solo relevante para 'video' y 'audio')
  mimeType?: string;
}

/**
 * Props de dominio, ahora con courseId y moduleId.
 */
export interface MaterialProps {
  courseId: string;
  moduleId: string;
  lessonId: string;
  title: string; // Título del material (ej. "Introducción al Curso", "Diapositivas Capítulo 1") - ¡AGREGADO!
  type: MaterialType;
  url: string;
  metadata?: MaterialMetadata;
  createdAt: Date;
  updatedAt?: Date; // Añadido updatedAt para consistencia
}

/**
 * Persistencia de Material para Firestore,
 * incluye courseId, moduleId, lessonId y el resto de campos.
 */
export interface MaterialPersistence
  extends Omit<MaterialProps, 'createdAt' | 'updatedAt'> { // Omitir también updatedAt
  id: string;
  createdAt: string;  // ISO string
  updatedAt?: string; // ISO string
}

export class Material {
  private constructor(
    public readonly id: UniqueEntityID,
    private props: MaterialProps
  ) {}

  // —— Getters ——
  get courseId(): string {
    return this.props.courseId;
  }
  get moduleId(): string {
    return this.props.moduleId;
  }
  get lessonId(): string {
    return this.props.lessonId;
  }
  get materialId(): string {
    return this.id.toString();
  }
  // Nuevo getter para el título del material
  get title(): string {
    return this.props.title;
  }
  get type(): MaterialType {
    return this.props.type;
  }
  get url(): string {
    return this.props.url;
  }
  get metadata(): MaterialMetadata | undefined {
    return this.props.metadata;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date | undefined { // Nuevo getter
    return this.props.updatedAt;
  }

  // —— Comportamientos ——
  public updateUrl(newUrl: string): Result<void, Error> { // Retorno Result
    if (!newUrl.trim()) {
      return Result.err(new Error('URL cannot be empty'));
    }
    this.props.url = newUrl;
    this.props.updatedAt = new Date(); // Actualizar fecha de modificación
    return Result.ok(undefined);
  }

  public updateMetadata(newMetadata: MaterialMetadata): Result<void, Error> { // Retorno Result
    // Validar duración si el tipo es video o audio
    if (
      (this.props.type === 'video' || this.props.type === 'audio') &&
      (newMetadata.duration === undefined || newMetadata.duration < 0)
    ) {
      return Result.err(new Error('Duration is required and must be non-negative for video/audio materials.'));
    }
    this.props.metadata = { ...newMetadata }; // Copia para evitar mutaciones externas
    this.props.updatedAt = new Date(); // Actualizar fecha de modificación
    return Result.ok(undefined);
  }

  // Nuevo método para actualizar el título del material
  public updateTitle(newTitle: string): Result<void, Error> {
    if (!newTitle.trim()) {
      return Result.err(new Error('Material title cannot be empty'));
    }
    this.props.title = newTitle;
    this.props.updatedAt = new Date();
    return Result.ok(undefined);
  }


  // —— Fábrica ——
  public static create(
    props: Omit<MaterialProps, 'createdAt' | 'updatedAt'> & Partial<Pick<MaterialProps, 'metadata'>>, // createdAt y updatedAt se omiten
    id?: UniqueEntityID
  ): Result<Material, Error> {
    if (!props.courseId) {
      return Result.err(new Error('courseId is required'));
    }
    if (!props.moduleId) {
      return Result.err(new Error('moduleId is required'));
    }
    if (!props.lessonId) {
      return Result.err(new Error('lessonId is required'));
    }
    if (!props.title.trim()) { // Validar el nuevo campo 'title'
      return Result.err(new Error('Material title cannot be empty'));
    }
    if (!props.url.trim()) {
      return Result.err(new Error('URL cannot be empty'));
    }
    const validTypes: MaterialType[] = ['video', 'audio', 'pdf', 'image', 'text']; // Actualizar si agregaste 'text'
    if (!validTypes.includes(props.type)) {
      return Result.err(new Error('Invalid material type'));
    }

    // Validación de duración para materiales de tipo video/audio en la creación
    if (
        (props.type === 'video' || props.type === 'audio') &&
        (props.metadata?.duration === undefined || props.metadata.duration < 0)
    ) {
        return Result.err(new Error('Duration is required and must be non-negative for video/audio materials.'));
    }


    const now = new Date();
    const full: MaterialProps = {
      ...props,
      createdAt: now,
      updatedAt: now, // Inicializar updatedAt en la creación
    };
    return Result.ok(new Material(id ?? new UniqueEntityID(), full));
  }

  // —— Serialización ——
  public toPersistence(): MaterialPersistence {
    const { createdAt, updatedAt, ...rest } = this.props; // Extraer updatedAt también
    return {
      id: this.id.toString(),
      ...rest, // Incluirá title y metadata
      createdAt: createdAt.toISOString(),
      ...(updatedAt && { updatedAt: updatedAt.toISOString() }), // Incluir updatedAt si existe
    };
  }

  public static fromPersistence(p: MaterialPersistence): Material {
    const props: MaterialProps = {
      courseId: p.courseId,
      moduleId: p.moduleId,
      lessonId: p.lessonId,
      title: p.title, // Asegurar que el título se carga
      type: p.type,
      url: p.url,
      metadata: p.metadata,
      createdAt: new Date(p.createdAt),
      updatedAt: p.updatedAt ? new Date(p.updatedAt) : undefined, // Cargar updatedAt
    };
    return new Material(new UniqueEntityID(p.id), props);
  }
}