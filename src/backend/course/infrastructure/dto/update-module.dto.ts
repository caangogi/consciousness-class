// src/features/course/infrastructure/dto/update-module.dto.ts
export interface UpdateModuleDto {
  nombre?: string;
  descripcion?: string;
  // orden?: number; // Reordering might be a separate operation/endpoint
}
