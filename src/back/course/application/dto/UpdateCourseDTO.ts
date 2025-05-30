import { MembershipDetails } from '../../domain/Course';

export interface UpdateCourseDTO {
  courseId: string; // ID del curso a actualizar
  title?: string;
  description?: string;
  coverImageUrl?: string;
  price?: number;
  language?: string;
  level?: string;
  tags?: string[];
  whatYouWillLearn?: string[];
  whyChooseThisCourse?: string[];
  idealFor?: string[];
  type?: 'course' | 'membership';
  membershipDetails?: MembershipDetails;
}