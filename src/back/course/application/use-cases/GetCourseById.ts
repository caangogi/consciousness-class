import { ICourseRepository } from '../../domain/ICourseRepository';
import { UniqueEntityID } from '../../../share/utils/UniqueEntityID';
import { Result } from '../../../share/utils/Result';

export class GetCourseById {
  constructor(private repo: ICourseRepository) {}

  async execute(id: string): Promise<Result<any, Error>> {
    try {
      const uid = new UniqueEntityID(id);
      const course = await this.repo.findById(uid);
      if (!course) {
        return Result.err(new Error('Course not found'));
      }
      // map entity to plain object as needed
      return Result.ok(course.toPersistence());
    } catch (err) {
      return Result.err(err as Error);
    }
  }
}