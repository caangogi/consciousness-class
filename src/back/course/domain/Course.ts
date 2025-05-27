import { UniqueEntityID } from '../../share/utils/UniqueEntityID';
import { Result } from '../../share/utils/Result';

// Interfaz para las propiedades core del curso (excluye ID y fechas)
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
  type: 'course' | 'membership';
}

// Interfaz para la estructura de persistencia (incluye ID y fechas)
export interface CoursePersistence extends CourseProps {
  id: string;
  createdAt: string;
  updatedAt?: string;
  moduleIds: string[]; // moduleIds también en persistencia
}

export class Course {
  private constructor(
    public readonly id: UniqueEntityID,
    private props: CourseProps & { createdAt: Date; updatedAt?: Date; moduleIds: string[] } // Propiedades internas completas
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
  // Nuevo getter para type
  get type(): 'course' | 'membership' { return this.props.type; }

  // Comportamientos de dominio
  // Excluimos 'type' y 'instructorId' de la actualización general
  public updateDetails(props: Partial<Omit<CourseProps, 'instructorId' | 'type'>>): Result<void, Error> {
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

   // Método específico para actualizar solo el tipo si fuera necesario y permitido
  public updateType(type: 'course' | 'membership'): Result<void, Error> {
      if (!type || (type !== 'course' && type !== 'membership')) {
          return Result.err(new Error('Course type must be either "course" or "membership".'));
      }
      this.props.type = type;
      this.props.updatedAt = new Date();
      return Result.ok(undefined);
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

  // Factory method para crear una instancia de Course desde los datos de entrada (DTO)
  public static create(
    props: Omit<CourseProps, 'moduleIds'> & { moduleIds?: string[] }, // Aceptar propiedades del DTO + moduleIds opcional
    id?: UniqueEntityID
  ): Result<Course, Error> {
    // Validaciones básicas (puedes añadir más según necesites)
    if (!props.title.trim()) {
      return Result.err(new Error('Title cannot be empty'));
    }
    if (props.price < 0) {
      return Result.err(new Error('Price must be non-negative'));
    }
    // Validar el nuevo campo type
    if (!props.type || (props.type !== 'course' && props.type !== 'membership')) {
        return Result.err(new Error('Course type is required and must be either "course" or "membership".'));
    }

    const now = new Date();
    // Construir el objeto de propiedades internas para el constructor
    const internalProps = {
        ...props, // Spread las propiedades del DTO
        moduleIds: props.moduleIds || [], // Usar moduleIds del DTO si existe, o inicializar vacío
        createdAt: now, // Establecer la fecha de creación como Date
        updatedAt: now, // Establecer la fecha de actualización como Date
    };

     const courseInstance = new Course(
          id ?? new UniqueEntityID(),
          internalProps
      );

    return Result.ok(courseInstance);
  }

  // Serialización a la estructura de persistencia
  public toPersistence(): CoursePersistence {
    const { createdAt, updatedAt, moduleIds, ...rest } = this.props; // Extraer moduleIds aquí
    return {
      id: this.id.toString(),
      ...rest, // Esto incluye title, description, type, etc.
      moduleIds: moduleIds, // Incluir moduleIds
      createdAt: createdAt.toISOString(),
      ...(updatedAt && { updatedAt: updatedAt.toISOString() }),
    };
  }

  // Deserialización desde la estructura de persistencia
  public static fromPersistence(data: CoursePersistence): Course {
    const { id, createdAt, updatedAt, moduleIds, ...rest } = data; // Extraer moduleIds aquí
    return new Course(
      new UniqueEntityID(id),
      {
        ...rest, // Esto incluye title, description, type, etc.
        moduleIds: moduleIds || [], // Usar moduleIds de la data o inicializar vacío
        createdAt: new Date(createdAt),
        updatedAt: updatedAt ? new Date(updatedAt) : undefined,
      }
    );
  }
}