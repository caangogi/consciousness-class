// src/back/material/application/use-cases/ListMaterialsByLesson.ts

import { IMaterialRepository } from '../../domain/IMaterialRepository';
import { ListMaterialsByLessonDTO } from '../dto';
import { Result } from '../../../share/utils/Result';

export class ListMaterialsByLesson {
  constructor(private repo: IMaterialRepository) {}

  public async execute(dto: ListMaterialsByLessonDTO): Promise<Result<import('../../domain/Material').Material[], Error>> {
    const materials = await this.repo.findAllByLesson(dto.lessonId);
    return Result.ok(materials);
  }
}
