import { MembershipDetails } from '../../domain/Course'; 

export interface CreateCourseDTO {
  title: string;
  description: string;
  coverImageUrl: string;
  price: number;
  language: string;
  level: string;
  instructorId: string; 
  tags?: string[];
  whatYouWillLearn: string[];
  whyChooseThisCourse: string[];
  idealFor: string[];
  type: 'course' | 'membership';
  membershipDetails?: MembershipDetails; 
}