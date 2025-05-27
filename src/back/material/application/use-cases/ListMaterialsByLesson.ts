// src/back/material/application/use-cases/ListMaterialsByLesson.ts

import { IMaterialRepository } from '../../domain/IMaterialRepository';
import { ListMaterialsByLessonDTO } from '../dto';
import { Result } from '../../../share/utils/Result';
import { Material } from '../../domain/Material';

export class ListMaterialsByLesson {
  constructor(private repo: IMaterialRepository) {}

  public async execute(dto: ListMaterialsByLessonDTO): Promise<Result<Material[], Error>> {
    try {
      // Corrected: Pass the entire dto object to the repository method
      const materials = await this.repo.findAllByLesson(dto);
      return Result.ok(materials);
    } catch (err: any) {
      return Result.err(err);
    }
  }
}
