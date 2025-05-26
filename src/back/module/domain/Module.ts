// src/back/module/domain/Module.ts

import { UniqueEntityID } from '../../share/utils/UniqueEntityID';
import { Result } from '../../share/utils/Result';

export interface ModuleProps {
  title: string;
  courseId: string;
  order: number;

  // Campos adicionales:
  description?: string;
  isPublished: boolean;
  createdAt: Date;
  updatedAt?: Date;
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
}

export class Module {
  private constructor(
    public readonly id: UniqueEntityID,
    private props: ModuleProps
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

  // —— Comportamientos / mutaciones ——  
  public updateDetails(
    title: string,
    description?: string,
    isPublished?: boolean
  ): void {
    if (!title.trim()) {
      throw new Error('Module title cannot be empty');
    }
    this.props.title = title;
    this.props.description = description;
    if (typeof isPublished === 'boolean') {
      this.props.isPublished = isPublished;
    }
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
    props: Omit<ModuleProps, 'createdAt' | 'isPublished'> & Partial<Pick<ModuleProps, 'description'>>,
    id?: UniqueEntityID
  ): Result<Module, Error> {
    if (!props.title.trim()) {
      return Result.err(new Error('Module title cannot be empty'));
    }
    if (props.order < 0) {
      return Result.err(new Error('Order must be non-negative'));
    }
    const now = new Date();
    const full: ModuleProps = {
      ...props,
      isPublished: false,
      createdAt: now,
      updatedAt: undefined
    };
    const module = new Module(id ?? new UniqueEntityID(), full);
    return Result.ok(module);
  }

  // —— Serialización ——  
  public toPersistence(): ModulePersistence {
    const p: any = {
      id: this.id.toString(),
      title: this.props.title,
      courseId: this.props.courseId,
      order: this.props.order,
      isPublished: this.props.isPublished,
      createdAt: this.props.createdAt.toISOString()
    };
    if (this.props.description) {
      p.description = this.props.description;
    }
    if (this.props.updatedAt) {
      p.updatedAt = this.props.updatedAt.toISOString();
    }
    return p as ModulePersistence;
  }

  public static fromPersistence(p: ModulePersistence): Module {
    const props: ModuleProps = {
      title: p.title,
      courseId: p.courseId,
      order: p.order,
      description: p.description,
      isPublished: p.isPublished,
      createdAt: new Date(p.createdAt),
      updatedAt: p.updatedAt ? new Date(p.updatedAt) : undefined
    };
    return new Module(new UniqueEntityID(p.id), props);
  }
}
