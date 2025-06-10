
// src/features/user/domain/repositories/user.repository.ts
import type { UserEntity, UserProperties } from '../entities/user.entity';

export interface IUserRepository {
  save(user: UserEntity): Promise<void>;
  findByUid(uid: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  update(uid: string, data: Partial<Omit<UserProperties, 'uid' | 'email' | 'createdAt'>>): Promise<UserEntity | null>;
  delete(uid: string): Promise<void>;
  // getAll? (consider pagination for superadmin)
}
