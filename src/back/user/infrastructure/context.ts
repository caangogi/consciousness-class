
import { FirebaseUserRepository } from './FirebaseUserRepository';
import { UserService } from '../application/UserService';

const userRepo = new FirebaseUserRepository();
export const userService = new UserService(userRepo);