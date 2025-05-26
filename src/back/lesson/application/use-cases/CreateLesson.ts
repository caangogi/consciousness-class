// src/back/lesson/application/use-cases/CreateLesson.ts

import { ILessonRepository } from '../../domain/ILessonRepository';
import { CreateLessonDTO } from '../dto';
import { Lesson } from '../../domain/Lesson';
import { UniqueEntityID } from '../../../share/utils/UniqueEntityID';
import { Result } from '../../../share/utils/Result';

export class CreateLesson {
  constructor(private repo: ILessonRepository) {}

  public async execute(dto: CreateLessonDTO): Promise<Result<string, Error>> {
    const lessonOrError = Lesson.create(
      {
        courseId: dto.courseId,
        moduleId: dto.moduleId,
        title: dto.title,
        content: dto.content,
        order: dto.order,
        overview: dto.overview,
        faqs: dto.faqs
      },
      new UniqueEntityID()
    );
    if (lessonOrError.isFailure) {
      return Result.err(lessonOrError.error);
    }
    const lesson = lessonOrError.getValue();
    await this.repo.save(lesson);
    return Result.ok(lesson.lessonId);
  }
}
