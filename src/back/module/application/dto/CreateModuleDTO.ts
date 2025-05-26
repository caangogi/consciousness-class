export interface CreateModuleDTO {
    courseId: string;
    title: string;
    order: number;
    description?: string;
    isPublished?: boolean;
    createdAt?: Date;
  }