  // src/back/module/application/dto/UpdateModuleDTO.ts
  export interface UpdateModuleDTO {
    moduleId: string;
    title: string;
    description?: string;
    isPublished?: boolean;
  }