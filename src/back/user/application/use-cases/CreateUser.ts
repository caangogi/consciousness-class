import { CreateUserDTO } from '../dto/CreateUserDTO';
import { IUserRepository } from '../../domain/IUserRepository';
import { Result } from '../../../share/utils/Result';

export class CreateUser {
  constructor(private userRepo: IUserRepository) {}

  async execute(dto: CreateUserDTO): Promise<Result<string, Error>> {
    try {
      const user = await this.userRepo.create(dto);
      return Result.ok(user.id.toString());
    } catch (err) {
      return Result.err(err as Error);
    }
  }
}