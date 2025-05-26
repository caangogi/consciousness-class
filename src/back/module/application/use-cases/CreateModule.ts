// src/back/module/application/use-cases/CreateModule.ts

import { IModuleRepository } from '../../domain/IModuleRepository';
import { CreateModuleDTO } from '../dto/CreateModuleDTO';
import { Module } from '../../domain/Module';
import { UniqueEntityID } from '../../../share/utils/UniqueEntityID';
import { Result } from '../../../share/utils/Result';

export class CreateModule {
  constructor(private repo: IModuleRepository) {}
  public async execute(dto: CreateModuleDTO): Promise<Result<string, Error>> {
    const moduleOrError = Module.create(
      {
        courseId: dto.courseId,
        title: dto.title,
        order: dto.order,
        description: dto.description
      },
      new UniqueEntityID()
    );
    if (moduleOrError.isFailure) {
      return Result.err(moduleOrError.error);
    }
    const module = moduleOrError.getValue();
    await this.repo.save(module);
    return Result.ok(module.moduleId);
  }
}
