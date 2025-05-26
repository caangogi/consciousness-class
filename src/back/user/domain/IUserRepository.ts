import { User } from './User';
import { UniqueEntityID } from '@back/share/utils/UniqueEntityID';
import { CreateUserDTO } from '../application/dto/CreateUserDTO';

export interface IUserRepository {
    create(dto: CreateUserDTO): Promise<User>;
    findById(id: UniqueEntityID): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    update(user: User): Promise<void>;
    delete(id: UniqueEntityID): Promise<void>;
  }