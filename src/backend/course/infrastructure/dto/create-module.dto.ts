// src/features/course/infrastructure/dto/create-module.dto.ts
export interface CreateModuleDto {
  nombre: string;
  descripcion?: string;
  // courseId will be taken from the route parameter
  // orden will be determined by the service (e.g., appended to the list)
}
