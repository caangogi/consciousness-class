
// src/features/user/application/user.service.ts
import { UserEntity, type UserProperties } from '@/features/user/domain/entities/user.entity';
import type { IUserRepository } from '@/features/user/domain/repositories/user.repository';
import type { CreateUserDto } from '@/features/user/infrastructure/dto/create-user.dto';
import type { UpdateUserProfileDto } from '@/features/user/infrastructure/dto/update-user.dto'; // For student profile updates

export class UserService {
  constructor(private readonly userRepository: IUserRepository) {}

  async createUserProfile(dto: CreateUserDto): Promise<UserEntity> {
    // Basic validation or check if user already exists by email (optional, Firebase Auth handles UID uniqueness)
    let existingUser = await this.userRepository.findByUid(dto.uid);
    if (existingUser) {
        // This scenario implies an issue if Firebase Auth succeeded but profile already exists.
        // Could merge or update if needed, or log a warning. For now, return existing.
        console.warn(\`[UserService] Profile for UID \${dto.uid} already exists. Returning existing profile.\`);
        return existingUser;
    }
    
    // Check if user with this email already exists (if UID is different, this is an issue)
    // This is less common now with Firebase Auth handling email uniqueness at auth level.
    // existingUser = await this.userRepository.findByEmail(dto.email);
    // if (existingUser) {
    //   throw new Error(\`User with email \${dto.email} already exists with a different UID.\`);
    // }

    const userEntity = UserEntity.create({
      uid: dto.uid,
      email: dto.email,
      nombre: dto.nombre,
      apellido: dto.apellido,
      role: dto.role || 'student',
      referredBy: dto.referralCode || null,
      // Other fields like cursosComprados, referidosExitosos, balanceCredito will default in UserEntity.create
    });

    await this.userRepository.save(userEntity);
    return userEntity;
  }

  async getUserProfile(uid: string): Promise<UserEntity | null> {
    return this.userRepository.findByUid(uid);
  }

  async updateUserProfile(uid: string, dto: UpdateUserProfileDto): Promise<UserEntity | null> {
    // Here, UpdateUserProfileDto is for student self-updates.
    // For admin updates, you'd use AdminUpdateUserDto and potentially a different service method.
    const dataToUpdate: Partial<Omit<UserProperties, 'uid' | 'email' | 'createdAt'>> = {};
    if (dto.nombre) dataToUpdate.nombre = dto.nombre;
    if (dto.apellido) dataToUpdate.apellido = dto.apellido;
    if (dto.photoURL !== undefined) dataToUpdate.photoURL = dto.photoURL;

    if (Object.keys(dataToUpdate).length === 0) {
        console.warn("[UserService] No data provided for user profile update.");
        return this.userRepository.findByUid(uid); // Or throw error
    }
    
    return this.userRepository.update(uid, dataToUpdate);
  }

  async deleteUserProfile(uid: string): Promise<void> {
    // This should also trigger Firebase Auth user deletion if it's a full account removal.
    // For now, it only handles Firestore profile.
    // Consider if superadmin role is required to delete a user.
    // const user = await this.userRepository.findByUid(uid);
    // if (!user) {
    //   throw new Error(\`User with UID \${uid} not found for deletion.\`);
    // }
    await this.userRepository.delete(uid);
    // TODO: Add Firebase Auth user deletion (e.g., adminAuth.deleteUser(uid))
    // This should be done carefully, perhaps in a separate AdminUserService.
  }
}
