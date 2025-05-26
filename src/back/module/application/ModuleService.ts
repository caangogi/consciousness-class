// src/back/module/application/ModuleService.ts
import { CreateModule } from './use-cases/CreateModule';
import { GetModuleById } from './use-cases/GetModuleById';
import { ListModulesByCourse } from './use-cases/ListModulesByCourse';
import { UpdateModule } from './use-cases/UpdateModule';
import { DeleteModule } from './use-cases/DeleteModule';
import { IModuleRepository } from '../domain/IModuleRepository';
import { CreateModuleDTO } from './dto/CreateModuleDTO';
import { UpdateModuleDTO } from './dto/UpdateModuleDTO';
import { DeleteModuleDTO } from './dto/DeleteModuleDTO';
import { Result } from '../../share/utils/Result';
import { Module } from '../domain/Module';

export class ModuleService {
  private createModuleUseCase: CreateModule;
  private getModuleByIdUseCase: GetModuleById;
  private listModulesUseCase: ListModulesByCourse;
  private updateModuleUseCase: UpdateModule;
  private deleteModuleUseCase: DeleteModule;

  constructor(repo: IModuleRepository) {
    this.createModuleUseCase = new CreateModule(repo);
    this.getModuleByIdUseCase = new GetModuleById(repo);
    this.listModulesUseCase = new ListModulesByCourse(repo);
    this.updateModuleUseCase = new UpdateModule(repo);
    this.deleteModuleUseCase = new DeleteModule(repo);
  }

  public async create(dto: CreateModuleDTO): Promise<Result<string, Error>> {
    return this.createModuleUseCase.execute(dto);
  }

  public async getById(id: string): Promise<Result<Module, Error>> {
    return this.getModuleByIdUseCase.execute(id);
  }

  public async listByCourse(courseId: string): Promise<Result<Module[], Error>> {
    return this.listModulesUseCase.execute({ courseId });
  }

  public async update(dto: UpdateModuleDTO): Promise<Result<void, Error>> {
    return this.updateModuleUseCase.execute(dto);
  }

  public async delete(dto: DeleteModuleDTO): Promise<Result<void, Error>> {
    return this.deleteModuleUseCase.execute(dto);
  }
}
