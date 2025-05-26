import { ICourseRepository } from '../../domain/ICourseRepository';
import { Result } from '../../../share/utils/Result';

export class DeleteCourse {
  constructor(private repo: ICourseRepository) {}

  async execute(id: string): Promise<Result<void, Error>> {
    try {
      await this.repo.delete({ toString: () => id } as any);
      return Result.ok();
    } catch (err) {
      return Result.err(err as Error);
    }
  }
}