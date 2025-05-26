import { ICourseRepository } from '../../domain/ICourseRepository';
import { Result } from '../../../share/utils/Result';

export interface UpdateCourseDTO {
  id: string;
  title?: string;
  description?: string;
  coverImageUrl?: string;
  price?: number;
  language?: string;
  level?: string;
  tags?: string[];
  whatYouWillLearn?: string[];
  whyChooseThisCourse?: string[];
  idealFor?: string[];
  enrollCallToAction?: string;
}

export class UpdateCourse {
  constructor(private repo: ICourseRepository) {}

  async execute(dto: UpdateCourseDTO): Promise<Result<void, Error>> {
    try {
      const course = await this.repo.findById({ toString: () => dto.id } as any);
      if (!course) {
        return Result.err(new Error('Course not found'));
      }
      course.updateDetails(dto);
      await this.repo.save(course);
      return Result.ok();
    } catch (err) {
      return Result.err(err as Error);
    }
  }
}