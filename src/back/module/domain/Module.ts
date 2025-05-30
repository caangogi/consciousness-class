// src/back/module/domain/Module.ts

import { UniqueEntityID } from '../../share/utils/UniqueEntityID';
import { Result } from '../../share/utils/Result';

export interface ModuleProps {
  title: string;
  courseId: string;
  order: number;

  description?: string;
  isPublished: boolean;
  createdAt: Date;
  updatedAt?: Date;

  // NUEVAS PROPIEDADES AGREGADAS (Calculadas y actualizadas por el backend)
  totalDuration?: number; // Duración total de todas las lecciones en segundos
  lessonCount?: number;   // Total de lecciones dentro de este módulo
}

export interface ModulePersistence {
  id: string;
  title: string;
  courseId: string;
  order: number;
  description?: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt?: string;
  // Añadir las nuevas propiedades a la interfaz de persistencia
  totalDuration?: number;
  lessonCount?: number;
}

export class Module {
  private constructor(
    public readonly id: UniqueEntityID,
    // Las propiedades internas completas para el constructor
    private props: ModuleProps & { createdAt: Date; updatedAt?: Date; totalDuration: number; lessonCount: number }
  ) {}

  // —— Getters ——  
  get moduleId(): string {
    return this.id.toString();
  }
  get title(): string {
    return this.props.title;
  }
  get courseId(): string {
    return this.props.courseId;
  }
  get order(): number {
    return this.props.order;
  }
  get description(): string | undefined {
    return this.props.description;
  }
  get isPublished(): boolean {
    return this.props.isPublished;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date | undefined {
    return this.props.updatedAt;
  }

  // NUEVOS GETTERS para las métricas agregadas
  get totalDuration(): number | undefined { return this.props.totalDuration; }
  get lessonCount(): number | undefined { return this.props.lessonCount; }


  // —— Comportamientos / mutaciones ——  
  public updateDetails(
    title: string,
    description?: string,
    isPublished?: boolean
  ): Result<void, Error> { // Cambiado a Result para consistencia con Course
    if (!title.trim()) {
      return Result.err(new Error('Module title cannot be empty'));
    }
    this.props.title = title;
    this.props.description = description;
    if (typeof isPublished === 'boolean') {
      this.props.isPublished = isPublished;
    }
    this.props.updatedAt = new Date();
    return Result.ok(undefined); // Retorna Result.ok
  }

  public changeOrder(newOrder: number): Result<void, Error> { // Cambiado a Result
    if (newOrder < 0) {
      return Result.err(new Error('Order must be non-negative'));
    }
    this.props.order = newOrder;
    this.props.updatedAt = new Date();
    return Result.ok(undefined); // Retorna Result.ok
  }

  // NUEVO MÉTODO PARA ACTUALIZAR LAS MÉTRICAS AGREGADAS (llamado por LessonService)
  public updateMetrics({
    totalDuration,
    lessonCount,
  }: {
    totalDuration?: number;
    lessonCount?: number;
  }): void {
    if (totalDuration !== undefined) this.props.totalDuration = totalDuration;
    if (lessonCount !== undefined) this.props.lessonCount = lessonCount;
    this.props.updatedAt = new Date(); // Las actualizaciones de métricas también deben actualizar la fecha
  }


  // —— Fábrica ——  
  public static create(
    // Omitimos createdAt, isPublished, totalDuration y lessonCount del DTO de creación
    props: Omit<ModuleProps, 'createdAt' | 'isPublished' | 'totalDuration' | 'lessonCount'> & Partial<Pick<ModuleProps, 'description'>>,
    id?: UniqueEntityID
  ): Result<Module, Error> {
    if (!props.title.trim()) {
      return Result.err(new Error('Module title cannot be empty'));
    }
    if (props.order < 0) {
      return Result.err(new Error('Order must be non-negative'));
    }
    const now = new Date();
    // Construimos las propiedades internas completas, inicializando las métricas a 0
    const internalProps: ModuleProps & { createdAt: Date; updatedAt?: Date; totalDuration: number; lessonCount: number } = {
      ...props,
      isPublished: false,
      createdAt: now,
      updatedAt: undefined, // Inicializar updatedAt a undefined en la creación
      totalDuration: 0,   // Inicializar a 0
      lessonCount: 0      // Inicializar a 0
    };
    const module = new Module(id ?? new UniqueEntityID(), internalProps);
    return Result.ok(module);
  }

  // —— Serialización ——  
  public toPersistence(): ModulePersistence {
    const { createdAt, updatedAt, ...rest } = this.props; // Extraer createdAt, updatedAt y el resto de props
    return {
      id: this.id.toString(),
      ...rest, // Esto incluye title, courseId, order, description, isPublished y las nuevas métricas
      createdAt: createdAt.toISOString(),
      ...(updatedAt && { updatedAt: updatedAt.toISOString() }),
    };
  }

  public static fromPersistence(p: ModulePersistence): Module {
    const { id, createdAt, updatedAt, ...rest } = p; // Extraer id, createdAt, updatedAt y el resto de props
    // Asegurarse de que las métricas tengan un valor por defecto si no existen en la persistencia (para datos antiguos)
    const props: ModuleProps & { createdAt: Date; updatedAt?: Date; totalDuration: number; lessonCount: number } = {
      ...rest, // Esto incluye title, courseId, order, description, isPublished y las nuevas métricas
      createdAt: new Date(createdAt),
      updatedAt: updatedAt ? new Date(updatedAt) : undefined,
      totalDuration: rest.totalDuration ?? 0, // Si no existe, default a 0
      lessonCount: rest.lessonCount ?? 0,     // Si no existe, default a 0
    };
    return new Module(new UniqueEntityID(id), props);
  }
}