import { FirebaseModuleRepository } from './FirebaseModuleRepository';
import { ModuleService } from '../application/ModuleService';

// Creamos una única instancia de repositorio y servicio
const moduleRepo = new FirebaseModuleRepository();
export const moduleService = new ModuleService(moduleRepo);