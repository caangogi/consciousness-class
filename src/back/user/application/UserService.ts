import { CreateUser } from './use-cases/CreateUser';
import { GetUserById } from './use-cases/GetUserById';
import { UpdateUserProfile } from './use-cases/UpdateUserProfile';
import { DeleteUser } from './use-cases/DeleteUser';
import { IUserRepository } from '../domain/IUserRepository';
import { CreateUserDTO } from './dto/CreateUserDTO';

export class UserService {
  private createUserUC: CreateUser;
  private getUserUC: GetUserById;
  private updateProfileUC: UpdateUserProfile;
  private deleteUserUC: DeleteUser;

  constructor(userRepo: IUserRepository) {
    this.createUserUC = new CreateUser(userRepo);
    this.getUserUC = new GetUserById(userRepo);
    this.updateProfileUC = new UpdateUserProfile(userRepo);
    this.deleteUserUC = new DeleteUser(userRepo);
  }

  async register(dto: CreateUserDTO) {
    return this.createUserUC.execute(dto);
  }
  async getById(id: string) {
    return this.getUserUC.execute(id);
  }
  async updateProfile(dto: { id: string; displayName: string }) {
    return this.updateProfileUC.execute(dto);
  }
  async delete(id: string) {
    return this.deleteUserUC.execute(id);
  }
}