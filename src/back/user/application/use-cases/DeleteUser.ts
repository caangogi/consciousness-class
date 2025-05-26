import { IUserRepository } from '../../domain/IUserRepository';
import { Result } from '../../../share/utils/Result';

export class DeleteUser {
  constructor(private userRepo: IUserRepository) {}

  async execute(id: string): Promise<Result<void, Error>> {
    try {
      await this.userRepo.delete({ toString: () => id } as any);
      return Result.ok();
    } catch (err) {
      return Result.err(err as Error);
    }
  }
}