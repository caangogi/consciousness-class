
// src/features/user/domain/entities/user.entity.ts
export type UserRole = 'student' | 'creator' | 'superadmin';

export interface UserProperties {
  uid: string;
  email: string;
  nombre: string;
  apellido: string;
  displayName: string;
  role: UserRole;
  photoURL?: string | null;
  createdAt: string; // ISO Date string
  updatedAt?: string; // ISO Date string
  referralCodeGenerated: string;
  referredBy?: string | null; // UID of the referrer
  cursosComprados: string[]; // Array of course IDs
  referidosExitosos: number;
  balanceCredito: number; // Could be points, currency amount, etc.
}

export class UserEntity {
  readonly uid: string;
  readonly email: string;
  nombre: string;
  apellido: string;
  displayName: string;
  role: UserRole;
  photoURL?: string | null;
  readonly createdAt: Date;
  updatedAt?: Date;
  referralCodeGenerated: string;
  referredBy?: string | null;
  cursosComprados: string[];
  referidosExitosos: number;
  balanceCredito: number;

  constructor(props: UserProperties) {
    this.uid = props.uid;
    this.email = props.email;
    this.nombre = props.nombre;
    this.apellido = props.apellido;
    this.displayName = props.displayName;
    this.role = props.role;
    this.photoURL = props.photoURL || null;
    this.createdAt = new Date(props.createdAt);
    this.updatedAt = props.updatedAt ? new Date(props.updatedAt) : undefined;
    this.referralCodeGenerated = props.referralCodeGenerated;
    this.referredBy = props.referredBy || null;
    this.cursosComprados = props.cursosComprados || [];
    this.referidosExitosos = props.referidosExitosos || 0;
    this.balanceCredito = props.balanceCredito || 0;
  }

  static create(props: Omit<UserProperties, 'createdAt' | 'displayName' | 'referralCodeGenerated' | 'cursosComprados' | 'referidosExitosos' | 'balanceCredito' | 'updatedAt'> & Partial<Pick<UserProperties, 'referralCodeGenerated' | 'cursosComprados' | 'referidosExitosos' | 'balanceCredito' | 'photoURL' >>): UserEntity {
    const now = new Date();
    const displayName = `${props.nombre} ${props.apellido}`;
    const generatedReferralCode = props.referralCodeGenerated || `CONSCIOUS-${props.uid.substring(0, 6).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    
    return new UserEntity({
      ...props,
      displayName,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      referralCodeGenerated,
      cursosComprados: props.cursosComprados || [],
      referidosExitosos: props.referidosExitosos || 0,
      balanceCredito: props.balanceCredito || 0,
      photoURL: props.photoURL || null,
    });
  }

  updateProfile(data: Partial<Pick<UserProperties, 'nombre' | 'apellido' | 'photoURL'>>) {
    if (data.nombre) this.nombre = data.nombre;
    if (data.apellido) this.apellido = data.apellido;
    if (data.nombre || data.apellido) {
      this.displayName = `${this.nombre} ${this.apellido}`;
    }
    if (data.photoURL !== undefined) this.photoURL = data.photoURL;
    this.updatedAt = new Date();
  }

  // Method to convert entity to a plain object for Firestore or API responses
  toPlainObject(): UserProperties {
    return {
      uid: this.uid,
      email: this.email,
      nombre: this.nombre,
      apellido: this.apellido,
      displayName: this.displayName,
      role: this.role,
      photoURL: this.photoURL,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt?.toISOString(),
      referralCodeGenerated: this.referralCodeGenerated,
      referredBy: this.referredBy,
      cursosComprados: this.cursosComprados,
      referidosExitosos: this.referidosExitosos,
      balanceCredito: this.balanceCredito,
    };
  }
}
