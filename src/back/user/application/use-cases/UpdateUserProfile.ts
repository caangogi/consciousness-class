import { IUserRepository } from '../../domain/IUserRepository';
import { Result } from '../../../share/utils/Result';

export interface UpdateUserProfileDTO {
  id: string;
  displayName: string;
}

export class UpdateUserProfile {
  constructor(private userRepo: IUserRepository) {}

  async execute(dto: UpdateUserProfileDTO): Promise<Result<void, Error>> {
    try {
      const user = await this.userRepo.findById({ toString: () => dto.id } as any);
      if (!user) {
        return Result.err(new Error('User not found'));
      }
      user.updateProfile(dto.displayName);
      await this.userRepo.update(user);
      return Result.ok();
    } catch (err) {
      return Result.err(err as Error);
    }
  }
}