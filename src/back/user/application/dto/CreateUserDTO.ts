import { Role } from '../../domain/Role';

export interface CreateUserDTO {
  email: string;
  password: string;
  displayName: string;
  role: Role;
}