import { UniqueEntityID } from '@back/share/utils/UniqueEntityID';
import { Result } from '@back/share/utils/Result';
import { Role } from './Role';

export interface UserProps {
  email: string;
  displayName: string;
  role: Role;
  createdAt: Date;
  updatedAt?: Date;
}

// Primitivas para persistencia en Firestore
export interface UserPersistence {
  id: string;
  email: string;
  displayName: string;
  role: Role;
  createdAt: string;
  updatedAt?: string;
}

export class User {
  private constructor(
    public readonly id: UniqueEntityID,
    private props: UserProps
  ) {}

  // --- Comportamientos de dominio ---
  public updateProfile(displayName: string): void {
    if (!displayName.trim()) {
      throw new Error('Display name cannot be empty');
    }
    this.props.displayName = displayName;
    this.props.updatedAt = new Date();
  }

  public changeRole(newRole: Role): void {
    if (this.props.role === Role.SuperAdmin && newRole !== Role.SuperAdmin) {
      throw new Error('Cannot downgrade SuperAdmin');
    }
    this.props.role = newRole;
    this.props.updatedAt = new Date();
  }

  // --- Fábrica y validaciones ---
  public static create(
    props: Omit<UserProps, 'createdAt' | 'updatedAt'>,
    id?: UniqueEntityID
  ): Result<User, Error> {
    if (!props.email.includes('@')) {
      return Result.err(new Error('Invalid email'));
    }
    const now = new Date();
    const user = new User(
      id ?? new UniqueEntityID(),
      { ...props, createdAt: now }
    );
    return Result.ok(user);
  }

  // --- Serialización para persistencia ---
  public toPersistence(): UserPersistence {
    const base: any = {
      id: this.id.toString(),
      email: this.props.email,
      displayName: this.props.displayName,
      role: this.props.role,
      createdAt: this.props.createdAt.toISOString(),
    };
    if (this.props.updatedAt) {
      base.updatedAt = this.props.updatedAt.toISOString();
    }
    return base as UserPersistence;
  }

  public static fromPersistence(p: UserPersistence): User {
    const props: UserProps = {
      email: p.email,
      displayName: p.displayName,
      role: p.role,
      createdAt: new Date(p.createdAt),
      updatedAt: p.updatedAt ? new Date(p.updatedAt) : undefined,
    };
    return new User(new UniqueEntityID(p.id), props);
  }

  // --- Getters ---
  get email(): string {
    return this.props.email;
  }
  get displayName(): string {
    return this.props.displayName;
  }
  get role(): Role {
    return this.props.role;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date | undefined {
    return this.props.updatedAt;
  }
}