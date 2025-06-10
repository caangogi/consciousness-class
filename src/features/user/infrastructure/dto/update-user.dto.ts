
// src/features/user/infrastructure/dto/update-user.dto.ts
import type { UserRole } from '@/features/user/domain/entities/user.entity';

// What a user (student) can update for themselves
export interface UpdateUserProfileDto {
  nombre?: string;
  apellido?: string;
  photoURL?: string | null; // Can be a URL string or null to remove the photo
}

// What an admin might update (more extensive)
export interface AdminUpdateUserDto extends UpdateUserProfileDto {
  role?: UserRole;
  balanceCredito?: number;
  // other admin-updatable fields
}

