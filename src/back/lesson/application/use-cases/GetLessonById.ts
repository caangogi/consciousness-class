// src/back/lesson/application/use-cases/GetLessonById.ts

import { ILessonRepository } from '../../domain/ILessonRepository';
import { Result } from '../../../share/utils/Result';
import { UniqueEntityID } from '../../../share/utils/UniqueEntityID';

export class GetLessonById {
  constructor(private repo: ILessonRepository) {}

  public async execute(lessonId: string): Promise<Result<import('../../domain/Lesson').Lesson, Error>> {
    const lesson = await this.repo.findById(new UniqueEntityID(lessonId));
    if (!lesson) {
      return Result.err(new Error('Lesson not found'));
    }
    return Result.ok(lesson);
  }
}
