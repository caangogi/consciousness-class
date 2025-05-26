// src/back/lesson/application/LessonService.ts

import { CreateLesson } from './use-cases/CreateLesson';
import { GetLessonById } from './use-cases/GetLessonById';
import { ListLessonsByModule } from './use-cases/ListLessonsByModule';
import { UpdateLesson } from './use-cases/UpdateLesson';
import { DeleteLesson } from './use-cases/DeleteLesson';
import { ILessonRepository } from '../domain/ILessonRepository';
import {
  CreateLessonDTO,
  GetLessonByIdDTO,
  ListLessonsByModuleDTO,
  UpdateLessonDTO,
  DeleteLessonDTO
} from './dto';
import { Result } from '../../share/utils/Result';
import { Lesson } from '../domain/Lesson';

export class LessonService {
  private createUseCase: CreateLesson;
  private getByIdUseCase: GetLessonById;
  private listByModuleUseCase: ListLessonsByModule;
  private updateUseCase: UpdateLesson;
  private deleteUseCase: DeleteLesson;

  constructor(repo: ILessonRepository) {
    this.createUseCase = new CreateLesson(repo);
    this.getByIdUseCase = new GetLessonById(repo);
    this.listByModuleUseCase = new ListLessonsByModule(repo);
    this.updateUseCase = new UpdateLesson(repo);
    this.deleteUseCase = new DeleteLesson(repo);
  }

  public async create(dto: CreateLessonDTO): Promise<Result<string, Error>> {
    return this.createUseCase.execute(dto);
  }

  public async getById(dto: GetLessonByIdDTO): Promise<Result<Lesson, Error>> {
    return this.getByIdUseCase.execute(dto.lessonId);
  }

  public async listByModule(dto: ListLessonsByModuleDTO): Promise<Result<Lesson[], Error>> {
    return this.listByModuleUseCase.execute(dto);
  }

  public async update(dto: UpdateLessonDTO): Promise<Result<void, Error>> {
    return this.updateUseCase.execute(dto);
  }

  public async delete(dto: DeleteLessonDTO): Promise<Result<void, Error>> {
    return this.deleteUseCase.execute(dto);
  }
}
