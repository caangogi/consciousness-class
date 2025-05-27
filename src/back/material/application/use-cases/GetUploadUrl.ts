// src/back/material/application/use-cases/GetUploadUrl.ts

import { IMaterialRepository } from '../../domain/IMaterialRepository';
import { GetUploadUrlDTO } from '../dto';
import { Result } from '../../../share/utils/Result';

export class GetUploadUrl {
  constructor(private repo: IMaterialRepository) {}

  public async execute(dto: GetUploadUrlDTO): Promise<
    Result<{ uploadUrl: string; downloadUrl: string; path: string }, Error>
  > {
    try {
      // Corrected: Pass the entire dto object to the repository method
      const urls = await this.repo.getUploadUrl(dto);
      return Result.ok(urls);
    } catch (err: any) {

      console.log('GetUpload Error:::>', err)

      return Result.err(err);
    }
  }
}
