// src/back/lesson/domain/ILessonRepository.ts

import { Lesson } from './Lesson';
import {
  GetLessonByIdDTO,
  ListLessonsByModuleDTO,
  DeleteLessonDTO
} from '../application/dto';

export interface ILessonRepository {
  save(lesson: Lesson): Promise<void>;
  findById(dto: GetLessonByIdDTO): Promise<Lesson | null>;
  findAllByModule(dto: ListLessonsByModuleDTO): Promise<Lesson[]>;
  delete(dto: DeleteLessonDTO): Promise<void>;
}
