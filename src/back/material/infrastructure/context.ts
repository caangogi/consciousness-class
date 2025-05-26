import { FirebaseMaterialRepository } from './FirebaseMaterialRepository';
import { MaterialService } from '../application/MaterialService';

const materialRepo = new FirebaseMaterialRepository();
export const materialService = new MaterialService(materialRepo);