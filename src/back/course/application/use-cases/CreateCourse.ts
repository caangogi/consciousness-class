import { CreateCourseDTO } from '../dto/CreateCourseDTO';
import { ICourseRepository } from '../../domain/ICourseRepository';
import { Course } from '../../domain/Course';
import { Result } from '../../../share/utils/Result';

export class CreateCourse {
  constructor(private repo: ICourseRepository) {}
  async execute(dto: CreateCourseDTO): Promise<Result<string, Error>> {
    const courseOrError = Course.create(dto);
    if (courseOrError.isFailure) {
      return Result.err(courseOrError.error);
    }
    const course = courseOrError.getValue();
    await this.repo.save(course);
    return Result.ok(course.id.toString());
  }
}