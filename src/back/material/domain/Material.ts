// src/back/material/domain/Material.ts

import { UniqueEntityID } from '../../share/utils/UniqueEntityID';
import { Result } from '../../share/utils/Result';

export type MaterialType = 'video' | 'audio' | 'pdf' | 'image';

export interface MaterialMetadata {
  size?: number;     // bytes
  duration?: number; // segundos
  mimeType?: string;
}

/**
 * Props de dominio, ahora con courseId y moduleId.
 */
export interface MaterialProps {
  courseId: string;
  moduleId: string;
  lessonId: string;
  type: MaterialType;
  url: string;
  metadata?: MaterialMetadata;
  createdAt: Date;
}

/**
 * Persistencia de Material para Firestore,
 * incluye courseId, moduleId, lessonId y el resto de campos.
 */
export interface MaterialPersistence
  extends Omit<MaterialProps, 'createdAt'> {
  id: string;
  createdAt: string;  // ISO string
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

  // —— Comportamientos ——
  public updateUrl(newUrl: string): void {
    if (!newUrl.trim()) {
      throw new Error('URL cannot be empty');
    }
    this.props.url = newUrl;
  }

  public updateMetadata(newMetadata: MaterialMetadata): void {
    this.props.metadata = newMetadata;
  }

  // —— Fábrica ——
  public static create(
    props: Omit<MaterialProps, 'createdAt'>,
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
    if (!props.url.trim()) {
      return Result.err(new Error('URL cannot be empty'));
    }
    if (!['video', 'audio', 'pdf', 'image'].includes(props.type)) {
      return Result.err(new Error('Invalid material type'));
    }
    const now = new Date();
    const full: MaterialProps = { ...props, createdAt: now };
    return Result.ok(new Material(id ?? new UniqueEntityID(), full));
  }

  // —— Serialización ——
  public toPersistence(): MaterialPersistence {
    const p: MaterialPersistence = {
      id: this.id.toString(),
      courseId: this.props.courseId,
      moduleId: this.props.moduleId,
      lessonId: this.props.lessonId,
      type: this.props.type,
      url: this.props.url,
      metadata: this.props.metadata,
      createdAt: this.props.createdAt.toISOString(),
    };
    return p;
  }

  public static fromPersistence(p: MaterialPersistence): Material {
    const props: MaterialProps = {
      courseId: p.courseId,
      moduleId: p.moduleId,
      lessonId: p.lessonId,
      type: p.type,
      url: p.url,
      metadata: p.metadata,
      createdAt: new Date(p.createdAt),
    };
    return new Material(new UniqueEntityID(p.id), props);
  }
}
