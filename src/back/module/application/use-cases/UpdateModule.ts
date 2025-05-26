// src/back/module/application/use-cases/UpdateModule.ts
import { IModuleRepository } from '../../domain/IModuleRepository';
import { UpdateModuleDTO } from '../dto/UpdateModuleDTO';
import { UniqueEntityID } from '../../../share/utils/UniqueEntityID';
import { Result } from '../../../share/utils/Result';

export class UpdateModule {
  constructor(private repo: IModuleRepository) {}

  public async execute(dto: UpdateModuleDTO): Promise<Result<void, Error>> {
    const module = await this.repo.findById(new UniqueEntityID(dto.moduleId));
    if (!module) {
      return Result.err(new Error('Module not found'));
    }
    module.updateDetails(dto.title, dto.description, dto.isPublished);
    await this.repo.save(module);
    return Result.ok(undefined);
  }
}
