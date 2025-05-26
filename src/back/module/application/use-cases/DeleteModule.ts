// src/back/module/application/use-cases/DeleteModule.ts
import { IModuleRepository } from '../../domain/IModuleRepository';
import { DeleteModuleDTO } from '../dto/DeleteModuleDTO';
import { UniqueEntityID } from '../../../share/utils/UniqueEntityID';
import { Result } from '../../../share/utils/Result';

export class DeleteModule {
  constructor(private repo: IModuleRepository) {}

  public async execute(dto: DeleteModuleDTO): Promise<Result<void, Error>> {
    await this.repo.delete(new UniqueEntityID(dto.moduleId));
    return Result.ok(undefined);
  }
}
