// src/back/material/application/MaterialService.ts

import { GetUploadUrl } from './use-cases/GetUploadUrl';
import { CreateMaterial } from './use-cases/CreateMaterial';
import { GetMaterialById } from './use-cases/GetMaterialById';
import { ListMaterialsByLesson } from './use-cases/ListMaterialsByLesson';
import { UpdateMaterial } from './use-cases/UpdateMaterial';
import { DeleteMaterial } from './use-cases/DeleteMaterial';
import { IMaterialRepository } from '../domain/IMaterialRepository';
import {
  GetUploadUrlDTO,
  CreateMaterialDTO,
  GetMaterialByIdDTO,
  ListMaterialsByLessonDTO,
  UpdateMaterialDTO,
  DeleteMaterialDTO
} from './dto';
import { Result } from '../../share/utils/Result';
import { Material } from '../domain/Material';

export class MaterialService {
  private getUploadUrlUC: GetUploadUrl;
  private createUC: CreateMaterial;
  private getByIdUC: GetMaterialById;
  private listByLessonUC: ListMaterialsByLesson;
  private updateUC: UpdateMaterial;
  private deleteUC: DeleteMaterial;

  constructor(repo: IMaterialRepository) {
    this.getUploadUrlUC = new GetUploadUrl(repo);
    this.createUC = new CreateMaterial(repo);
    this.getByIdUC = new GetMaterialById(repo);
    this.listByLessonUC = new ListMaterialsByLesson(repo);
    this.updateUC = new UpdateMaterial(repo);
    this.deleteUC = new DeleteMaterial(repo);
  }

  public async getUploadUrl(dto: GetUploadUrlDTO): Promise<Result<{uploadUrl:string;downloadUrl:string;path:string},Error>> {
    return this.getUploadUrlUC.execute(dto);
  }

  public async create(dto: CreateMaterialDTO): Promise<Result<string, Error>> {
    return this.createUC.execute(dto);
  }

  public async getById(dto: GetMaterialByIdDTO): Promise<Result<Material, Error>> {
    return this.getByIdUC.execute(dto);
  }

  public async listByLesson(dto: ListMaterialsByLessonDTO): Promise<Result<Material[], Error>> {
    return this.listByLessonUC.execute(dto);
  }

  public async update(dto: UpdateMaterialDTO): Promise<Result<void, Error>> {
    return this.updateUC.execute(dto);
  }

  public async delete(dto: DeleteMaterialDTO): Promise<Result<void, Error>> {
    return this.deleteUC.execute(dto);
  }
}
