
// src/features/user/infrastructure/dto/create-user.dto.ts
import type { UserRole } from '@/features/user/domain/entities/user.entity';

export interface CreateUserDto {
  uid: string; // From Firebase Auth
  email: string; // From Firebase Auth
  nombre: string;
  apellido: string;
  role?: UserRole; // Optional, defaults to 'student'
  referralCode?: string | null; // The referral code the user signed up with
}
