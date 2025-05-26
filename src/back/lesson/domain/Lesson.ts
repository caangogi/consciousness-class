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
  content: string;             // rich text o Markdown
  order: number;
  overview?: string;           // párrafo de resumen
  faqs?: FAQ[];                // sección de preguntas frecuentes
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * Ahora incluye courseId y moduleId, junto con los demás campos sin las fechas.
 */
export interface LessonPersistence
  extends Omit<LessonProps, 'createdAt' | 'updatedAt'> {
  id: string;
  createdAt: string;           // ISO
  updatedAt?: string;          // ISO
}

export class Lesson {
  private constructor(
    public readonly id: UniqueEntityID,
    private props: LessonProps
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

  // —— Comportamientos ——
  public updateDetails(
    title: string,
    content: string,
    overview?: string,
    faqs?: FAQ[]
  ): void {
    if (!title.trim()) {
      throw new Error('Lesson title cannot be empty');
    }
    if (!content.trim()) {
      throw new Error('Lesson content cannot be empty');
    }
    this.props.title = title;
    this.props.content = content;
    this.props.overview = overview;
    this.props.faqs = faqs;
    this.props.updatedAt = new Date();
  }

  public changeOrder(newOrder: number): void {
    if (newOrder < 0) {
      throw new Error('Order must be non-negative');
    }
    this.props.order = newOrder;
    this.props.updatedAt = new Date();
  }

  // —— Fábrica ——
  public static create(
    props: Omit<LessonProps, 'createdAt'> &
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
    const full: LessonProps = {
      ...props,
      createdAt: now,
      updatedAt: undefined,
    };
    return Result.ok(new Lesson(id ?? new UniqueEntityID(), full));
  }

  // —— Serialización ——
  public toPersistence(): LessonPersistence {
    const p: LessonPersistence = {
      id: this.id.toString(),
      courseId: this.props.courseId,    // <-- incluido
      moduleId: this.props.moduleId,
      title: this.props.title,
      content: this.props.content,
      order: this.props.order,
      createdAt: this.props.createdAt.toISOString(),
      // sólo incluimos overview/faqs si existen
      ...(this.props.overview && { overview: this.props.overview }),
      ...(this.props.faqs && { faqs: this.props.faqs }),
      ...(this.props.updatedAt && { updatedAt: this.props.updatedAt.toISOString() }),
    };
    return p;
  }

  public static fromPersistence(p: LessonPersistence): Lesson {
    const props: LessonProps = {
      courseId: p.courseId,            // <-- recuperado
      moduleId: p.moduleId,
      title: p.title,
      content: p.content,
      order: p.order,
      overview: p.overview,
      faqs: p.faqs,
      createdAt: new Date(p.createdAt),
      updatedAt: p.updatedAt ? new Date(p.updatedAt) : undefined,
    };
    return new Lesson(new UniqueEntityID(p.id), props);
  }
}
