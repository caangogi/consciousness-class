
// src/features/user/application/user.service.ts
import { UserEntity, type UserProperties, type UserRole } from '@/features/user/domain/entities/user.entity';
import type { IUserRepository } from '@/features/user/domain/repositories/user.repository';
import type { CreateUserDto } from '@/features/user/infrastructure/dto/create-user.dto';
import type { UpdateUserProfileDto } from '@/features/user/infrastructure/dto/update-user.dto'; 

export class UserService {
  constructor(private readonly userRepository: IUserRepository) {}

  async createUserProfile(dto: CreateUserDto): Promise<UserEntity> {
    try {
      const existingUser = await this.userRepository.findByUid(dto.uid);
      if (existingUser) {
        console.warn('[UserService] Profile for UID ' + dto.uid + ' already exists. Returning existing profile.');
        return existingUser;
    }
    
      const userEntity = UserEntity.create({
        uid: dto.uid,
        email: dto.email,
        nombre: dto.nombre,
        apellido: dto.apellido,
        role: dto.role || 'student',
        referredBy: dto.referralCode || null, 
      });

      await this.userRepository.save(userEntity);
      console.log('[UserService] User profile created successfully for UID: ' + userEntity.uid);
      return userEntity;

    } catch (error: any) {
      console.error('[UserService] Error creating user profile for UID ' + dto.uid + ':', error.message, error.stack);
      if (error instanceof Error) {
        throw new Error('Failed to create user profile: ' + error.message);
      }
      throw new Error('An unexpected error occurred while creating user profile.');
    }
  }

  async getUserProfile(uid: string): Promise<UserEntity | null> {
    try {
      console.log('[UserService] Attempting to fetch profile for UID: ' + uid);
      const user = await this.userRepository.findByUid(uid);
      if (user) {
        console.log('[UserService] Profile found for UID: ' + uid);
      } else {
        console.log('[UserService] Profile not found for UID: ' + uid);
      }
      return user;
    } catch (error: any) {
      console.error('[UserService] Error fetching user profile for UID ' + uid + ':', error.message, error.stack);
      if (error instanceof Error) {
        throw new Error('Failed to fetch user profile: ' + error.message);
      }
      throw new Error('An unexpected error occurred while fetching user profile.');
    }
  }

  async updateUserProfile(uid: string, dto: UpdateUserProfileDto): Promise<UserEntity | null> {
    try {
      const dataToUpdate: Partial<Omit<UserProperties, 'uid' | 'email' | 'createdAt' | 'referralCodeGenerated' | 'cursosComprados' | 'referidosExitosos' | 'balanceCredito' | 'role' | 'referredBy' | 'displayName' >> = {};
      
      if (dto.nombre !== undefined) dataToUpdate.nombre = dto.nombre;
      if (dto.apellido !== undefined) dataToUpdate.apellido = dto.apellido;
      // photoURL can be a string (new URL) or null (to remove photo)
      if (dto.photoURL !== undefined) dataToUpdate.photoURL = dto.photoURL;

      if (Object.keys(dataToUpdate).length === 0) {
          console.warn("[UserService] No data provided for user profile update for UID: " + uid + ". Returning current profile.");
          const currentUser = await this.userRepository.findByUid(uid);
          if (!currentUser) {
            console.error('[UserService] User not found when trying to return current profile for UID: ' + uid);
            throw new Error('User not found for update operation.');
          }
          return currentUser;
      }
      
      console.log('[UserService] Attempting to update profile for UID: ' + uid + ' with data:', JSON.stringify(dataToUpdate));
      const updatedUser = await this.userRepository.update(uid, dataToUpdate);
      
      if (updatedUser) {
        console.log('[UserService] User profile updated successfully in Firestore for UID: ' + uid);
      } else {
        console.warn('[UserService] User profile update in Firestore failed or user not found for UID: ' + uid);
        // This implies user was not found by repository or update itself failed at repo level
        throw new Error('User not found or Firestore update failed for UID: ' + uid);
      }
      return updatedUser; 

    } catch (error: any) {
      console.error('[UserService] Error updating user profile for UID ' + uid + ':', error.message, error.stack);
      if (error instanceof Error) {
        throw new Error('Failed to update user profile: ' + error.message);
      }
      throw new Error('An unexpected error occurred while updating user profile.');
    }
  }

  async requestCreatorRole(uid: string): Promise<UserEntity | null> {
    try {
      const user = await this.userRepository.findByUid(uid);
      if (!user) {
        throw new Error(`User with UID ${uid} not found.`);
      }
      if (user.role === 'creator') {
        console.warn(`[UserService] User ${uid} is already a creator.`);
        return user;
      }
      if (user.role !== 'student') {
        throw new Error(`User ${uid} has role ${user.role} and cannot be directly converted to creator from this role.`);
      }

      const updatedUser = await this.userRepository.update(uid, { role: 'creator' });
      if (updatedUser) {
        console.log(`[UserService] User ${uid} role updated to creator successfully.`);
      } else {
        throw new Error(`Failed to update role for user ${uid}.`);
      }
      return updatedUser;
    } catch (error: any) {
      console.error(`[UserService] Error updating user role to creator for UID ${uid}:`, error.message);
      throw error;
    }
  }

  async deleteUserProfile(uid: string): Promise<void> {
    try {
      console.log('[UserService] Attempting to delete profile for UID: ' + uid);
      await this.userRepository.delete(uid);
      console.log('[UserService] User profile deleted successfully from Firestore for UID: ' + uid);
    } catch (error: any)
{
      console.error('[UserService] Error deleting user profile for UID ' + uid + ':', error.message, error.stack);
      if (error instanceof Error) {
        throw new Error('Failed to delete user profile: ' + error.message);
      }
      throw new Error('An unexpected error occurred while deleting user profile.');
    }
  }
}

