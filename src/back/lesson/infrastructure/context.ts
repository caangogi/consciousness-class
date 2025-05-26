// src/back/lesson/infrastructure/context.ts

import { FirebaseLessonRepository } from './FirebaseLessonRepository';
import { LessonService } from '../application/LessonService';

const lessonRepo = new FirebaseLessonRepository();
export const lessonService = new LessonService(lessonRepo);
