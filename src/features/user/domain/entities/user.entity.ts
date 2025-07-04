
// src/features/user/domain/entities/user.entity.ts
export type UserRole = 'student' | 'creator' | 'superadmin';

export interface UserProperties {
  uid: string;
  email: string;
  nombre: string;
  apellido: string;
  displayName: string;
  role: UserRole;
  photoURL: string | null;
  createdAt: string; // ISO Date string
  updatedAt: string | null; // ISO Date string
  referralCodeGenerated: string;
  referredBy: string | null; // UID of the referrer
  cursosInscritos: string[]; // Array of course IDs
  referidosExitosos: number;
  balanceCredito: number; // For general platform credits or rewards
  balanceComisionesPendientes?: number; // Specifically for referral commissions
  balanceIngresosPendientes?: number; // Revenue from own courses pending payout
  bio?: string;
  creatorVideoUrl?: string | null;
}

export class UserEntity {
  readonly uid: string;
  readonly email: string;
  nombre: string;
  apellido: string;
  displayName: string;
  role: UserRole;
  photoURL: string | null;
  readonly createdAt: Date;
  updatedAt: Date | null;
  referralCodeGenerated: string;
  referredBy: string | null;
  cursosInscritos: string[];
  referidosExitosos: number;
  balanceCredito: number;
  balanceComisionesPendientes: number;
  balanceIngresosPendientes: number;
  bio: string;
  creatorVideoUrl: string | null;

  constructor(props: UserProperties) {
    this.uid = props.uid;
    this.email = props.email;
    this.nombre = props.nombre;
    this.apellido = props.apellido;
    this.displayName = props.displayName;
    this.role = props.role;
    this.photoURL = props.photoURL === undefined ? null : props.photoURL;
    this.createdAt = new Date(props.createdAt);
    this.updatedAt = props.updatedAt ? new Date(props.updatedAt) : null;
    this.referralCodeGenerated = props.referralCodeGenerated;
    this.referredBy = props.referredBy === undefined ? null : props.referredBy;
    this.cursosInscritos = props.cursosInscritos || [];
    this.referidosExitosos = props.referidosExitosos || 0;
    this.balanceCredito = props.balanceCredito || 0;
    this.balanceComisionesPendientes = props.balanceComisionesPendientes || 0;
    this.balanceIngresosPendientes = props.balanceIngresosPendientes || 0;
    this.bio = props.bio || '';
    this.creatorVideoUrl = props.creatorVideoUrl === undefined ? null : props.creatorVideoUrl;
  }

  static create(
    inputProps: {
      uid: string;
      email: string;
      nombre: string;
      apellido: string;
      role?: UserRole;
      photoURL?: string | null;
      referredBy?: string | null;
      referralCodeGenerated?: string;
      cursosInscritos?: string[];
      referidosExitosos?: number;
      balanceCredito?: number;
      balanceComisionesPendientes?: number;
      balanceIngresosPendientes?: number;
      bio?: string;
      creatorVideoUrl?: string | null;
    }
  ): UserEntity {
    const now = new Date().toISOString();
    const displayName = inputProps.nombre + ' ' + inputProps.apellido;

    const generatedReferralCode =
      inputProps.referralCodeGenerated ||
      ('CONSCIOUS-' +
       inputProps.uid.substring(0, 6).toUpperCase() +
       Math.random().toString(36).substring(2, 6).toUpperCase());

    const entityConstructorProps: UserProperties = {
      uid: inputProps.uid,
      email: inputProps.email,
      nombre: inputProps.nombre,
      apellido: inputProps.apellido,
      displayName: displayName,
      role: inputProps.role || 'student',
      photoURL: inputProps.photoURL === undefined ? null : inputProps.photoURL,
      createdAt: now,
      updatedAt: now,
      referralCodeGenerated: generatedReferralCode,
      referredBy: inputProps.referredBy === undefined ? null : inputProps.referredBy,
      cursosInscritos: inputProps.cursosInscritos || [],
      referidosExitosos: inputProps.referidosExitosos || 0,
      balanceCredito: inputProps.balanceCredito || 0,
      balanceComisionesPendientes: inputProps.balanceComisionesPendientes || 0,
      balanceIngresosPendientes: inputProps.balanceIngresosPendientes || 0,
      bio: inputProps.bio || '',
      creatorVideoUrl: inputProps.creatorVideoUrl === undefined ? null : inputProps.creatorVideoUrl,
    };

    return new UserEntity(entityConstructorProps);
  }

  updateProfile(data: Partial<Pick<UserProperties, 'nombre' | 'apellido' | 'photoURL' | 'balanceComisionesPendientes' | 'balanceIngresosPendientes' | 'bio' | 'creatorVideoUrl'>>) {
    if (data.nombre) this.nombre = data.nombre;
    if (data.apellido) this.apellido = data.apellido;
    if (data.nombre || data.apellido) {
      this.displayName = this.nombre + ' ' + this.apellido;
    }
    if (data.photoURL !== undefined) this.photoURL = data.photoURL;
    if (data.balanceComisionesPendientes !== undefined) this.balanceComisionesPendientes = data.balanceComisionesPendientes;
    if (data.balanceIngresosPendientes !== undefined) this.balanceIngresosPendientes = data.balanceIngresosPendientes;
    if (data.bio !== undefined) this.bio = data.bio;
    if (data.creatorVideoUrl !== undefined) this.creatorVideoUrl = data.creatorVideoUrl;
    this.updatedAt = new Date();
  }

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
      updatedAt: this.updatedAt ? this.updatedAt.toISOString() : null,
      referralCodeGenerated: this.referralCodeGenerated,
      referredBy: this.referredBy,
      cursosInscritos: this.cursosInscritos,
      referidosExitosos: this.referidosExitosos,
      balanceCredito: this.balanceCredito,
      balanceComisionesPendientes: this.balanceComisionesPendientes,
      balanceIngresosPendientes: this.balanceIngresosPendientes,
      bio: this.bio,
      creatorVideoUrl: this.creatorVideoUrl,
    };
  }
}
