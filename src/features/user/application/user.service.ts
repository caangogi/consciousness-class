
// src/features/user/application/user.service.ts
import { UserEntity, type UserProperties } from '@/features/user/domain/entities/user.entity';
import type { IUserRepository } from '@/features/user/domain/repositories/user.repository';
import type { CreateUserDto } from '@/features/user/infrastructure/dto/create-user.dto';
import type { UpdateUserProfileDto } from '@/features/user/infrastructure/dto/update-user.dto'; 

export class UserService {
  constructor(private readonly userRepository: IUserRepository) {}

  async createUserProfile(dto: CreateUserDto): Promise<UserEntity> {
    try {
      const existingUserByUid = await this.userRepository.findByUid(dto.uid);
      if (existingUserByUid) {
        console.warn(`[UserService] Profile for UID ${dto.uid} already exists. Returning existing profile.`);
        return existingUserByUid;
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
        referredBy: dto.referralCode || null,
      });

      await this.userRepository.save(userEntity);
      console.log(`[UserService] User profile created successfully for UID: ${userEntity.uid}`);
      return userEntity;

    } catch (error: any) {
      console.error(`[UserService] Error creating user profile for UID ${dto.uid}:`, error);
      // Re-throw the error to be handled by the API layer or a global error handler
      // Potentially wrap it in a custom application-specific error
      throw new Error(`Failed to create user profile: ${error.message}`);
    }
  }

  async getUserProfile(uid: string): Promise<UserEntity | null> {
    try {
      return await this.userRepository.findByUid(uid);
    } catch (error: any) {
      console.error(`[UserService] Error fetching user profile for UID ${uid}:`, error);
      throw new Error(`Failed to fetch user profile: ${error.message}`);
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
          return this.userRepository.findByUid(uid); 
      }
      
      const updatedUser = await this.userRepository.update(uid, dataToUpdate);
      if (updatedUser) {
        console.log(`[UserService] User profile updated successfully for UID: ${uid}`);
      }
      return updatedUser;

    } catch (error: any) {
      console.error(`[UserService] Error updating user profile for UID ${uid}:`, error);
      throw new Error(`Failed to update user profile: ${error.message}`);
    }
  }

  async deleteUserProfile(uid: string): Promise<void> {
    try {
      // Consider adding checks here, e.g., ensuring the user exists before attempting deletion
      // or if the requesting user has permission (if called by an admin).
      await this.userRepository.delete(uid);
      console.log(`[UserService] User profile deleted successfully for UID: ${uid}`);
      // Reminder: Firebase Auth user deletion is separate and typically handled by admin SDK in a secure context.
    } catch (error: any) {
      console.error(`[UserService] Error deleting user profile for UID ${uid}:`, error);
      throw new Error(`Failed to delete user profile: ${error.message}`);
    }
  }
}
