import { CreateCourse } from './use-cases/CreateCourse';
import { GetCourseById } from './use-cases/GetCourseById';
import { ListCoursesByInstructor } from './use-cases/ListCoursesByInstructor';
import { UpdateCourse } from './use-cases/UpdateCourse';
import { DeleteCourse } from './use-cases/DeleteCourse';
import { ICourseRepository } from '../domain/ICourseRepository';
import { CreateCourseDTO } from './dto/CreateCourseDTO';
import { UpdateCourseDTO } from './use-cases/UpdateCourse';

export class CourseService {
  private createCourseUC: CreateCourse;
  private getCourseUC: GetCourseById;
  private listCoursesUC: ListCoursesByInstructor;
  private updateCourseUC: UpdateCourse;
  private deleteCourseUC: DeleteCourse;

  constructor(repo: ICourseRepository) {
    this.createCourseUC = new CreateCourse(repo);
    this.getCourseUC = new GetCourseById(repo);
    this.listCoursesUC = new ListCoursesByInstructor(repo);
    this.updateCourseUC = new UpdateCourse(repo);
    this.deleteCourseUC = new DeleteCourse(repo);
  }

  register(dto: CreateCourseDTO) {
    return this.createCourseUC.execute(dto);
  }

  getById(id: string) {
    return this.getCourseUC.execute(id);
  }

  listByInstructor(instructorId: string) {
    return this.listCoursesUC.execute(instructorId);
  }

  update(dto: UpdateCourseDTO) {
    return this.updateCourseUC.execute(dto);
  }

  delete(id: string) {
    return this.deleteCourseUC.execute(id);
  }
}