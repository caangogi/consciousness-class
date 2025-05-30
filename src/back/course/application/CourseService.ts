import { CreateCourse } from './use-cases/CreateCourse';
import { GetCourseById } from './use-cases/GetCourseById';
import { ListCoursesByInstructor } from './use-cases/ListCoursesByInstructor';
import { UpdateCourse } from './use-cases/UpdateCourse';
import { DeleteCourse } from './use-cases/DeleteCourse';
import { ICourseRepository } from '../domain/ICourseRepository';
import { CreateCourseDTO } from './dto/CreateCourseDTO';
import { UpdateCourseDTO } from './dto/UpdateCourseDTO'; // <--- CORREGIDO: Importar desde el directorio DTO
import { Result } from '../../share/utils/Result'; // Añadir si no está (aunque ya la tienes)
import { Course } from '../domain/Course'; // Añadir si no está (aunque ya la tienes)

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

  register(dto: CreateCourseDTO): Promise<Result<string, Error>> { // Añadir tipo de retorno explícito
    return this.createCourseUC.execute(dto);
  }

  getById(id: string): Promise<Result<Course, Error>> { // Añadir tipo de retorno explícito
    return this.getCourseUC.execute(id);
  }

  listByInstructor(instructorId: string): Promise<Result<Course[], Error>> { // Añadir tipo de retorno explícito
    return this.listCoursesUC.execute(instructorId);
  }

  update(dto: UpdateCourseDTO): Promise<Result<void, Error>> { // Añadir tipo de retorno explícito
    return this.updateCourseUC.execute(dto);
  }

  delete(id: string): Promise<Result<void, Error>> { // Añadir tipo de retorno explícito
    return this.deleteCourseUC.execute(id);
  }
}