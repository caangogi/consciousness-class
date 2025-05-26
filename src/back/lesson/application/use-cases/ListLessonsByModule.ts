// src/back/lesson/application/use-cases/ListLessonsByModule.ts

import { ILessonRepository } from '../../domain/ILessonRepository';
import { ListLessonsByModuleDTO } from '../dto';
import { Result } from '../../../share/utils/Result';

export class ListLessonsByModule {
  constructor(private repo: ILessonRepository) {}

  public async execute(dto: ListLessonsByModuleDTO): Promise<Result<import('../../domain/Lesson').Lesson[], Error>> {
    const lessons = await this.repo.findAllByModule(dto.moduleId);
    return Result.ok(lessons);
  }
}
