import { UniqueEntityID } from '../../share/utils/UniqueEntityID';
import { Result } from '../../share/utils/Result';

export interface FAQ {
  question: string;
  answer: string;
}

export interface LessonProps {
  courseId: string;
  moduleId: string;
  title: string;
  content: string;
  order: number;
  overview?: string;
  faqs?: FAQ[]; 
  createdAt: Date;
  updatedAt?: Date;

 
  totalDuration?: number;
  materialCount?: number; 
}

/**
 * Ahora incluye courseId y moduleId, junto con los demás campos sin las fechas,
 * y las nuevas métricas agregadas.
 */
export interface LessonPersistence
  extends Omit<LessonProps, 'createdAt' | 'updatedAt'> {
  id: string;
  createdAt: string; // ISO
  updatedAt?: string; // ISO
}

export class Lesson {
  private constructor(
    public readonly id: UniqueEntityID,
    private props: LessonProps & { createdAt: Date; updatedAt?: Date; totalDuration: number; materialCount: number }
  ) {}

  // —— Getters ——
  get courseId(): string {
    return this.props.courseId;
  }
  get lessonId(): string {
    return this.id.toString();
  }
  get moduleId(): string {
    return this.props.moduleId;
  }
  get title(): string {
    return this.props.title;
  }
  get content(): string {
    return this.props.content;
  }
  get order(): number {
    return this.props.order;
  }
  get overview(): string | undefined {
    return this.props.overview;
  }
  get faqs(): FAQ[] | undefined {
    return this.props.faqs;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date | undefined {
    return this.props.updatedAt;
  }

  get totalDuration(): number | undefined { return this.props.totalDuration; }
  get materialCount(): number | undefined { return this.props.materialCount; }

  // —— Comportamientos ——
  public updateDetails(
    title: string,
    content: string,
    overview?: string,
    faqs?: FAQ[]
  ): Result<void, Error> { // Cambiado a Result para consistencia
    if (!title.trim()) {
      return Result.err(new Error('Lesson title cannot be empty'));
    }
    if (!content.trim()) {
      return Result.err(new Error('Lesson content cannot be empty'));
    }
    this.props.title = title;
    this.props.content = content;
    this.props.overview = overview;
    this.props.faqs = faqs;
    this.props.updatedAt = new Date();
    return Result.ok(undefined);
  }

  public changeOrder(newOrder: number): Result<void, Error> {
    if (newOrder < 0) {
      return Result.err(new Error('Order must be non-negative'));
    }
    this.props.order = newOrder;
    this.props.updatedAt = new Date();
    return Result.ok(undefined); 
  }

  public updateMetrics({
    totalDuration,
    materialCount,
  }: {
    totalDuration?: number;
    materialCount?: number;
  }): void {
    if (totalDuration !== undefined) this.props.totalDuration = totalDuration;
    if (materialCount !== undefined) this.props.materialCount = materialCount;
    this.props.updatedAt = new Date(); 
  }


  // —— Fábrica ——
  public static create(
    props: Omit<LessonProps, 'createdAt' | 'totalDuration' | 'materialCount'> &
      Partial<Pick<LessonProps, 'overview' | 'faqs'>>,
    id?: UniqueEntityID
  ): Result<Lesson, Error> {
    if (!props.courseId) {
      return Result.err(new Error('courseId is required'));
    }
    if (!props.moduleId) {
      return Result.err(new Error('moduleId is required'));
    }
    if (!props.title.trim()) {
      return Result.err(new Error('Lesson title cannot be empty'));
    }
    if (!props.content.trim()) {
      return Result.err(new Error('Lesson content cannot be empty'));
    }
    if (props.order < 0) {
      return Result.err(new Error('Order must be non-negative'));
    }
    const now = new Date();
    // Construimos las propiedades internas completas, inicializando las métricas a 0
    const internalProps: LessonProps & { createdAt: Date; updatedAt?: Date; totalDuration: number; materialCount: number } = {
      ...props,
      createdAt: now,
      updatedAt: undefined, 
      totalDuration: 0,  
      materialCount: 0    
    };
    return Result.ok(new Lesson(id ?? new UniqueEntityID(), internalProps));
  }

  // —— Serialización ——
  public toPersistence(): LessonPersistence {
    const { createdAt, updatedAt, ...rest } = this.props; 
    return {
      id: this.id.toString(),
      ...rest,
      createdAt: createdAt.toISOString(),
      ...(updatedAt && { updatedAt: updatedAt.toISOString() }),
    };
  }

  public static fromPersistence(p: LessonPersistence): Lesson {
    const { id, createdAt, updatedAt, ...rest } = p; 
    
    const props: LessonProps & { createdAt: Date; updatedAt?: Date; totalDuration: number; materialCount: number } = {
      ...rest, 
      createdAt: new Date(createdAt),
      updatedAt: updatedAt ? new Date(updatedAt) : undefined,
      totalDuration: rest.totalDuration ?? 0, 
      materialCount: rest.materialCount ?? 0, 
    };
    return new Lesson(new UniqueEntityID(id), props);
  }
}