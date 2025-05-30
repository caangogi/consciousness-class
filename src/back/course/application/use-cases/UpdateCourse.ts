import { ICourseRepository } from '../../domain/ICourseRepository';
import { Result } from '../../../share/utils/Result'; // Tu clase Result
import { UpdateCourseDTO } from '../dto/UpdateCourseDTO';
import { CourseProps } from '../../domain/Course';
import { UniqueEntityID } from '@/back/share/utils/UniqueEntityID';

export class UpdateCourse {
  constructor(private repo: ICourseRepository) {}

  async execute(dto: UpdateCourseDTO): Promise<Result<void, Error>> {
    try {
      const course = await this.repo.findById(new UniqueEntityID(dto.courseId));

      if (course === null) {
        return Result.err(new Error(`Course with ID ${dto.courseId} not found.`));
      }

      // 1. Manejar cambios en el tipo (type) y los detalles de membresía (membershipDetails)
      if (dto.type !== undefined) {
        const updateTypeResult = course.updateType(
          dto.type,
          dto.membershipDetails
        );
        // Usamos isFailure y error (como está en tu Result class)
        if (updateTypeResult.isFailure) {
          return Result.err(updateTypeResult.error as Error); // Aseguramos que el tipo de error sea Error
        }
      } else if (dto.membershipDetails !== undefined) {
        if (course.type === 'membership') {
          const updateMembershipResult = course.updateMembershipDetails(dto.membershipDetails);
          // Usamos isFailure y error (como está en tu Result class)
          if (updateMembershipResult.isFailure) {
            return Result.err(updateMembershipResult.error as Error); // Aseguramos que el tipo de error sea Error
          }
        } else {
            return Result.err(new Error('Cannot update membership details for a non-membership course without changing its type.'));
        }
      }

      // 2. Manejar el resto de los campos (que no son 'type' ni 'membershipDetails')
      const detailsToUpdate: Partial<Omit<CourseProps,
        'instructorId' | 'type' | 'membershipDetails' | 'createdAt' | 'updatedAt'
      >> = {};

      if (dto.title !== undefined) detailsToUpdate.title = dto.title;
      if (dto.description !== undefined) detailsToUpdate.description = dto.description;
      if (dto.coverImageUrl !== undefined) detailsToUpdate.coverImageUrl = dto.coverImageUrl;
      if (dto.price !== undefined) detailsToUpdate.price = dto.price;
      if (dto.language !== undefined) detailsToUpdate.language = dto.language;
      if (dto.level !== undefined) detailsToUpdate.level = dto.level;
      if (dto.tags !== undefined) detailsToUpdate.tags = dto.tags;
      if (dto.whatYouWillLearn !== undefined) detailsToUpdate.whatYouWillLearn = dto.whatYouWillLearn;
      if (dto.whyChooseThisCourse !== undefined) detailsToUpdate.whyChooseThisCourse = dto.whyChooseThisCourse;
      if (dto.idealFor !== undefined) detailsToUpdate.idealFor = dto.idealFor;

      if (Object.keys(detailsToUpdate).length > 0) {
        const updateDetailsResult = course.updateDetails(detailsToUpdate);
        // Usamos isFailure y error (como está en tu Result class)
        if (updateDetailsResult.isFailure) {
          return Result.err(updateDetailsResult.error as Error); // Aseguramos que el tipo de error sea Error
        }
      }

      await this.repo.save(course);
      return Result.ok(undefined);
    } catch (err) {
      return Result.err(err instanceof Error ? err : new Error(String(err)));
    }
  }
}