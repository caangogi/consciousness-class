// src/back/lesson/application/use-cases/UpdateLesson.ts

import { ILessonRepository } from '../../domain/ILessonRepository';
import { UpdateLessonDTO } from '../dto';
import { UniqueEntityID } from '../../../share/utils/UniqueEntityID';
import { Result } from '../../../share/utils/Result';

export class UpdateLesson {
  constructor(private repo: ILessonRepository) {}

  public async execute(dto: UpdateLessonDTO): Promise<Result<void, Error>> {
    const lesson = await this.repo.findById(new UniqueEntityID(dto.lessonId));
    if (!lesson) {
      return Result.err(new Error('Lesson not found'));
    }
    lesson.updateDetails(dto.title, dto.content, dto.overview, dto.faqs);
    await this.repo.save(lesson);
    return Result.ok(undefined);
  }
}
