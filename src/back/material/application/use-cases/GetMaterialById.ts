// src/back/material/application/use-cases/GetMaterialById.ts

import { IMaterialRepository } from '../../domain/IMaterialRepository';
import { GetMaterialByIdDTO } from '../dto';
import { UniqueEntityID } from '../../../share/utils/UniqueEntityID';
import { Result } from '../../../share/utils/Result';

export class GetMaterialById {
  constructor(private repo: IMaterialRepository) {}

  public async execute(dto: GetMaterialByIdDTO): Promise<Result<import('../../domain/Material').Material, Error>> {
    const material = await this.repo.findById(new UniqueEntityID(dto.materialId));
    if (!material) {
      return Result.err(new Error('Material not found'));
    }
    return Result.ok(material);
  }
}
