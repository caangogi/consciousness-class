// src/back/material/application/use-cases/UpdateMaterial.ts

import { IMaterialRepository } from '../../domain/IMaterialRepository';
import { UpdateMaterialDTO } from '../dto';
import { UniqueEntityID } from '../../../share/utils/UniqueEntityID';
import { Result } from '../../../share/utils/Result';

export class UpdateMaterial {
  constructor(private repo: IMaterialRepository) {}

  public async execute(dto: UpdateMaterialDTO): Promise<Result<void, Error>> {
    const material = await this.repo.findById(new UniqueEntityID(dto.materialId));
    if (!material) {
      return Result.err(new Error('Material not found'));
    }
    if (dto.url) {
      material.updateUrl(dto.url);
    }
    if (dto.metadata) {
      // Asume que Material tiene un método para actualizar metadata si lo necesitas
      material.updateMetadata(dto.metadata);
    }
    await this.repo.save(material);
    return Result.ok(undefined);
  }
}
