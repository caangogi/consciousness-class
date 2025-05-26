import { Course } from './Course';
import { UniqueEntityID } from '../../share/utils/UniqueEntityID';

export interface ICourseRepository {
  save(course: Course): Promise<void>;
  findById(id: UniqueEntityID): Promise<Course | null>;
  findAllByInstructor(instructorId: string): Promise<Course[]>;
  delete(id: UniqueEntityID): Promise<void>;
}