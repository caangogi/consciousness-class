import { UniqueEntityID } from '../../share/utils/UniqueEntityID';
import { Result } from '../../share/utils/Result';

export interface CourseProps {
  title: string;
  description: string;
  coverImageUrl: string;
  price: number;
  language: string;
  level: string;
  instructorId: string;
  tags?: string[];
  whatYouWillLearn: string[];
  whyChooseThisCourse: string[];
  idealFor: string[];
  enrollCallToAction: string;
  /** IDs de módulos vinculados a este curso */
  moduleIds: string[];
}

export interface CoursePersistence extends CourseProps {
  id: string;
  createdAt: string;
  updatedAt?: string;
}

export class Course {
  private constructor(
    public readonly id: UniqueEntityID,
    private props: CourseProps & { createdAt: Date; updatedAt?: Date }
  ) {}

  // Getters
  get title(): string { return this.props.title; }
  get description(): string { return this.props.description; }
  get coverImageUrl(): string { return this.props.coverImageUrl; }
  get price(): number { return this.props.price; }
  get language(): string { return this.props.language; }
  get level(): string { return this.props.level; }
  get instructorId(): string { return this.props.instructorId; }
  get tags(): string[] | undefined { return this.props.tags; }
  get whatYouWillLearn(): string[] { return this.props.whatYouWillLearn; }
  get whyChooseThisCourse(): string[] { return this.props.whyChooseThisCourse; }
  get idealFor(): string[] { return this.props.idealFor; }
  get enrollCallToAction(): string { return this.props.enrollCallToAction; }
  get moduleIds(): string[] { return this.props.moduleIds; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date | undefined { return this.props.updatedAt; }

  // Comportamientos de dominio
  public updateDetails(props: Partial<Omit<CourseProps, 'instructorId'>>): void {
    if (props.price !== undefined && props.price < 0) {
      throw new Error('Price must be non-negative');
    }
    this.props = { ...this.props, ...props, updatedAt: new Date() };
  }

  public addModule(moduleId: string): void {
    if (!this.props.moduleIds.includes(moduleId)) {
      this.props.moduleIds.push(moduleId);
      this.props.updatedAt = new Date();
    }
  }

  public removeModule(moduleId: string): void {
    this.props.moduleIds = this.props.moduleIds.filter(id => id !== moduleId);
    this.props.updatedAt = new Date();
  }

  // Factory
  public static create(
    props: Omit<CourseProps, 'moduleIds'>,
    id?: UniqueEntityID
  ): Result<Course, Error> {
    if (!props.title.trim()) {
      return Result.err(new Error('Title cannot be empty'));
    }
    if (props.price < 0) {
      return Result.err(new Error('Price must be non-negative'));
    }
    const now = new Date();
    const fullProps: CourseProps = { ...props, moduleIds: [] };
    const course = new Course(
      id ?? new UniqueEntityID(),
      { ...fullProps, createdAt: now }
    );
    return Result.ok(course);
  }

  // Serialización
  public toPersistence(): CoursePersistence {
    const { createdAt, updatedAt, ...rest } = this.props;
    return {
      id: this.id.toString(),
      ...rest,
      createdAt: createdAt.toISOString(),
      ...(updatedAt && { updatedAt: updatedAt.toISOString() }),
    };
  }

  public static fromPersistence(data: CoursePersistence): Course {
    const { id, createdAt, updatedAt, ...rest } = data;
    return new Course(
      new UniqueEntityID(id),
      {
        ...rest,
        createdAt: new Date(createdAt),
        updatedAt: updatedAt ? new Date(updatedAt) : undefined
      }
    );
  }
}