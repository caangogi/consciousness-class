// src/back/module/application/use-cases/ListModulesByCourse.ts
import { IModuleRepository } from '../../domain/IModuleRepository';
import { ListModulesByCourseDTO } from '../dto/ListModulesByCourseDTO';
import { Result } from '../../../share/utils/Result';
import { Module } from '../../domain/Module';

export class ListModulesByCourse {
  constructor(private repo: IModuleRepository) {}

  public async execute(dto: ListModulesByCourseDTO): Promise<Result<Module[], Error>> {
    const modules = await this.repo.findAllByCourse(dto.courseId);
    return Result.ok(modules);
  }
}
