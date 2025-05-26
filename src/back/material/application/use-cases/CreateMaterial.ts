// src/back/material/application/use-cases/CreateMaterial.ts

import { IMaterialRepository } from '../../domain/IMaterialRepository';
import { CreateMaterialDTO } from '../dto';
import { Material } from '../../domain/Material';
import { UniqueEntityID } from '../../../share/utils/UniqueEntityID';
import { Result } from '../../../share/utils/Result';

export class CreateMaterial {
  constructor(private repo: IMaterialRepository) {}

  public async execute(dto: CreateMaterialDTO): Promise<Result<string, Error>> {
    const matOrError = Material.create(
      {
        courseId: dto.courseId,
        moduleId: dto.moduleId,
        lessonId: dto.lessonId,
        type: dto.type,
        url: dto.url,
        metadata: dto.metadata
      },
      new UniqueEntityID()
    );
    if (matOrError.isFailure) {
      return Result.err(matOrError.error);
    }
    const material = matOrError.getValue();
    await this.repo.save(material);
    return Result.ok(material.materialId);
  }
}
