
// src/features/user/application/user.service.ts
import { UserEntity, type UserProperties } from '@/features/user/domain/entities/user.entity';
import type { IUserRepository } from '@/features/user/domain/repositories/user.repository';
import type { CreateUserDto } from '@/features/user/infrastructure/dto/create-user.dto';
import type { UpdateUserProfileDto } from '@/features/user/infrastructure/dto/update-user.dto'; 

export class UserService {
  constructor(private readonly userRepository: IUserRepository) {}

  async createUserProfile(dto: CreateUserDto): Promise<UserEntity> {
    try {
      const existingUser = await this.userRepository.findByUid(dto.uid);
      if (existingUser) {
        // This scenario implies an issue if Firebase Auth succeeded but profile already exists.
        // Could merge or update if needed, or log a warning. For now, return existing.
        console.warn('[UserService] Profile for UID ' + dto.uid + ' already exists. Returning existing profile.');
        return existingUser;
      }

      // Optional: Check if email is already associated with another UID (should be rare with Firebase Auth)
      // const existingUserByEmail = await this.userRepository.findByEmail(dto.email);
      // if (existingUserByEmail && existingUserByEmail.uid !== dto.uid) {
      //   console.error(`[UserService] Email ${dto.email} is already in use by UID ${existingUserByEmail.uid}. Cannot create profile for UID ${dto.uid}.`);
      //   throw new Error(`Email ${dto.email} is already associated with another account.`);
      // }

      const userEntity = UserEntity.create({
        uid: dto.uid,
        email: dto.email,
        nombre: dto.nombre,
        apellido: dto.apellido,
        role: dto.role || 'student',
        // referredBy (from referralCode in DTO) needs to be handled.
        // If dto.referralCode is present, it should be stored.
        // The UserEntity.create method needs to be able to accept it.
        referredBy: dto.referralCode || null,
      });

      await this.userRepository.save(userEntity);
      console.log('[UserService] User profile created successfully for UID: ' + userEntity.uid);
      return userEntity;

    } catch (error: any) {
      console.error('[UserService] Error creating user profile for UID ' + dto.uid + ':', error);
      // Re-throw the error to be handled by the API layer or a global error handler
      // Potentially wrap it in a custom application-specific error
      throw new Error('Failed to create user profile: ' + error.message);
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
      console.error('[UserService] Error fetching user profile for UID ' + uid + ':', error);
      throw new Error('Failed to fetch user profile: ' + error.message);
    }
  }

  async updateUserProfile(uid: string, dto: UpdateUserProfileDto): Promise<UserEntity | null> {
    try {
      const dataToUpdate: Partial<Omit<UserProperties, 'uid' | 'email' | 'createdAt'>> = {};
      if (dto.nombre) dataToUpdate.nombre = dto.nombre;
      if (dto.apellido) dataToUpdate.apellido = dto.apellido;
      if (dto.photoURL !== undefined) dataToUpdate.photoURL = dto.photoURL;

      if (Object.keys(dataToUpdate).length === 0) {
          console.warn("[UserService] No data provided for user profile update.");
          // Fetch and return current user profile if no data to update
          return this.userRepository.findByUid(uid); 
      }
      
      console.log('[UserService] Attempting to update profile for UID: ' + uid + ' with data:', dataToUpdate);
      const updatedUser = await this.userRepository.update(uid, dataToUpdate);
      if (updatedUser) {
        console.log('[UserService] User profile updated successfully for UID: ' + uid);
      } else {
        console.warn('[UserService] User profile update failed or user not found for UID: ' + uid);
      }
      return updatedUser;

    } catch (error: any) {
      console.error('[UserService] Error updating user profile for UID ' + uid + ':', error);
      throw new Error('Failed to update user profile: ' + error.message);
    }
  }

  async deleteUserProfile(uid: string): Promise<void> {
    try {
      console.log('[UserService] Attempting to delete profile for UID: ' + uid);
      // Consider adding checks here, e.g., ensuring the user exists before attempting deletion
      // or if the requesting user has permission (if called by an admin).
      await this.userRepository.delete(uid);
      console.log('[UserService] User profile deleted successfully for UID: ' + uid);
      // Reminder: Firebase Auth user deletion is separate and typically handled by admin SDK in a secure context.
    } catch (error: any) {
      console.error('[UserService] Error deleting user profile for UID ' + uid + ':', error);
      throw new Error('Failed to delete user profile: ' + error.message);
    }
  }
}
