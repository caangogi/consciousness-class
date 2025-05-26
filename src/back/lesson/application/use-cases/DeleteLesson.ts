// src/back/lesson/application/use-cases/DeleteLesson.ts

import { ILessonRepository } from '../../domain/ILessonRepository';
import { DeleteLessonDTO } from '../dto';
import { UniqueEntityID } from '../../../share/utils/UniqueEntityID';
import { Result } from '../../../share/utils/Result';

export class DeleteLesson {
  constructor(private repo: ILessonRepository) {}

  public async execute(dto: DeleteLessonDTO): Promise<Result<void, Error>> {
    await this.repo.delete(new UniqueEntityID(dto.lessonId));
    return Result.ok(undefined);
  }
}
