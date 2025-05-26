import { FirebaseCourseRepository } from './FirebaseCourseRepository';
import { CourseService } from '../application/CourseService';

const courseRepo = new FirebaseCourseRepository();
export const courseService = new CourseService(courseRepo);