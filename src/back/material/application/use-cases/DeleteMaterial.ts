// src/back/material/application/use-cases/DeleteMaterial.ts

import { IMaterialRepository } from '../../domain/IMaterialRepository';
import { DeleteMaterialDTO } from '../dto';
import { UniqueEntityID } from '../../../share/utils/UniqueEntityID';
import { Result } from '../../../share/utils/Result';

export class DeleteMaterial {
  constructor(private repo: IMaterialRepository) {}

  public async execute(dto: DeleteMaterialDTO): Promise<Result<void, Error>> {
    await this.repo.delete(new UniqueEntityID(dto.materialId));
    return Result.ok(undefined);
  }
}
