import { ICourseRepository } from '../../domain/ICourseRepository';
import { Result } from '../../../share/utils/Result';

export class ListCoursesByInstructor {
  constructor(private repo: ICourseRepository) {}

  async execute(instructorId: string): Promise<Result<any[], Error>> {
    try {
      const courses = await this.repo.findAllByInstructor(instructorId);
      return Result.ok(courses.map(c => c.toPersistence()));
    } catch (err) {
      return Result.err(err as Error);
    }
  }
}