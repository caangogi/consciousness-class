// src/back/course/domain/Course.ts

import { UniqueEntityID } from '../../share/utils/UniqueEntityID';
import { Result } from '../../share/utils/Result';

export type MembershipPlanType = 'one-time' | 'monthly' | 'yearly' | 'six-months' | 'custom-duration';

export interface CustomDurationDetails {
  unit: 'days' | 'weeks' | 'months' | 'years';
  value: number;
}

export interface MembershipDetails {
  planType: MembershipPlanType;
  customDuration?: CustomDurationDetails;
}

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
  type: 'course' | 'membership';

  membershipDetails?: MembershipDetails;

  createdAt: Date;
  updatedAt?: Date;
}

// **CoursePersistence - Ahora con moduleIds manejado en el constructor/factory**
export interface CoursePersistence extends Omit<CourseProps, 'createdAt' | 'updatedAt'> {
  id: string;
  createdAt: string;
  updatedAt?: string;
  // moduleIds no va aquí, se manejará en el repositorio o en el factory
}


export class Course {
  private constructor(
    public readonly id: UniqueEntityID,
    private props: CourseProps
  ) {}

  // —— Getters ——
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
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date | undefined { return this.props.updatedAt; }
  get type(): 'course' | 'membership' { return this.props.type; }

  // Getter para los detalles de la membresía
  get membershipDetails(): MembershipDetails | undefined { return this.props.membershipDetails; }

  // —— Comportamientos / mutaciones ——
  public updateDetails(
    props: Partial<Omit<CourseProps,
      'instructorId' | 'type' | 'membershipDetails' | 'createdAt' | 'updatedAt' // Excluir estas para updateDetails
    >>
  ): Result<void, Error> {
    if (props.price !== undefined && props.price < 0) {
      return Result.err(new Error('Price must be non-negative'));
    }
    if (props.title !== undefined && props.title.trim().length < 5) {
      return Result.err(new Error('Title must be at least 5 characters long.'));
    }
    if (props.description !== undefined && props.description.trim().length < 10) {
      return Result.err(new Error('Description must be at least 10 characters long.'));
    }
    this.props = { ...this.props, ...props, updatedAt: new Date() };
    return Result.ok(undefined);
  }

  // Método específico para actualizar solo el tipo
  public updateType(type: 'course' | 'membership', membershipDetails?: MembershipDetails): Result<void, Error> {
    if (!type || (type !== 'course' && type !== 'membership')) {
      return Result.err(new Error('Course type must be either "course" or "membership".'));
    }
    this.props.type = type;

    if (type === 'membership') {
      if (!membershipDetails) {
        return Result.err(new Error('Membership details are required for a membership type course.'));
      }
      this.props.membershipDetails = membershipDetails;
    } else { // type === 'course'
      this.props.membershipDetails = undefined; // Limpiar detalles de membresía si el tipo es 'course'
    }

    this.props.updatedAt = new Date();
    return Result.ok(undefined);
  }

  // Nuevo método para actualizar específicamente los detalles de la membresía
  public updateMembershipDetails(details: MembershipDetails): Result<void, Error> {
    if (this.props.type !== 'membership') {
      return Result.err(new Error('Cannot update membership details for a non-membership course.'));
    }
    if (!details.planType || (details.planType !== 'monthly' && details.planType !== 'yearly' && details.planType !== 'one-time' && details.planType !== 'six-months' && details.planType !== 'custom-duration')) {
        return Result.err(new Error('Invalid membership plan type.'));
    }
    if (details.planType === 'custom-duration' && (!details.customDuration || !details.customDuration.unit || !details.customDuration.value || details.customDuration.value <= 0)) {
        return Result.err(new Error('Custom duration details are required for "custom-duration" plan type.'));
    }

    this.props.membershipDetails = { ...details };
    this.props.updatedAt = new Date();
    return Result.ok(undefined);
  }

  // Factory method para crear una instancia de Course desde los datos de entrada (DTO)
  public static create(
    // Omitimos createdAt y updatedAt de las props iniciales, serán generadas aquí
    props: Omit<CourseProps, 'createdAt' | 'updatedAt'>,
    id?: UniqueEntityID
  ): Result<Course, Error> {
    if (!props.title.trim()) {
      return Result.err(new Error('Title cannot be empty'));
    }
    if (props.price < 0) {
      return Result.err(new Error('Price must be non-negative'));
    }
    if (!props.type || (props.type !== 'course' && props.type !== 'membership')) {
      return Result.err(new Error('Course type is required and must be either "course" or "membership".'));
    }

    // Validar membershipDetails si el tipo es 'membership'
    if (props.type === 'membership') {
      if (!props.membershipDetails) {
        return Result.err(new Error('Membership details are required for a membership type course.'));
      }
      if (!props.membershipDetails.planType) {
        return Result.err(new Error('Membership plan type is required for a membership course.'));
      }
    } else { // type === 'course'
        if (props.membershipDetails) {
            return Result.err(new Error('Membership details should not be provided for a regular course type.'));
        }
    }

    const now = new Date();
    const fullProps: CourseProps = {
      ...props,
      createdAt: now,
      updatedAt: now,
    };

    const courseInstance = new Course(
      id ?? new UniqueEntityID(),
      fullProps
    );

    return Result.ok(courseInstance);
  }

  // Serialización a la estructura de persistencia
  public toPersistence(): CoursePersistence {
    const { createdAt, updatedAt, ...rest } = this.props;
    return {
      id: this.id.toString(),
      ...rest,
      createdAt: createdAt.toISOString(),
      ...(updatedAt && { updatedAt: updatedAt.toISOString() }),
    };
  }

  // Deserialización desde la estructura de persistencia
  public static fromPersistence(data: CoursePersistence): Course {
    const { id, createdAt, updatedAt, ...rest } = data;
    return new Course(
      new UniqueEntityID(id),
      {
        ...rest,
        createdAt: new Date(createdAt),
        updatedAt: updatedAt ? new Date(updatedAt) : undefined,
      }
    );
  }
}