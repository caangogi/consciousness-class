import { IUserRepository } from '../../domain/IUserRepository';
import { UniqueEntityID } from '../../../share/utils/UniqueEntityID';
import { Result } from '../../../share/utils/Result';

export class GetUserById {
  constructor(private userRepo: IUserRepository) {}

  async execute(id: string): Promise<Result<any, Error>> {
    try {
      const uid = new UniqueEntityID(id);
      const user = await this.userRepo.findById(uid);
      if (!user) {
        return Result.err(new Error('User not found'));
      }
      return Result.ok({
        id: user.id.toString(),
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      });
    } catch (err) {
      return Result.err(err as Error);
    }
  }
}