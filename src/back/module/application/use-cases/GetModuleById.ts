// src/back/module/application/use-cases/GetModuleById.ts
import { IModuleRepository } from '../../domain/IModuleRepository';
import { UniqueEntityID } from '../../../share/utils/UniqueEntityID';
import { Result } from '../../../share/utils/Result';
import { Module } from '../../domain/Module';

export class GetModuleById {
  constructor(private repo: IModuleRepository) {}

  public async execute(moduleId: string): Promise<Result<Module, Error>> {
    const module = await this.repo.findById(new UniqueEntityID(moduleId));
    if (!module) {
      return Result.err(new Error('Module not found'));
    }
    return Result.ok(module);
  }
}